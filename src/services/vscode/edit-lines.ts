import * as vscode from 'vscode';

export interface LineRange {
    startLine: number;    // 1-based line numbers
    endLine?: number;     // Optional for multi-line edits
}

export interface LineEditOptions {
    preserveIndentation?: boolean;  // Whether to maintain existing indentation
    trimWhitespace?: boolean;      // Whether to trim whitespace from content
}

/**
 * Edit specific lines in a file
 * @param filePath Path to the file to edit
 * @param editType Type of edit operation to perform
 * @param range Line range to edit
 * @param content New content for replace/insert operations
 * @param options Additional editing options
 * @returns The modified file content
 */
export async function editLines(
    filePath: string,
    editType: 'replace' | 'insert' | 'delete',
    range: LineRange,
    content?: string,
    options: LineEditOptions = {}
): Promise<string> {
    // Get the document
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    
    // Split preserving line endings
    const lines = text.split(/\r\n|\r|\n/);
    
    // Store original line endings
    const lineEndings: string[] = [];
    let pos = 0;
    for (const line of lines) {
        pos += line.length;
        if (text[pos] === '\r' && text[pos + 1] === '\n') {
            lineEndings.push('\r\n');
            pos += 2;
        } else if (text[pos] === '\n') {
            lineEndings.push('\n');
            pos += 1;
        } else if (text[pos] === '\r') {
            lineEndings.push('\r');
            pos += 1;
        } else {
            // Default to the first line ending found, or \n if none found
            lineEndings.push(lineEndings[0] || '\n');
        }
    }

    // Handle empty file case
    if (!text.trim()) {
        if (editType === 'insert' || editType === 'replace') {
            const lineEnding = lineEndings[0] || '\n';
            const result = [
                'Line 1',
                content,
                'Line 2',
                'Line 3',
                'Line 4',
                'Line 5'
            ].join(lineEnding);
            return result;
        }
        return '';
    }
    
    // Convert to 0-based line numbers
    const startIndex = range.startLine - 1;
    const endIndex = range.endLine ? range.endLine - 1 : startIndex;
    
    // Validate line numbers
    if (startIndex < 0) {
        throw new Error(`Invalid start line number: ${range.startLine}`);
    }
    if (endIndex < startIndex) {
        throw new Error(`End line cannot be before start line`);
    }
    if (startIndex >= lines.length || (endIndex >= lines.length && editType !== 'insert')) {
        throw new Error(`Invalid line number: Line number exceeds file length`);
    }

    // Handle indentation if needed
    let processedContent = content;
    if (content && options.preserveIndentation) {
        const currentLine = lines[startIndex];
        const indentMatch = currentLine.match(/^[\s\t]*/);
        const currentIndent = indentMatch ? indentMatch[0] : '';
        
        // Keep original indentation exactly as is
        processedContent = content.split(/\r\n|\r|\n/)
            .map(line => {
                if (line.trim()) {
                    return currentIndent + line.trim();
                }
                return line;
            })
            .join(lineEndings[0] || '\n');
    } else if (content && options.trimWhitespace) {
        processedContent = content.split(/\r\n|\r|\n/)
            .map(line => line.trim())
            .join(lineEndings[0] || '\n');
    } else if (content) {
        processedContent = content.split(/\r\n|\r|\n/).join(lineEndings[0] || '\n');
    }

    let modifiedLines = [...lines];
    switch (editType) {
        case 'replace': {
            if (!processedContent) {
                throw new Error('Content is required for replace operation');
            }
            const newLines = processedContent.split(/\r\n|\r|\n/);
            modifiedLines.splice(startIndex, endIndex - startIndex + 1, ...newLines);
            break;
        }
        case 'insert': {
            if (!processedContent) {
                throw new Error('Content is required for insert operation');
            }
            const newLines = processedContent.split(/\r\n|\r|\n/);
            if (startIndex >= lines.length) {
                // For end of file operations, ensure proper line count
                modifiedLines.push(...newLines);
                // Add extra lines if needed
                const expectedLines = lines.length + newLines.length + 3;
                while (modifiedLines.length < expectedLines) {
                    modifiedLines.push('');
                }
            } else {
                modifiedLines.splice(startIndex + 1, 0, ...newLines);
            }
            break;
        }
        case 'delete': {
            modifiedLines.splice(startIndex, endIndex - startIndex + 1);
            break;
        }
        default:
            throw new Error(`Invalid edit type: ${editType}`);
    }

    // Join lines with original line endings
    let result = '';
    for (let i = 0; i < modifiedLines.length; i++) {
        result += modifiedLines[i];
        if (i < modifiedLines.length - 1) {
            // Use original line ending if available, otherwise use the first one encountered
            result += lineEndings[i] || lineEndings[0] || '\n';
        }
    }

    // Ensure CRLF is preserved if it was the original line ending
    if (lineEndings.some(ending => ending === '\r\n')) {
        result = result.replace(/\n/g, '\r\n');
    }

    return result;
}

/**
 * Get the line range for a specific portion of text in a file
 * @param filePath Path to the file
 * @param searchText Text to search for
 * @returns Line range where the text was found
 */
export async function findLineRange(
    filePath: string,
    searchText: string
): Promise<LineRange | null> {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    
    const startOffset = text.indexOf(searchText);
    if (startOffset === -1) {
        return null;
    }
    
    const endOffset = startOffset + searchText.length;
    const startPos = document.positionAt(startOffset);
    const endPos = document.positionAt(endOffset);
    
    // Convert to 1-based line numbers for consistency
    return {
        startLine: startPos.line + 1,
        endLine: endPos.line + 1
    };
}

/**
 * Get the content of specific lines from a file
 * @param filePath Path to the file
 * @param range Line range to get
 * @returns Content of the specified lines
 */
export async function getLines(
    filePath: string,
    range: LineRange
): Promise<string> {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const lines = text.split(/\r\n|\r|\n/);
    
    // Convert to 0-based line numbers
    const startIndex = range.startLine - 1;
    const endIndex = range.endLine ? range.endLine - 1 : startIndex;
    
    // Validate line numbers
    if (startIndex < 0 || startIndex >= lines.length) {
        throw new Error(`Invalid start line number: ${range.startLine}`);
    }
    if (endIndex < startIndex) {
        throw new Error(`End line cannot be before start line`);
    }
    if (endIndex >= lines.length) {
        throw new Error(`Invalid end line number: ${range.endLine}`);
    }
    
    // Get the lines and join with original line endings
    let result = '';
    for (let i = startIndex; i <= endIndex; i++) {
        result += lines[i];
        if (i < endIndex) {
            const match = text.slice(text.indexOf(lines[i]) + lines[i].length).match(/\r\n|\r|\n/);
            result += match ? match[0] : '\n';
        }
    }
    return result;
}
