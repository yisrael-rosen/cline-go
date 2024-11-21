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
    const text = document.getText();

    // Find the symbol in the document
    const symbolIndex = text.indexOf(symbol);
    if (symbolIndex === -1) {
        return [];
    }

    // Convert offset to position
    const position = document.positionAt(symbolIndex);

    try {
        // First find the symbol's definition
        const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            document.uri,
            position
        ) || [];

        // Use the definition's location if found, otherwise use the original position
        const searchPosition = definitions.length > 0 
            ? definitions[0].range.start 
            : position;

        const searchUri = definitions.length > 0
            ? definitions[0].uri
            : document.uri;

        // Find all references using the definition's location
        const references = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeReferenceProvider',
            searchUri,
            searchPosition
        ) || [];

        // Sort references by file and position
        const sortedLocations = references.sort((a, b) => {
            // First sort by file path
            const pathCompare = a.uri.toString().localeCompare(b.uri.toString());
            if (pathCompare !== 0) {
                return pathCompare;
            }
            // Then by line number
            if (a.range.start.line !== b.range.start.line) {
                return a.range.start.line - b.range.start.line;
            }
            // Finally by character position
            return a.range.start.character - b.range.start.character;
        });

        return formatLocations(sortedLocations, filePath);
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to find references: ' + String(error));
    }
}

/**
 * Format Location objects into strings
 * @param locations Array of VSCode Location objects
 * @param baseFilePath Base file path to make paths relative to
 * @returns Array of formatted strings (e.g. 'file.ts:1:14')
 */
function formatLocations(locations: vscode.Location[], baseFilePath: string): string[] {
    if (!locations.length) {
        return [];
    }

    const baseDir = path.dirname(baseFilePath);
    
    return locations.map(location => {
        // Get path relative to the base directory
        const relativePath = path.relative(baseDir, location.uri.fsPath);
        // Use just the filename for the output
        const filename = path.basename(relativePath);
        // VSCode positions are 0-based, convert to 1-based for output
        const line = location.range.start.line + 1;
        const character = location.range.start.character + 1;
        
        return `${filename}:${line}:${character}`;
    });
}
