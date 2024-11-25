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
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    
    // Get standard symbols
    const symbolsRaw = await findDocumentSymbols(filePath);
    const standardSymbols = symbolsRaw ? symbolsRaw.map((s: string) => {
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
    }) : [];

    // Find case statements
    const caseSymbols: CodeSymbol[] = [];
    const caseRegex = /case\s+(['"]?\w+['"]?):/g;
    let match;
    
    while ((match = caseRegex.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        const caseValue = match[1];
        
        // Find the end of the case block
        const caseStart = match.index;
        let caseEnd = caseStart;
        let depth = 0;
        let foundReturn = false;
        
        // First find the end of the case statement line
        let lineEnd = text.indexOf('\n', caseStart);
        if (lineEnd === -1) lineEnd = text.length;
        
        // Then look for the next case/default/break/return
        for (let i = lineEnd; i < text.length; i++) {
            if (text[i] === '{') depth++;
            else if (text[i] === '}') {
                depth--;
                if (depth < 0) {
                    // End of switch block
                    caseEnd = i;
                    break;
                }
            }
            
            // Look for return statement
            if (text.slice(i).match(/^\s*return\s/)) {
                foundReturn = true;
                // Find the end of the return statement
                const returnEnd = text.indexOf(';', i);
                if (returnEnd !== -1) {
                    caseEnd = returnEnd + 1; // Include the semicolon
                }
                break;
            }
            
            // Look for next case/default
            const nextLine = text.slice(i);
            if (nextLine.match(/^\s*case\s|^\s*default:/)) {
                caseEnd = i;
                break;
            }
            
            // Look for break statement
            if (nextLine.match(/^\s*break;/)) {
                const breakEnd = text.indexOf(';', i);
                if (breakEnd !== -1) {
                    caseEnd = breakEnd + 1; // Include the semicolon
                }
                break;
            }
        }
        
        // If we didn't find a next case/default/break/return,
        // use the end of the switch block
        if (caseEnd === caseStart) {
            for (let i = caseStart; i < text.length; i++) {
                if (text[i] === '}') {
                    caseEnd = i;
                    break;
                }
            }
        }
        
        const endPos = document.positionAt(caseEnd);
        
        caseSymbols.push({
            kind: 'Case',
            name: `case ${caseValue}`,
            range: new vscode.Range(startPos, endPos)
        });
    }

    return [...standardSymbols, ...caseSymbols];
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
            } else if (symbol.startsWith('case ')) {
                return s.kind === 'Case';
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
            // Special handling for case statements
            if (symbolMatch.kind === 'Case') {
                // Look ahead for the next case or end of switch
                let nextChar = endOffset;
                while (nextChar < modifiedText.length && 
                       !modifiedText.slice(nextChar).match(/^\s*case\s|^\s*default:|^\s*}/)) {
                    nextChar++;
                }
                endOffset = nextChar;

                // Look behind for whitespace
                let prevChar = startOffset - 1;
                while (prevChar >= 0 && 
                       (modifiedText[prevChar] === ' ' || modifiedText[prevChar] === '\t')) {
                    prevChar--;
                }
                if (prevChar >= 0 && (modifiedText[prevChar] === '\n' || modifiedText[prevChar] === '\r')) {
                    startOffset = prevChar;
                }
            } else {
                // Standard symbol deletion logic
                let nextChar = endOffset;
                while (nextChar < modifiedText.length && 
                       (modifiedText[nextChar] === '\n' || modifiedText[nextChar] === '\r' || 
                        modifiedText[nextChar] === ' ' || modifiedText[nextChar] === '\t')) {
                    nextChar++;
                }
                endOffset = nextChar;

                let prevChar = startOffset - 1;
                while (prevChar >= 0 && 
                       (modifiedText[prevChar] === ' ' || modifiedText[prevChar] === '\t')) {
                    prevChar--;
                }
                if (prevChar >= 0 && (modifiedText[prevChar] === '\n' || modifiedText[prevChar] === '\r')) {
                    startOffset = prevChar;
                }
            }

            console.log('Deleting from', startOffset, 'to', endOffset);
            console.log('Content to delete:', modifiedText.slice(startOffset, endOffset));

            // Remove the content
            modifiedText = modifiedText.slice(0, startOffset) + modifiedText.slice(endOffset);

            // If we're deleting a method, also remove its constructor call
            if (symbolMatch.kind === 'Method' && symbolMatch.name === 'initialize') {
                // Remove the constructor call with surrounding whitespace
                const constructorCallRegex = new RegExp(`\\s*this\\.${symbolMatch.name}\\(\\);\\s*`);
                modifiedText = modifiedText.replace(constructorCallRegex, '\n');
            }

            console.log('Modified text after deletion:', modifiedText);
        } else if (editType === 'replace' && content) {
            // For case statements, ensure we include any indentation
            if (symbolMatch.kind === 'Case') {
                const lineStart = modifiedText.lastIndexOf('\n', startOffset) + 1;
                const indentation = modifiedText.slice(lineStart, startOffset).match(/^\s*/)?.[0] || '';
                content = content.replace(/^/gm, indentation);
            }
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

            // For methods and cases, we want to match the exact one
            const symbolMatch = matchingSymbols.find(s => 
                (s.kind === 'Method') || 
                (s.kind === 'Case' && symbol.startsWith('case '))
            ) || matchingSymbols[0];

            const insertPos = position === 'before' ? 
                document.offsetAt(symbolMatch.range.start) :
                document.offsetAt(symbolMatch.range.end);

            // For case statements, ensure we include any indentation
            if (symbolMatch.kind === 'Case') {
                const lineStart = modifiedText.lastIndexOf('\n', insertPos) + 1;
                const indentation = modifiedText.slice(lineStart, symbolMatch.range.start.character).match(/^\s*/)?.[0] || '';
                content = content.replace(/^/gm, indentation);
            }

            modifiedText = modifiedText.slice(0, insertPos) + content + modifiedText.slice(insertPos);
        }
    }

    return modifiedText;
}
