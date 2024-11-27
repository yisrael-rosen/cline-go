// WARNING: This file contains template literals. Edit with caution.
export const FIND_REFERENCES_TOOL = (cwd: string): string => {
  const description = `
## find_references
Description: Request to find all references and implementations of a specified symbol (function, variable, class, etc.) in the workspace. Uses VSCode's built-in language services to provide accurate results across all supported languages.
Parameters:
- symbol: (required) The name of the symbol to find references for
- path: (required) The path of the file containing the symbol definition (relative to the current working directory ${cwd})
Usage:
<find_references>
<symbol>handleWebviewAskResponse</symbol>
<path>src/core/Cline.ts</path>
</find_references>`;

  return description;
};
