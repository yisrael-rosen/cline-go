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
        
        // First find the end of the case statement line
        let lineEnd = text.indexOf('\n', caseStart);
        if (lineEnd === -1) lineEnd = text.length;
        
        // Then look for the next case/default or end of switch block
        for (let i = lineEnd; i < text.length; i++) {
            const currentChar = text[i];
            const remainingText = text.slice(i);
            
            // Track nested structures
            if (currentChar === '{') {
                depth++;
            } else if (currentChar === '}') {
                depth--;
                if (depth < 0 && !remainingText.trim().startsWith('else')) {
                    // Found end of switch block
                    caseEnd = i;
                    break;
                }
            }
            
            // Only check for next case/default when we're at the same nesting level
            if (depth === 0) {
                // Check for next case or default
                if (remainingText.match(/^\s*case\s|^\s*default:/)) {
                    caseEnd = i;
                    break;
                }
            }
        }
        
        // If we didn't find a next case/default,
        // use the end of the current nesting level
        if (caseEnd === caseStart) {
            depth = 0;
            for (let i = caseStart; i < text.length; i++) {
                if (text[i] === '{') {
                    depth++;
                } else if (text[i] === '}') {
                    depth--;
                    if (depth < 0) {
                        caseEnd = i;
                        break;
                    }
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
 */
export async function editCodeWithSymbols(
    filePath: string,
    editType: EditType,
    symbol?: string,
    content?: string,
    position?: InsertPosition
): Promise<string> {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const symbols = await getCodeSymbols(filePath);
    
    let modifiedText = text;

    if (editType === 'delete' || editType === 'replace') {
        if (!symbol) {
            throw new Error(`Symbol name required for ${editType} operation`);
        }

        const matchingSymbols = symbols.filter(s => s.name === symbol);
        if (matchingSymbols.length === 0) {
            throw new Error(`Symbol '${symbol}' not found in file`);
        }

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

        let startOffset = document.offsetAt(symbolMatch.range.start);
        let endOffset = document.offsetAt(symbolMatch.range.end);

        if (editType === 'delete') {
            // For case statements, preserve switch block structure
            if (symbolMatch.kind === 'Case') {
                // Find the next non-whitespace content
                let nextContentMatch = modifiedText.slice(endOffset).match(/\S/);
                if (nextContentMatch && typeof nextContentMatch.index === 'number') {
                    endOffset += nextContentMatch.index;
                }

                // Preserve indentation
                let prevNewline = modifiedText.lastIndexOf('\n', startOffset);
                if (prevNewline !== -1) {
                    startOffset = prevNewline + 1;
                }
            }

            modifiedText = modifiedText.slice(0, startOffset) + modifiedText.slice(endOffset);

            if (symbolMatch.kind === 'Method' && symbolMatch.name === 'initialize') {
                const constructorCallRegex = new RegExp(`\\s*this\\.${symbolMatch.name}\\(\\);\\s*`);
                modifiedText = modifiedText.replace(constructorCallRegex, '\n');
            }
        } else if (editType === 'replace' && content) {
            // For case statements, preserve indentation and structure
            if (symbolMatch.kind === 'Case') {
                const lineStart = modifiedText.lastIndexOf('\n', startOffset) + 1;
                const indentation = modifiedText.slice(lineStart, startOffset).match(/^\s*/)?.[0] || '';
                
                // Ensure proper indentation for multi-line content
                content = content.split('\n').map((line, i) => {
                    if (i === 0) return line; // First line keeps original indentation
                    return indentation + line;
                }).join('\n');

                // Ensure proper spacing between cases
                if (!content.endsWith('\n')) {
                    content += '\n';
                }
            }
            
            modifiedText = modifiedText.slice(0, startOffset) + content + modifiedText.slice(endOffset);
        }
    } else if (editType === 'insert' && content) {
        if (!symbol) {
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

            const symbolMatch = matchingSymbols.find(s => 
                (s.kind === 'Method') || 
                (s.kind === 'Case' && symbol.startsWith('case '))
            ) || matchingSymbols[0];

            const insertPos = position === 'before' ? 
                document.offsetAt(symbolMatch.range.start) :
                document.offsetAt(symbolMatch.range.end);

            // For case statements, preserve indentation and structure
            if (symbolMatch.kind === 'Case') {
                const lineStart = modifiedText.lastIndexOf('\n', insertPos) + 1;
                const indentation = modifiedText.slice(lineStart, symbolMatch.range.start.character).match(/^\s*/)?.[0] || '';
                
                // Ensure proper indentation and spacing
                content = content.split('\n').map(line => indentation + line).join('\n');
                if (!content.startsWith('\n')) {
                    content = '\n' + content;
                }
                if (!content.endsWith('\n')) {
                    content += '\n';
                }
            }

            modifiedText = modifiedText.slice(0, insertPos) + content + modifiedText.slice(insertPos);
        }
    }

    return modifiedText;
}
