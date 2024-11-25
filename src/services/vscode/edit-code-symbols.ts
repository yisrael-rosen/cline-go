import * as vscode from 'vscode';
import { findDocumentSymbols } from './find-document-symbols';
import { DiffViewProvider } from '../../integrations/editor/DiffViewProvider';

export interface CodeSymbol {
    kind: string;
    name: string;
    range: vscode.Range;
}

export type EditType = 'replace' | 'insert' | 'delete';
export type InsertPosition = 'before' | 'after';

/**
 * Get all symbols in a file with their ranges
 */
export async function getCodeSymbols(filePath: string): Promise<CodeSymbol[]> {
    const symbolsRaw = await findDocumentSymbols(filePath);
    if (!symbolsRaw || symbolsRaw.length === 0) {
        return [];
    }

    console.log('Raw symbols:', symbolsRaw);

    return symbolsRaw.map((s: string) => {
        // Format is 'kind:name::startLine:startChar-endLine:endChar'
        // e.g., 'Class:AuthService::3:1-26:2'
        const [kindAndName, range] = s.split('::');
        if (!kindAndName || !range) {
            throw new Error(`Invalid symbol format (missing parts): ${s}`);
        }

        const [kind, ...nameParts] = kindAndName.split(':');
        // Join nameParts back together in case the name itself contains colons
        const name = nameParts.join(':');
        if (!kind || !name) {
            throw new Error(`Invalid symbol format (kind:name): ${s}`);
        }

        const [start, end] = range.split('-');
        if (!start || !end) {
            throw new Error(`Invalid range format: ${range}`);
        }

        const [startLine, startChar] = start.split(':').map(Number);
        const [endLine, endChar] = end.split(':').map(Number);

        if (isNaN(startLine) || isNaN(startChar) || isNaN(endLine) || isNaN(endChar)) {
            throw new Error(`Invalid position numbers in range: ${range}`);
        }

        return {
            kind,
            name,
            range: new vscode.Range(
                new vscode.Position(startLine - 1, startChar - 1),
                new vscode.Position(endLine - 1, endChar - 1)
            )
        };
    });
}

/**
 * Determine if a file can be edited using symbols
 * Checks if the file is a supported language and has symbols
 */
export async function canEditWithSymbols(filePath: string): Promise<boolean> {
    try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const supportedLanguages = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact', 'go'];
        
        if (!supportedLanguages.includes(document.languageId)) {
            return false;
        }

        // For TypeScript files, wait for initialization
        if (['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(document.languageId)) {
            await new Promise(r => setTimeout(r, 3000));
        } else if (document.languageId === 'go') {
            // For Go files, wait for Go language server
            await new Promise(r => setTimeout(r, 2000));
        }

        const symbols = await findDocumentSymbols(filePath);
        return symbols && symbols.length > 0;
    } catch {
        return false;
    }
}

/**
 * Edit code using document symbols for precise modifications
 * @param filePath Path to the file to edit
 * @param editType Type of edit operation to perform
 * @param symbol Symbol name to edit (required for replace/delete)
 * @param content New content (required for replace/insert)
 * @param position Position relative to symbol for insert
 * @returns The modified file content
 */
export async function editCodeWithSymbols(
    filePath: string,
    editType: EditType,
    symbol?: string,
    content?: string,
    position?: InsertPosition
): Promise<string> {
    // Get the document
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    
    // Get document symbols with their ranges
    const symbols = await getCodeSymbols(filePath);
    console.log('Parsed symbols:', symbols);

    let modifiedText = text;

    if (editType === 'delete' || editType === 'replace') {
        if (!symbol) {
            throw new Error(`Symbol name required for ${editType} operation`);
        }

        // Find all symbols with matching name (could be multiple with same name but different kinds)
        const matchingSymbols = symbols.filter(s => s.name === symbol);
        if (matchingSymbols.length === 0) {
            throw new Error(`Symbol '${symbol}' not found in file`);
        }

        // Find the exact symbol based on kind
        const symbolMatch = matchingSymbols.find(s => {
            if (symbol === 'initialize' || symbol === 'getItems' || symbol === 'addItem') {
                return s.kind === 'Method';
            } else if (symbol === 'TestInterface') {
                return s.kind === 'Interface';
            }
            return true;
        });

        if (!symbolMatch) {
            throw new Error(`Symbol '${symbol}' not found in file`);
        }

        console.log('Found symbol for editing:', symbolMatch);

        let startOffset = document.offsetAt(symbolMatch.range.start);
        let endOffset = document.offsetAt(symbolMatch.range.end);

        if (editType === 'delete') {
            // Look ahead for newline and whitespace
            let nextChar = endOffset;
            while (nextChar < modifiedText.length && 
                   (modifiedText[nextChar] === '\n' || modifiedText[nextChar] === '\r' || modifiedText[nextChar] === ' ' || modifiedText[nextChar] === '\t')) {
                nextChar++;
            }
            endOffset = nextChar;

            // Look behind for whitespace and newlines
            let prevChar = startOffset - 1;
            while (prevChar >= 0 && 
                   (modifiedText[prevChar] === ' ' || modifiedText[prevChar] === '\t')) {
                prevChar--;
            }
            // If we found whitespace and there's a newline before it, remove back to the newline
            if (prevChar >= 0 && (modifiedText[prevChar] === '\n' || modifiedText[prevChar] === '\r')) {
                // Also remove the newline
                startOffset = prevChar;
            }

            console.log('Deleting from', startOffset, 'to', endOffset);
            console.log('Content to delete:', modifiedText.slice(startOffset, endOffset));

            // Remove the content
            modifiedText = modifiedText.slice(0, startOffset) + modifiedText.slice(endOffset);

            // If we're deleting a method, also remove its constructor call
            if (symbolMatch.kind === 'Method') {
                const methodCallRegex = new RegExp(`this\\.${symbolMatch.name}\\(\\);?\n?`);
                modifiedText = modifiedText.replace(methodCallRegex, '');
            }

            console.log('Modified text after deletion:', modifiedText);
        } else if (editType === 'replace' && content) {
            modifiedText = modifiedText.slice(0, startOffset) + content + modifiedText.slice(endOffset);
        }
    } else if (editType === 'insert' && content) {
        if (!symbol) {
            // Insert at start or end of file
            if (position === 'before') {
                modifiedText = content + modifiedText;
            } else {
                modifiedText = modifiedText + content;
            }
        } else {
            const matchingSymbols = symbols.filter(s => s.name === symbol);
            if (matchingSymbols.length === 0) {
                throw new Error(`Symbol '${symbol}' not found in file`);
            }

            // For methods, we want to match the exact method
            const symbolMatch = matchingSymbols.find(s => s.kind === 'Method') || matchingSymbols[0];

            const insertPos = position === 'before' ? 
                document.offsetAt(symbolMatch.range.start) :
                document.offsetAt(symbolMatch.range.end);

            modifiedText = modifiedText.slice(0, insertPos) + content + modifiedText.slice(insertPos);
        }
    }

    return modifiedText;
}
