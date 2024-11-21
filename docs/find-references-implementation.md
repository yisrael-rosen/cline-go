# Implementing Find References Tool in Cline

This document provides detailed instructions for implementing a new tool in Cline that finds references and implementations of code symbols using VSCode's built-in capabilities.

## Overview

The find references tool will leverage VSCode's language services to provide accurate reference finding across all supported languages, without requiring language-specific implementations.

## Required Changes

### 1. Add Tool Type (src/shared/ExtensionMessage.ts)

Add the new tool type to the `ClineSayTool` interface:

```typescript
export interface ClineSayTool {
  tool:
    | "editedExistingFile"
    | "newFileCreated"
    | "readFile"
    | "listFilesTopLevel"
    | "listFilesRecursive"
    | "listCodeDefinitionNames"
    | "searchFiles"
    | "findReferences"  // Add this line
  path?: string
  diff?: string
  content?: string
  regex?: string
  filePattern?: string
  symbol?: string      // Add this line
  references?: string  // Add this line
}
```

### 2. Add Tool Definition (src/core/prompts/system.ts)

Add the following tool definition under the "# Tools" section:

```typescript
## find_references
Description: Request to find all references and implementations of a specified symbol (function, variable, class, etc.) in the workspace. Uses VSCode's built-in language services to provide accurate results across all supported languages.
Parameters:
- symbol: (required) The name of the symbol to find references for
- path: (required) The path of the file containing the symbol definition (relative to the current working directory ${cwd.toPosix()})
Usage:
<find_references>
<symbol>functionName</symbol>
<path>src/file.ts</path>
</find_references>
```

### 3. Add Tool Implementation (src/core/Cline.ts)

Add the following case to the switch statement in the `presentAssistantMessage` method:

```typescript
case "find_references": {
  const symbol: string | undefined = block.params.symbol
  const relPath: string | undefined = block.params.path
  const sharedMessageProps: ClineSayTool = {
    tool: "findReferences",
    path: getReadablePath(cwd, removeClosingTag("path", relPath)),
    symbol: removeClosingTag("symbol", symbol)
  }

  try {
    if (block.partial) {
      const partialMessage = JSON.stringify(sharedMessageProps)
      if (this.alwaysAllowReadOnly) {
        await this.say("tool", partialMessage, undefined, block.partial)
      } else {
        await this.ask("tool", partialMessage, block.partial).catch(() => {})
      }
      break
    } else {
      if (!symbol) {
        this.consecutiveMistakeCount++
        pushToolResult(await this.sayAndCreateMissingParamError("find_references", "symbol"))
        break
      }
      if (!relPath) {
        this.consecutiveMistakeCount++
        pushToolResult(await this.sayAndCreateMissingParamError("find_references", "path"))
        break
      }

      this.consecutiveMistakeCount = 0
      const absolutePath = path.resolve(cwd, relPath)

      const completeMessage = JSON.stringify({
        ...sharedMessageProps,
        content: `Finding references for symbol '${symbol}' in ${relPath}`
      })

      if (this.alwaysAllowReadOnly) {
        await this.say("tool", completeMessage, undefined, false)
      } else {
        const didApprove = await askApproval("tool", completeMessage)
        if (!didApprove) {
          break
        }
      }

      // Get the document and position
      const document = await vscode.workspace.openTextDocument(absolutePath)
      const text = document.getText()
      const position = new vscode.Position(0, 0)

      // Find all references
      const locations = await vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeReferenceProvider',
        document.uri,
        position
      ) || []

      // Format results
      const references = locations.map(location => {
        const relativePath = path.relative(cwd, location.uri.fsPath).toPosix()
        const line = location.range.start.line + 1
        const character = location.range.start.character + 1
        return `${relativePath}:${line}:${character}`
      }).join('\n')

      pushToolResult(`Found ${locations.length} references for '${symbol}':\n\n${references}`)
      break
    }
  } catch (error) {
    await handleError("finding references", error)
    break
  }
}
```

### 4. Add Response Formatting (src/core/prompts/responses.ts)

Add the following helper function to `formatResponse`:

```typescript
export const formatResponse = {
  // ... existing code ...
  
  formatReferences: (symbol: string, references: string[]) => {
    if (references.length === 0) {
      return `No references found for symbol '${symbol}'`
    }
    return `Found ${references.length} references for '${symbol}':\n\n${references.join('\n')}`
  }
}
```

## Key Features

1. **VSCode Integration**: Uses VSCode's native reference provider for accurate results
2. **Language Support**: Works with any language that has VSCode language support
3. **Rich Results**: Provides file paths and line numbers for each reference
4. **Error Handling**: Includes proper error handling and user approval flow
5. **Streaming Support**: Supports partial streaming like other Cline tools
6. **Read-Only Support**: Works with alwaysAllowReadOnly mode

## Usage Example

```xml
<find_references>
<symbol>handleWebviewAskResponse</symbol>
<path>src/core/Cline.ts</path>
</find_references>
```

## Implementation Notes

1. The tool uses VSCode's `executeReferenceProvider` command which returns an array of `Location` objects
2. Each location contains:
   - URI (file path)
   - Range (start and end positions)
3. Results are formatted as `filepath:line:column` for easy navigation
4. The implementation follows Cline's existing patterns for:
   - Parameter validation
   - Error handling
   - User approval
   - Partial streaming
   - Read-only mode

## Benefits

1. No need for language-specific implementations
2. Leverages VSCode's mature language services
3. Consistent with VSCode's "Find All References" feature
4. Works with workspace symbols and imported modules
5. Handles type information in typed languages

## Future Enhancements

1. Add support for finding implementations (using `executeImplementationProvider`)
2. Add support for finding definitions (using `executeDefinitionProvider`)
3. Add context lines around each reference
4. Add filtering options (e.g., exclude tests, only show writes)
5. Add support for workspace-wide symbol search
