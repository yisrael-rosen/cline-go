# Symbol-Based Editing for Go Code

## Go Code Characteristics

Go has unique characteristics that affect symbol-based editing:

1. **Comment Styles**
```go
// Line comments
/* Block comments */

// Documentation comments (must be full sentences)
// Package main provides...
// 
// Function example demonstrates...

// Godoc formatting
// Deprecated: Use NewFunction instead.
```

2. **Symbol Types in Go**
```go
package main

type Interface interface {}  // Interface declaration
type Struct struct {}       // Struct declaration
func Function() {}         // Function declaration
var Variable int          // Variable declaration
const Constant = 1        // Constant declaration
```

## Implementation Strategy

### 1. Go Symbol Detection

Leverage gopls (Go language server) through VSCode:

```typescript
interface GoSymbol extends vscode.DocumentSymbol {
    kind: vscode.SymbolKind;
    detail: string;       // Additional symbol information
    range: vscode.Range;  // Full range including docs
    selectionRange: vscode.Range; // Symbol name range
}

async function findGoSymbols(
    document: vscode.TextDocument,
    query?: {
        kind?: vscode.SymbolKind;
        pattern?: string;
        includeTests?: boolean;
    }
): Promise<GoSymbol[]>
```

### 2. Go Comment Handling

Handle Go's specific comment requirements:

```typescript
interface GoComment {
    type: 'doc' | 'line' | 'block';
    content: string;
    isDeprecated?: boolean;
    isTodo?: boolean;
    metadata?: {
        category?: 'package' | 'type' | 'function' | 'field';
        tags?: Array<{
            name: string;  // e.g., 'Deprecated', 'Example'
            value: string;
        }>;
    };
}

async function updateGoComment(
    document: vscode.TextDocument,
    symbol: GoSymbol,
    comment: GoComment
): Promise<void>
```

### 3. Go-Specific Edit Rules

```typescript
interface GoEditRules {
    // Enforce Go comment standards
    formatComments: {
        // Must be full sentences
        enforceSentences: boolean;
        // Add trailing period if missing
        addTrailingPeriod: boolean;
        // Ensure space after //
        enforceSpace: boolean;
    };

    // Handle Go formatting
    formatting: {
        // Run gofmt after edits
        useGofmt: boolean;
        // Organize imports
        organizeImports: boolean;
    };

    // Preserve Go doc conventions
    docConventions: {
        // Keep package docs at top
        preservePackageDocs: boolean;
        // Maintain example formatting
        preserveExamples: boolean;
    };
}
```

## Implementation Example

### 1. New Tool: edit_go_symbol

```typescript
## edit_go_symbol
Description: Edit Go code symbols with proper handling of Go-specific features.
Parameters:
- path: (required) File path
- symbol_type: (required) Type of Go symbol
- name: (required) Symbol name
- edit_type: (required) replace | insert | delete
- content: (required for replace/insert) New content
- options: (optional) Go-specific options

Usage:
<edit_go_symbol>
<path>src/handler.go</path>
<symbol_type>Function</symbol_type>
<name>processRequest</name>
<edit_type>replace</edit_type>
<content>
// processRequest handles incoming HTTP requests.
// It validates the input and returns a JSON response.
//
// Deprecated: Use handleRequest instead.
func processRequest(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    // Process the request
    handleResponse(w, processData(r))
}
</content>
<options>
{
    "formatComments": {
        "enforceSentences": true,
        "addTrailingPeriod": true
    },
    "useGofmt": true
}
</options>
</edit_go_symbol>
```

### 2. Go Comment Examples

```typescript
// Update function documentation
await updateGoComment(document, funcSymbol, {
    type: 'doc',
    content: 'ProcessData handles data processing.',
    metadata: {
        category: 'function',
        tags: [{
            name: 'Deprecated',
            value: 'Use NewProcessor instead.'
        }]
    }
});

// Add TODO comment
await updateGoComment(document, structSymbol, {
    type: 'line',
    content: 'TODO: Add field validation.',
    isTodo: true
});
```

## Go-Specific Features

### 1. Package Documentation

```typescript
interface GoPackageDoc {
    description: string;
    examples: Array<{
        name: string;
        code: string;
        output?: string;
    }>;
    bugs?: string[];
    notes?: Array<{
        tag: string;
        content: string;
    }>;
}

async function updatePackageDoc(
    document: vscode.TextDocument,
    doc: GoPackageDoc
): Promise<void>
```

### 2. Interface Documentation

```typescript
interface GoInterfaceDoc {
    description: string;
    methods: Array<{
        name: string;
        description: string;
        parameters?: string[];
        returns?: string[];
    }>;
}

async function updateInterfaceDoc(
    document: vscode.TextDocument,
    symbol: GoSymbol,
    doc: GoInterfaceDoc
): Promise<void>
```

### 3. Test Function Handling

```typescript
interface GoTestEdit {
    testName: string;
    testType: 'Test' | 'Benchmark' | 'Example';
    content: string;
    table?: Array<{
        name: string;
        input: string;
        expected: string;
    }>;
}

async function updateGoTest(
    document: vscode.TextDocument,
    edit: GoTestEdit
): Promise<void>
```

## Best Practices

1. **Comment Formatting**
   - Use full sentences
   - Add trailing periods
   - Maintain proper spacing
   - Follow godoc conventions

2. **Code Organization**
   - Keep package docs at top
   - Group related functions
   - Maintain interface docs
   - Organize imports properly

3. **Symbol Handling**
   - Respect Go naming conventions
   - Preserve method receivers
   - Handle interfaces properly
   - Maintain struct tags

## Integration with Go Tools

1. **Gopls Integration**
   ```typescript
   interface GoplsCommands {
       formatFile(): Promise<void>;
       organizeImports(): Promise<void>;
       fixImports(): Promise<void>;
       generateInterface(): Promise<void>;
   }
   ```

2. **Go Mod Support**
   ```typescript
   interface GoModEdit {
       addRequire(module: string, version: string): Promise<void>;
       updateRequire(module: string, version: string): Promise<void>;
       removeRequire(module: string): Promise<void>;
   }
   ```

## Conclusion

Implementing symbol-based editing for Go requires:

1. Integration with Go's language server (gopls)
2. Proper handling of Go's comment conventions
3. Support for Go-specific features and tools
4. Maintenance of Go code organization standards

The provided tools and interfaces enable precise, Go-aware editing while maintaining code quality and documentation standards.
