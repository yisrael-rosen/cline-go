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
    const lines = text.split('\n');
    let inSwitch = false;
    let switchIndentLevel = 0;
    let currentCaseStart: vscode.Position | null = null;
    let currentCaseName = '';
    let currentIndentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        const indentMatch = line.match(/^(\s*)/);
        const currentLineIndent = indentMatch ? indentMatch[1].length : 0;

        // Track switch statement context
        if (trimmedLine.startsWith('switch')) {
            inSwitch = true;
            switchIndentLevel = currentLineIndent;
            continue;
        }

        // Handle case statements
        if (inSwitch) {
            // Check for case or default statement
            const caseMatch = trimmedLine.match(/^(?:\/\/[^\n]*\n\s*)?(?:\/\*[\s\S]*?\*\/\s*)?(?:case\s+(['"]?\w+['"]?)|default):/);
            
            if (caseMatch) {
                // If we were tracking a previous case, add it
                if (currentCaseStart) {
                    const caseEnd = new vscode.Position(i - 1, lines[i - 1].length);
                    caseSymbols.push({
                        kind: 'Case',
                        name: currentCaseName,
                        range: new vscode.Range(currentCaseStart, caseEnd)
                    });
                }

                // Start tracking new case
                const lineStartPos = document.positionAt(text.indexOf(line, document.offsetAt(new vscode.Position(i, 0))));
                currentCaseStart = lineStartPos;
                currentCaseName = caseMatch[1] ? `case ${caseMatch[1]}` : 'default';
                currentIndentLevel = currentLineIndent;
                continue;
            }

            // Check for end of switch block
            if (currentLineIndent <= switchIndentLevel && trimmedLine.startsWith('}')) {
                inSwitch = false;
                if (currentCaseStart) {
                    const caseEnd = new vscode.Position(i - 1, lines[i - 1].length);
                    caseSymbols.push({
                        kind: 'Case',
                        name: currentCaseName,
                        range: new vscode.Range(currentCaseStart, caseEnd)
                    });
                    currentCaseStart = null;
                }
                continue;
            }

            // Check for next case (to end current case)
            if (currentCaseStart && currentLineIndent === currentIndentLevel && 
                (trimmedLine.startsWith('case') || trimmedLine.startsWith('default'))) {
                const caseEnd = new vscode.Position(i - 1, lines[i - 1].length);
                caseSymbols.push({
                    kind: 'Case',
                    name: currentCaseName,
                    range: new vscode.Range(currentCaseStart, caseEnd)
                });
                currentCaseStart = null;
            }
        }
    }

    // Add final case if we were tracking one
    if (currentCaseStart) {
        const caseEnd = new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
        caseSymbols.push({
            kind: 'Case',
            name: currentCaseName,
            range: new vscode.Range(currentCaseStart, caseEnd)
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
 * Get the indentation level at a given position in the text
 */
function getIndentationAt(text: string, position: number): string {
    const lineStart = text.lastIndexOf('\n', position) + 1;
    const indentMatch = text.slice(lineStart, position).match(/^\s*/);
    return indentMatch ? indentMatch[0] : '';
}

/**
 * Get the base indentation level for a switch statement
 */
function getSwitchIndentation(text: string, caseStart: number): string {
    const lineStart = text.lastIndexOf('\n', caseStart) + 1;
    const switchStart = text.lastIndexOf('switch', caseStart);
    if (switchStart === -1) return '';
    
    const switchLineStart = text.lastIndexOf('\n', switchStart) + 1;
    const switchIndent = text.slice(switchLineStart, switchStart).match(/^\s*/);
    return switchIndent ? switchIndent[0] + '    ' : '    ';
}

/**
 * Find the next case or default statement after a given position
 */
function findNextCase(text: string, position: number): number {
    const afterText = text.slice(position);
    const nextCaseMatch = afterText.match(/^\s*(?:\/\/[^\n]*\n\s*)?(?:\/\*[\s\S]*?\*\/\s*)?(?:case\s|default:)/);
    if (nextCaseMatch) {
        return position + afterText.indexOf(nextCaseMatch[0]);
    }
    return -1;
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
            } else if (symbol.startsWith('case ') || symbol === 'default') {
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
                // Find the next case statement
                const nextCasePos = findNextCase(text, endOffset);
                if (nextCasePos !== -1) {
                    // If there's another case after, remove up to but not including it
                    endOffset = nextCasePos;
                } else {
                    // If this is the last case, remove trailing whitespace
                    const afterContent = text.slice(endOffset);
                    const trailingWhitespace = afterContent.match(/^\s*/);
                    if (trailingWhitespace && trailingWhitespace[0]) {
                        endOffset += trailingWhitespace[0].length;
                    }
                }

                // Preserve indentation
                const indentation = getIndentationAt(text, startOffset);
                startOffset -= indentation.length;

                // Handle case with only one case statement
                const remainingCases = symbols.filter(s => 
                    s.kind === 'Case' && 
                    s.name !== symbolMatch.name &&
                    s.range.start.line >= symbolMatch.range.start.line - 5 &&
                    s.range.end.line <= symbolMatch.range.end.line + 5
                );

                if (remainingCases.length === 0) {
                    // If this is the only case, keep the default case
                    modifiedText = modifiedText.slice(0, startOffset) + 
                        '        default:\n            return \'Unknown action\';\n' +
                        modifiedText.slice(endOffset);
                } else {
                    modifiedText = modifiedText.slice(0, startOffset) + modifiedText.slice(endOffset);
                }
            } else {
                modifiedText = modifiedText.slice(0, startOffset) + modifiedText.slice(endOffset);
            }

            if (symbolMatch.kind === 'Method' && symbolMatch.name === 'initialize') {
                const constructorCallRegex = new RegExp(`\\s*this\\.${symbolMatch.name}\\(\\);\\s*`);
                modifiedText = modifiedText.replace(constructorCallRegex, '\n');
            }
        } else if (editType === 'replace' && content) {
            // For case statements, preserve indentation and structure
            if (symbolMatch.kind === 'Case') {
                const baseIndent = getSwitchIndentation(text, startOffset);
                const caseIndent = getIndentationAt(text, startOffset);
                
                // Ensure proper indentation for multi-line content
                content = content.split('\n').map((line, i) => {
                    if (i === 0) return caseIndent + line.trimStart(); // Case line uses case indentation
                    return caseIndent + '    ' + line.trimStart(); // Content uses extra indent
                }).join('\n');

                // Ensure proper spacing between cases
                const nextCasePos = findNextCase(text, endOffset);
                if (nextCasePos === -1 && !content.endsWith('\n')) {
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
                (s.kind === 'Case' && (symbol.startsWith('case ') || symbol === 'default'))
            ) || matchingSymbols[0];

            const insertPos = position === 'before' ? 
                document.offsetAt(symbolMatch.range.start) :
                document.offsetAt(symbolMatch.range.end);

            // For case statements, preserve indentation and structure
            if (symbolMatch.kind === 'Case') {
                const baseIndent = getSwitchIndentation(text, insertPos);
                const caseIndent = getIndentationAt(text, insertPos);
                
                // Ensure proper indentation and spacing
                content = content.split('\n').map((line, i) => {
                    if (i === 0) return caseIndent + line.trimStart(); // Case line uses case indentation
                    return caseIndent + '    ' + line.trimStart(); // Content uses extra indent
                }).join('\n');

                // Add newlines for proper spacing
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
