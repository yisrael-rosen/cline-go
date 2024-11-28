export const EDIT_GO_SYMBOLS_TOOL = (cwd: string) => `## edit_go_symbols
Description: Request to edit Go code using symbol-based modifications. This tool allows for precise edits to specific symbols (functions, methods, types, etc.) in Go source code files. It uses a specialized Go parser to accurately locate and modify code elements while preserving the overall structure.
Parameters:
- path: (required) The path of the file to edit (relative to the current working directory ${cwd})
- edit_type: (required) The type of edit operation ('replace' | 'insert' | 'delete')
- symbol: (required) The name of the symbol to edit or add
- content: (required for replace/insert) The new content to use
- position: (required for insert) Specifies where to insert ('before' | 'after')
- relative_to_symbol: (required for insert) The target symbol to insert relative to
Usage:
<edit_go_symbols>
<path>File path here</path>
<edit_type>replace</edit_type>
<symbol>NameOfTheSymbol</symbol>
<content>Your Go code content here</content>
<position>before or after (required for insert)</position>
<relative_to_symbol>Target symbol (required for insert)</relative_to_symbol>
</edit_go_symbols>`;
