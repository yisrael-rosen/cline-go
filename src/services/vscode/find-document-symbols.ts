import * as vscode from 'vscode';

/**
 * Maps VSCode's SymbolKind enum values to readable names
 */
const symbolKindToName = new Map<vscode.SymbolKind, string>([
    [vscode.SymbolKind.File, 'File'],
    [vscode.SymbolKind.Module, 'Module'],
    [vscode.SymbolKind.Namespace, 'Namespace'],
    [vscode.SymbolKind.Package, 'Package'],
    [vscode.SymbolKind.Class, 'Class'],
    [vscode.SymbolKind.Method, 'Method'],
    [vscode.SymbolKind.Property, 'Property'],
    [vscode.SymbolKind.Field, 'Field'],
    [vscode.SymbolKind.Constructor, 'Constructor'],
    [vscode.SymbolKind.Enum, 'Enum'],
    [vscode.SymbolKind.Interface, 'Interface'],
    [vscode.SymbolKind.Function, 'Function'],
    [vscode.SymbolKind.Variable, 'Variable'],
    [vscode.SymbolKind.Constant, 'Constant'],
    [vscode.SymbolKind.String, 'String'],
    [vscode.SymbolKind.Number, 'Number'],
    [vscode.SymbolKind.Boolean, 'Boolean'],
    [vscode.SymbolKind.Array, 'Array'],
    [vscode.SymbolKind.Object, 'Object'],
    [vscode.SymbolKind.Key, 'Key'],
    [vscode.SymbolKind.Null, 'Null'],
    [vscode.SymbolKind.EnumMember, 'EnumMember'],
    [vscode.SymbolKind.Struct, 'Struct'],
    [vscode.SymbolKind.Event, 'Event'],
    [vscode.SymbolKind.Operator, 'Operator'],
    [vscode.SymbolKind.TypeParameter, 'TypeParameter']
]);

function processDocumentSymbol(symbol: vscode.DocumentSymbol): string[] {
    const startLine = symbol.range.start.line + 1;
    const startChar = symbol.range.start.character + 1;
    const endLine = symbol.range.end.line + 1;
    const endChar = symbol.range.end.character + 1;
    const kindName = symbolKindToName.get(symbol.kind) || `Unknown(${symbol.kind})`;
    
    const result = [`${kindName}:${symbol.name}::${startLine}:${startChar}-${endLine}:${endChar}`];
    
    // Process children recursively
    if (symbol.children) {
        for (const child of symbol.children) {
            result.push(...processDocumentSymbol(child));
        }
    }
    
    return result;
}

/**
 * Find document symbols in a file
 * Uses VSCode's built-in document symbol provider to find symbols in a file
 * 
 * The returned strings are formatted as: `kind:name::startLine:startChar-endLine:endChar`
 * where:
 * - kind: The readable name of the symbol kind (e.g., 'Class', 'Function', 'Method', etc.)
 * - name: The name of the symbol
 * - startLine:startChar: The starting position of the symbol
 * - endLine:endChar: The ending position of the symbol
 * 
 * The symbol information includes:
 * - containerName: The name of the symbol containing this symbol (e.g., class name for methods)
 * - tags: Optional tags providing additional metadata about the symbol
 * - location: The full location information including the file URI and position range
 * 
 * @param filePath Path to the file to find symbols in
 * @returns Array of formatted symbol locations
 * @example
 * // For a class named 'AuthService' spanning lines 3-26:
 * 'Class:AuthService::3:1-26:2'
 * 
 * // For a function named 'validateEmail' spanning lines 28-31:
 * 'Function:validateEmail::28:1-31:2'
 */
export async function findDocumentSymbols(filePath: string): Promise<string[]> {
    // Open the document
    const document = await vscode.workspace.openTextDocument(filePath);
    
    try {
        // Execute document symbol provider to get DocumentSymbol[]
        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider', 
            document.uri
        ) || [];

        console.log('Raw DocumentSymbols:', symbols);

        // Process symbols recursively to include all nested symbols
        const result: string[] = [];
        for (const symbol of symbols) {
            result.push(...processDocumentSymbol(symbol));
        }

        console.log('Processed symbols:', result);
        return result;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to find document symbols: ' + String(error));
    }
}
