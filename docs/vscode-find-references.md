# VSCode Find References Service

This document describes the implementation of the find-references service in `src/services/vscode/find-references.ts`.

## Overview

The find-references service provides functionality to find all references to a symbol (class, function, variable, etc.) across the codebase. It leverages VSCode's built-in reference provider API and works with multiple languages including TypeScript and Go.

## Implementation

### Core Function

```typescript
export async function findReferences(filePath: string, symbol: string): Promise<string[]>
```

This function finds all references to a given symbol and returns them in a standardized format:

```typescript
// Example usage
const references = await findReferences('src/main.ts', 'MyClass');
// Returns: ['main.ts:1:14', 'utils.ts:5:22']
```

### How It Works

1. **Document Loading**
   ```typescript
   const document = await vscode.workspace.openTextDocument(filePath);
   ```
   Opens the source file containing the symbol.

2. **Symbol Location**
   ```typescript
   const text = document.getText();
   const symbolIndex = text.indexOf(symbol);
   const position = document.positionAt(symbolIndex);
   ```
   Finds the symbol's position in the document.

3. **Reference Finding**
   ```typescript
   const references = await vscode.commands.executeCommand<vscode.Location[]>(
       'vscode.executeReferenceProvider',
       document.uri,
       position
   ) || [];
   ```
   Uses VSCode's reference provider to find all occurrences.

4. **Result Formatting**
   ```typescript
   return formatLocations(references, filePath);
   ```
   Converts VSCode locations to standardized strings.

### Error Handling

The service includes comprehensive error handling:

```typescript
// Input validation
if (!symbol) {
    throw new Error('Symbol must not be empty');
}

// File access errors
try {
    const document = await vscode.workspace.openTextDocument(filePath);
} catch (error) {
    throw new Error(`Failed to open document: ${error}`);
}

// Reference finding errors
try {
    const references = await vscode.commands.executeCommand(...) || [];
} catch (error) {
    throw new Error(`Failed to find references: ${error}`);
}
```

## Testing

The service is tested with both TypeScript and Go code to ensure language-agnostic functionality.

### TypeScript Tests

Tests finding references in TypeScript code:

```typescript
// Test file structure
export class HelloWorld {
    greet(): string {
        return "Hello, World!";
    }
}

const hello = new HelloWorld();
hello.greet();
```

Verifies:
- Class references across files
- Method references
- Cross-file references
- Non-existent symbols

### Go Tests

Tests finding references in Go code:

```go
// Test file structure
func greet(name string) string {
    return "Hello, " + name
}

func main() {
    message := greet("World")
    println(message)
}
```

Verifies:
- Function references
- Local references
- Non-existent symbols

## Usage Examples

### Finding Class References

```typescript
// Find references to a class
const classRefs = await findReferences('src/models/User.ts', 'User');
// Returns: ['User.ts:1:14', 'auth.ts:5:22', 'test.ts:10:18']
```

### Finding Function References

```typescript
// Find references to a function
const funcRefs = await findReferences('src/utils.ts', 'formatDate');
// Returns: ['utils.ts:5:9', 'main.ts:15:12']
```

### Finding Method References

```typescript
// Find references to a class method
const methodRefs = await findReferences('src/api/Client.ts', 'request');
// Returns: ['Client.ts:8:4', 'Client.ts:25:8']
```

## Performance

The service includes several performance optimizations:

1. **Result Sorting**
   ```typescript
   references.sort((a, b) => {
       const uriCompare = a.uri.toString().localeCompare(b.uri.toString());
       if (uriCompare !== 0) return uriCompare;
       return a.range.start.compareTo(b.range.start);
   });
   ```
   Ensures consistent ordering of results.

2. **Path Handling**
   ```typescript
   const relativePath = path.relative(baseDir, location.uri.fsPath);
   ```
   Uses relative paths to keep results concise.

## Integration

The service integrates with VSCode's extension API:

1. **Document Provider**
   ```typescript
   vscode.workspace.openTextDocument(filePath)
   ```
   For file access and content reading.

2. **Reference Provider**
   ```typescript
   vscode.commands.executeCommand('vscode.executeReferenceProvider', ...)
   ```
   For finding symbol references.

## Future Improvements

1. **Symbol Types**
   - Add support for specific symbol types (class, interface, enum)
   - Filter references by type

2. **Search Scope**
   - Add workspace-wide symbol search
   - Support for search path patterns

3. **Performance**
   - Cache frequently accessed files
   - Batch reference lookups
