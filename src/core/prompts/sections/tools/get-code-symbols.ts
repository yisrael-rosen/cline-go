export const GET_CODE_SYMBOLS_TOOL = (cwd: string) => `## get_code_symbols
Description: Request to retrieve the structure of code symbols (functions, methods, classes, etc.) in a source code file. This tool is particularly useful before using edit_code_symbols to understand the available symbols that can be edited in a file. It uses VSCode's language services to accurately identify symbols.
Parameters:
- path: (required) The path of the file to analyze (relative to the current working directory ${cwd})
Usage:
<get_code_symbols>
<path>File path here</path>
</get_code_symbols>`;
