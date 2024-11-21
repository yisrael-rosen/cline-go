# Required Update for system.ts

In file: `C:\Users\ROSEN\dev\cline\src\core\prompts\system.ts`

Add the following section under the "# Tools" section, right after the list_code_definition_names tool and before the browser_action section:

```typescript
## find_references
Description: Request to find all references and implementations of a specified symbol (function, variable, class, etc.) in the workspace. Uses VSCode's built-in language services to provide accurate results across all supported languages.
Parameters:
- symbol: (required) The name of the symbol to find references for
- path: (required) The path of the file containing the symbol definition (relative to the current working directory ${cwd.toPosix()})
Usage:
<find_references>
<symbol>handleWebviewAskResponse</symbol>
<path>src/core/Cline.ts</path>
</find_references>
