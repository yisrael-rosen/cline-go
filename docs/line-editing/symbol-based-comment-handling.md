# Symbol-Based Comment Handling in VSCode

## Overview

VSCode's symbol system provides powerful capabilities for handling comments in a structured way. This document explores how to leverage VSCode's `SymbolKind` and related APIs for intelligent comment handling.

## Key Insights

### 1. Comment-Symbol Relationships

Comments in code can be associated with specific symbols:

```typescript
interface SymbolCommentRelation {
    symbol: {
        kind: vscode.SymbolKind;  // Method, Class, Property, etc.
        name: string;
        range: vscode.Range;
    };
    comments: {
        leading: string[];    // Comments before the symbol
        trailing: string[];   // Comments after the symbol
        inline: string[];     // Inline comments within the symbol
        jsdoc?: string;      // JSDoc/documentation comments
    };
}
```

### 2. Symbol-Aware Comment Detection

VSCode can help identify which comments belong to which symbols:

```typescript
async function getSymbolComments(
    document: vscode.TextDocument,
    symbol: vscode.DocumentSymbol
): Promise<{
    documentation: vscode.MarkdownString | undefined;
    comments: {
        leading: vscode.Comment[];
        trailing: vscode.Comment[];
        inline: vscode.Comment[];
    };
}>
```

## Implementation Strategies

### 1. Documentation Comments

For symbols that support documentation (classes, methods, etc.):

```typescript
interface DocCommentEdit {
    symbolKind: vscode.SymbolKind;
    symbolName: string;
    edit: {
        description?: string;
        params?: Array<{
            name: string;
            type: string;
            description: string;
        }>;
        returns?: {
            type: string;
            description: string;
        };
        examples?: string[];
    };
}

async function updateDocComment(
    document: vscode.TextDocument,
    symbol: vscode.DocumentSymbol,
    edit: DocCommentEdit
): Promise<void>
```

Example:
```typescript
await updateDocComment(document, methodSymbol, {
    symbolKind: vscode.SymbolKind.Method,
    symbolName: "processData",
    edit: {
        description: "Process user data with validation",
        params: [{
            name: "data",
            type: "UserData",
            description: "The user data to process"
        }],
        returns: {
            type: "Promise<void>",
            description: "Resolves when processing is complete"
        }
    }
});
```

### 2. Inline Comments

For comments within symbol bodies:

```typescript
interface InlineCommentEdit {
    symbolKind: vscode.SymbolKind;
    symbolName: string;
    location: {
        relativeTo: 'start' | 'end' | 'line';
        lineOffset: number;
    };
    content: string;
}

async function updateInlineComment(
    document: vscode.TextDocument,
    symbol: vscode.DocumentSymbol,
    edit: InlineCommentEdit
): Promise<void>
```

Example:
```typescript
await updateInlineComment(document, methodSymbol, {
    symbolKind: vscode.SymbolKind.Method,
    symbolName: "validateUser",
    location: {
        relativeTo: 'line',
        lineOffset: 2
    },
    content: "// Validate user permissions"
});
```

### 3. Block Comments

For multi-line comments associated with symbols:

```typescript
interface BlockCommentEdit {
    symbolKind: vscode.SymbolKind;
    symbolName: string;
    placement: 'before' | 'after' | 'within';
    content: string[];
    style: 'block' | 'line';
}

async function updateBlockComment(
    document: vscode.TextDocument,
    symbol: vscode.DocumentSymbol,
    edit: BlockCommentEdit
): Promise<void>
```

Example:
```typescript
await updateBlockComment(document, classSymbol, {
    symbolKind: vscode.SymbolKind.Class,
    symbolName: "UserManager",
    placement: 'before',
    content: [
        "User Management System",
        "Handles all user-related operations",
        "Version: 2.0.0"
    ],
    style: 'block'
});
```

## Smart Comment Handling

### 1. Comment Preservation During Edits

```typescript
interface CommentPreservationOptions {
    preserveDoc: boolean;     // Preserve documentation comments
    preserveInline: boolean;  // Preserve inline comments
    preserveBlock: boolean;   // Preserve block comments
    updateRefs: boolean;      // Update comment references
}

async function editSymbolWithComments(
    document: vscode.TextDocument,
    symbol: vscode.DocumentSymbol,
    newContent: string,
    options: CommentPreservationOptions
): Promise<void>
```

### 2. Comment Movement

Handle comment movement when code structure changes:

```typescript
interface CommentMovementStrategy {
    // Move comments with their associated code
    moveWithSymbol: boolean;
    
    // Update references in comments
    updateReferences: boolean;
    
    // Adjust comment positions
    adjustPosition: {
        preserveRelative: boolean;
        maintainIndentation: boolean;
    };
}
```

### 3. Comment Analysis

Understand comment purpose and relationships:

```typescript
interface CommentAnalysis {
    type: 'documentation' | 'explanation' | 'todo' | 'warning';
    scope: vscode.SymbolKind;
    references: {
        symbols: vscode.DocumentSymbol[];
        types: string[];
        variables: string[];
    };
    metadata: {
        author?: string;
        version?: string;
        tags: string[];
    };
}
```

## Best Practices

1. **Symbol Association**
   - Always associate comments with their relevant symbols
   - Maintain proper comment scope
   - Preserve comment-symbol relationships

2. **Documentation Standards**
   - Follow JSDoc/TSDoc conventions
   - Keep documentation up-to-date
   - Include all required sections

3. **Comment Placement**
   - Use appropriate comment types
   - Maintain consistent positioning
   - Consider symbol visibility

## Implementation Example

```typescript
// New tool in system.ts
## edit_symbol_comments
Description: Edit comments associated with code symbols.
Parameters:
- path: (required) File path
- symbol_type: (required) Type of symbol (method, class, etc.)
- symbol_name: (required) Name of the symbol
- comment_type: (required) doc | inline | block
- content: (required) New comment content
- options: (optional) Preservation and formatting options

Usage:
<edit_symbol_comments>
<path>src/user-service.ts</path>
<symbol_type>Method</symbol_type>
<symbol_name>processUser</symbol_name>
<comment_type>doc</comment_type>
<content>
/**
 * Process user data with validation
 * @param {UserData} data - User information
 * @returns {Promise<void>} Resolves when processing is complete
 * @throws {ValidationError} When data is invalid
 */
</content>
<options>
{
    "preserveExisting": true,
    "updateReferences": true
}
</options>
</edit_symbol_comments>
```

## Conclusion

VSCode's symbol system provides a robust foundation for handling comments in a structured way. By leveraging these capabilities, we can:

1. Maintain proper comment-symbol relationships
2. Handle documentation updates intelligently
3. Preserve comment context during edits
4. Ensure consistent comment formatting

This approach provides a more reliable and maintainable way to handle comments compared to pure text-based approaches.
