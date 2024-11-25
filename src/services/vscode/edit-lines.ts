import * as vscode from 'vscode';

export interface LineEditOptions {
    preserveIndentation?: boolean;
    trimWhitespace?: boolean;
}

export interface LineMatch {
    lineNumber: number;
    lineContent: string;
    context?: {
        before: string[];
        after: string[];
    };
}

/**
 * Edit text content in memory
 * 
 * Why in-memory operations?
 * 1. Reliability: File system operations can be flaky due to:
 *    - File locks
 *    - Permissions issues
 *    - Race conditions with other processes
 *    - Disk I/O delays
 * 
 * 2. Testing:
 *    - Tests are more predictable without file system dependencies
 *    - Faster execution without I/O overhead
 *    - Can test edge cases without creating actual files
 *    - No cleanup needed after tests
 * 
 * 3. Reusability:
 *    - Same logic can be used for files, clipboard, or any text source
 *    - Easier to compose with other operations
 *    - Can be used in memory-only environments (like web workers)
 * 
 * 4. Debugging:
 *    - Easier to inspect state at any point
 *    - No need to check file contents
 *    - Can log exact content without file system access
 */
export function editText(
    text: string,
    editType: 'replace' | 'insert' | 'delete',
    lineNumber: number,
    content?: string,
    options: LineEditOptions = {}
): string {
    // Handle empty text
    if (!text.trim()) {
        if (editType === 'delete') return '';
        if (!content) return '';
        return options.trimWhitespace ? content.trim() : content;
    }

    // Split into lines
    const lines = text.split(/\r?\n/);

    // Validate line number
    if (lineNumber < 1 || lineNumber > lines.length) {
        throw new Error('Invalid line number');
    }

    const index = lineNumber - 1;
    const eol = text.includes('\r\n') ? '\r\n' : '\n';

    // Process content
    let newContent = content;
    if (content && options.preserveIndentation) {
        const currentLine = lines[index];
        const indent = currentLine.match(/^[\s\t]*/)?.[0] || '';
        newContent = content.split(/\r?\n/).map(line => 
            line.trim() ? indent + line.trim() : line
        ).join(eol);
    } else if (content && options.trimWhitespace) {
        newContent = content.trim();
    }

    // Create modified lines array
    const result = [...lines];

    // Perform operation
    switch (editType) {
        case 'replace': {
            if (!newContent) throw new Error('Content required for replace');
            result[index] = newContent;
            break;
        }
        case 'insert': {
            if (!newContent) throw new Error('Content required for insert');
            result.splice(index + 1, 0, newContent);
            break;
        }
        case 'delete': {
            result.splice(index, 1);
            break;
        }
    }

    return result.join(eol);
}

/**
 * Edit a specific line in a file
 * 
 * This is a wrapper around editText that handles file I/O.
 * The actual text manipulation is done in memory for reliability.
 */
export async function editLines(
    filePath: string,
    editType: 'replace' | 'insert' | 'delete',
    lineNumber: number,
    content?: string,
    options: LineEditOptions = {}
): Promise<string> {
    const document = await vscode.workspace.openTextDocument(filePath);
    return editText(document.getText(), editType, lineNumber, content, options);
}

/**
 * Find all occurrences of text in a file with context
 * 
 * @param filePath Path to the file to search
 * @param searchText Text to search for
 * @param contextLines Number of lines of context to include before and after each match (default: 2)
 * @param isRegex Whether to treat searchText as a regular expression
 * @returns Array of matches with line numbers and context
 */
export async function findLines(
    filePath: string,
    searchText: string,
    contextLines: number = 2,
    isRegex: boolean = false
): Promise<LineMatch[]> {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const lines = text.split(/\r?\n/);
    const matches: LineMatch[] = [];

    const searchRegex = isRegex ? new RegExp(searchText, 'g') : new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

    for (let i = 0; i < lines.length; i++) {
        if (searchRegex.test(lines[i])) {
            const match: LineMatch = {
                lineNumber: i + 1,
                lineContent: lines[i],
                context: {
                    before: lines.slice(Math.max(0, i - contextLines), i),
                    after: lines.slice(i + 1, Math.min(lines.length, i + 1 + contextLines))
                }
            };
            matches.push(match);
        }
        searchRegex.lastIndex = 0; // Reset regex state
    }

    return matches;
}

/**
 * Get the line number for text
 */
export async function findLineNumber(
    filePath: string,
    searchText: string
): Promise<number | null> {
    const matches = await findLines(filePath, searchText);
    return matches.length > 0 ? matches[0].lineNumber : null;
}

/**
 * Get content of a line
 */
export async function getLine(
    filePath: string,
    lineNumber: number
): Promise<string> {
    const document = await vscode.workspace.openTextDocument(filePath);
    if (lineNumber < 1 || lineNumber > document.lineCount) {
        throw new Error('Invalid line number');
    }
    return document.lineAt(lineNumber - 1).text;
}
