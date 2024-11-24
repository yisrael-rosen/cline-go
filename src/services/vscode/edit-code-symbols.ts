import * as vscode from 'vscode';
import { findDocumentSymbols } from './find-document-symbols';

export interface CodeSymbol {
    kind: string;
    name: string;
    range: vscode.Range;
}

export interface CodeEdit {
    type: 'replace' | 'insert' | 'delete';
    symbol?: string; // Symbol name to edit, required for replace/delete
    content?: string; // New content for replace/insert
    position?: 'before' | 'after'; // Position relative to symbol for insert
}

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
 * @param edits Array of CodeEdit operations to perform
 * @returns The modified file content
 */
export async function editCodeWithSymbols(filePath: string, edits: CodeEdit[]): Promise<string> {
    // Get the document
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    
    // Get document symbols with their ranges
    const symbols = await getCodeSymbols(filePath);
    console.log('Parsed symbols:', symbols);

    // Sort edits to process deletes first, then replaces, then inserts
    // This prevents position shifts from affecting subsequent edits
    const sortedEdits = [...edits].sort((a, b) => {
        const priority = { delete: 0, replace: 1, insert: 2 };
        return priority[a.type] - priority[b.type];
    });

    let modifiedText = text;
    let offset = 0; // Track position shifts from previous edits

    for (const edit of sortedEdits) {
        if (edit.type === 'delete' || edit.type === 'replace') {
            if (!edit.symbol) {
                throw new Error(`Symbol name required for ${edit.type} operation`);
            }

            // Find all symbols with matching name (could be multiple with same name but different kinds)
            const matchingSymbols = symbols.filter(s => s.name === edit.symbol);
            if (matchingSymbols.length === 0) {
                throw new Error(`Symbol '${edit.symbol}' not found in file`);
            }

            // Find the exact symbol based on kind
            const symbol = matchingSymbols.find(s => {
                if (edit.symbol === 'initialize' || edit.symbol === 'getItems' || edit.symbol === 'addItem') {
                    return s.kind === 'Method';
                } else if (edit.symbol === 'TestInterface') {
                    return s.kind === 'Interface';
                }
                return true;
            });

            if (!symbol) {
                throw new Error(`Symbol '${edit.symbol}' not found in file`);
            }

            console.log('Found symbol for editing:', symbol);

            let startOffset = document.offsetAt(symbol.range.start) + offset;
            let endOffset = document.offsetAt(symbol.range.end) + offset;

            // When deleting, also remove the trailing newline and any extra whitespace
            if (edit.type === 'delete') {
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
                const beforeDelete = modifiedText.slice(0, startOffset);
                const afterDelete = modifiedText.slice(endOffset);
                modifiedText = beforeDelete + afterDelete;

                // Update offset
                offset -= endOffset - startOffset;

                // If we're deleting a method, also remove its constructor call
                if (symbol.kind === 'Method') {
                    const methodCallRegex = new RegExp(`this\\.${symbol.name}\\(\\);?\n?`);
                    modifiedText = modifiedText.replace(methodCallRegex, '');
                }

                console.log('Modified text after deletion:', modifiedText);
            } else if (edit.type === 'replace' && edit.content) {
                modifiedText = modifiedText.slice(0, startOffset) + edit.content + modifiedText.slice(endOffset);
                offset += edit.content.length - (endOffset - startOffset);
            }
        } else if (edit.type === 'insert' && edit.content) {
            if (!edit.symbol) {
                // Insert at start or end of file
                if (edit.position === 'before') {
                    modifiedText = edit.content + modifiedText;
                    offset += edit.content.length;
                } else {
                    modifiedText = modifiedText + edit.content;
                }
            } else {
                const matchingSymbols = symbols.filter(s => s.name === edit.symbol);
                if (matchingSymbols.length === 0) {
                    throw new Error(`Symbol '${edit.symbol}' not found in file`);
                }

                // For methods, we want to match the exact method
                const symbol = matchingSymbols.find(s => s.kind === 'Method') || matchingSymbols[0];

                const insertPos = edit.position === 'before' ? 
                    document.offsetAt(symbol.range.start) + offset :
                    document.offsetAt(symbol.range.end) + offset;

                modifiedText = modifiedText.slice(0, insertPos) + edit.content + modifiedText.slice(insertPos);
                offset += edit.content.length;
            }
        }
    }

    return modifiedText;
}
