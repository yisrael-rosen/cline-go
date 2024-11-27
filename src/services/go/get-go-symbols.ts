import { GoParser } from '../../../go/parser/wrapper';

export interface GoSymbol {
    name: string;
    kind: string;
    start: number;
    end: number;
    doc?: string;
    children?: GoSymbol[];
}

export interface GoSymbolsResult {
    success: boolean;
    symbols?: GoSymbol[];
    error?: string;
}

/**
 * Get symbols from a Go source file using the Go parser
 */
export async function getGoSymbols(filePath: string): Promise<GoSymbolsResult> {
    try {
        const parser = new GoParser();
        const result = await parser.parseFile(filePath);
        
        return {
            success: result.success,
            symbols: result.symbols,
            error: result.error
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to parse Go file'
        };
    }
}
// Helper function to format Go symbols into a readable structure
export function formatGoSymbols(symbols: GoSymbol[]): string {
    const formatSymbol = (symbol: GoSymbol, indent: string = ''): string[] => {
        const lines: string[] = []
        const kindAndName = `${symbol.kind}: ${symbol.name}`
        const docString = symbol.doc ? `\n${indent}  Doc: ${symbol.doc}` : ''
        lines.push(`${indent}${kindAndName}${docString}`)
        
        if (symbol.children && symbol.children.length > 0) {
            symbol.children.forEach(child => {
                lines.push(...formatSymbol(child, indent + '  '))
            })
        }
        return lines
    }

    return symbols.map(symbol => formatSymbol(symbol).join('\n')).join('\n')
}