import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Find all references to a symbol in a file
 * Uses VSCode's built-in reference provider to find all occurrences of a symbol
 * across all files in the workspace.
 * 
 * @param filePath Path to the file containing the symbol
 * @param symbol Symbol to find references for
 * @returns Array of formatted reference locations (e.g. 'file.ts:1:14')
 */
export async function findReferences(filePath: string, symbol: string): Promise<string[]> {
    if (!symbol) {
        throw new Error('Symbol must not be empty');
    }

    // Get the document
    const document = await vscode.workspace.openTextDocument(filePath);
    
    // Find all symbol positions in the document
    const text = document.getText();
    const positions: vscode.Position[] = [];
    
    let currentIndex = 0;
    while (true) {
        const index = text.indexOf(symbol, currentIndex);
        if (index === -1) {
            break;
        }
        
        // Convert offset to position
        const position = document.positionAt(index);
        
        // Verify this is a complete symbol by checking word boundaries
        const range = document.getWordRangeAtPosition(position);
        if (range && document.getText(range) === symbol) {
            positions.push(position);
        }
        
        currentIndex = index + 1;
    }

    if (positions.length === 0) {
        return [];
    }

    try {
        // Try each position until we find one that returns references
        for (const position of positions) {
            const references = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                document.uri,
                position
            ) || [];

            if (references.length > 0) {
                return references.map(location => {
                    const relativePath = path.relative(filePath, location.uri.fsPath).replace(/\\/g, '/');
                    const line = location.range.start.line + 1;
                    const character = location.range.start.character + 1;
                    return `${relativePath}:${line}:${character}`;
                });
            }
        }

        // If we get here, no position returned references
        return [];
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to find references: ' + String(error));
    }
}
