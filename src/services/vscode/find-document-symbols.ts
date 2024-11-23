import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Find document symbols in a file
 * Uses VSCode's built-in document symbol provider to find symbols in a file
 * 
 * @param filePath Path to the file to find symbols in
 * @returns Array of formatted symbol locations (e.g. 'function:main:file.ts:1:14')
 */
export async function findDocumentSymbols(filePath: string): Promise<string[]> {
    // Open the document
    const document = await vscode.workspace.openTextDocument(filePath);
    
    try {
        // Execute document symbol provider
        const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeDocumentSymbolProvider', 
            document.uri
        ) || [];

        // Format symbols into readable strings
        return symbols.map(symbol => {
            const relativePath = path.relative(filePath, document.uri.fsPath).replace(/\\/g, '/');
            const line = symbol.location.range.start.line + 1;
            const character = symbol.location.range.start.character + 1;
            return `${symbol.kind}:${symbol.name}:${relativePath}:${line}:${character}`;
        });
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to find document symbols: ' + String(error));
    }
}
