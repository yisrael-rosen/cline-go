import * as vscode from 'vscode';

export interface LineEditOptions {
    preserveIndentation?: boolean;
    trimWhitespace?: boolean;
}

/**
 * Edit a specific line in text content
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
 * Get the line number for text
 */
export async function findLineNumber(
    filePath: string,
    searchText: string
): Promise<number | null> {
    const document = await vscode.workspace.openTextDocument(filePath);
    const text = document.getText();
    const index = text.indexOf(searchText);
    if (index === -1) return null;
    return document.positionAt(index).line + 1;
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
