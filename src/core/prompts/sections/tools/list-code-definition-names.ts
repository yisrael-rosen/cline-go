// WARNING: This file contains template literals. Edit with caution.
export const LIST_CODE_DEFINITION_NAMES_TOOL = (cwd: string): string => {
  const toolDescription = `
## list_code_definition_names
Description: Request to list definition names (classes, functions, methods, etc.) used in source code files at the top level of the specified directory. This tool provides insights into the codebase structure and important constructs, encapsulating high-level concepts and relationships that are crucial for understanding the overall architecture.
Parameters:
- path: (required) The path of the directory (relative to the current working directory ${cwd}) to list top level source code definitions for.
Usage:
<list_code_definition_names>
<path>Directory path here</path>
</list_code_definition_names>`;

  return toolDescription;
};
