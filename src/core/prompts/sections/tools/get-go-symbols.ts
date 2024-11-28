export const GET_GO_SYMBOLS_TOOL = (cwd: string) => `## get_go_symbols
Description: Request to retrieve the structure of Go code symbols (functions, methods, types, etc.) in a Go source file. This tool is particularly useful before using edit_go_symbols to understand the available symbols that can be edited in a file. It uses a specialized Go parser to accurately identify Go-specific symbols.
Parameters:
- path: (required) The path of the Go file to analyze (relative to the current working directory ${cwd})
Usage:
<get_go_symbols>
<path>File path here</path>
</get_go_symbols>`;
