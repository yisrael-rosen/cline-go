export const EDIT_CODE_SYMBOLS_TOOL = (cwd: string) => `## edit_code_symbols
Description: Request to edit code using symbol-based modifications. This tool allows for precise edits to specific symbols (functions, methods, classes, etc.) in source code files. It uses VSCode's language services to accurately locate and modify code elements while preserving the overall structure.
Parameters:
- path: (required) The path of the file to edit (relative to the current working directory ${cwd})
- edit_type: (required) The type of edit operation ('replace' | 'insert' | 'delete')
- symbol: (required for replace/delete) The name of the symbol to edit
- content: (required for replace/insert) The new content to use
- position: (optional, for insert operations) Specifies where to insert ('before' | 'after')
Usage:
<edit_code_symbols>
<path>File path here</path>
<edit_type>replace</edit_type>
<symbol>processData</symbol>
<content>
Your file content here
</content>
<position>optional for insert operations</position>
</edit_code_symbols>`;
