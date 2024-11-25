# Comment Editing Strategies for LLMs

## The Challenge of Comment Editing

Editing comments presents unique challenges compared to editing code:

1. **Comment Identification**
   - Comments can appear anywhere in code
   - Multiple comment styles (inline, block, JSDoc)
   - Language-specific comment syntax
   - Comments might be part of code documentation

2. **Comment Types**
```typescript
// Single-line comments
/* Multi-line 
   block comments */
/** 
 * Documentation comments (JSDoc/TSDoc)
 * @param {string} name
 * @returns {void}
 */
```

## Proposed Solutions

### 1. Tree-Sitter Based Approach

Use Tree-sitter to identify and edit comments with precise AST awareness:

```typescript
interface CommentNode {
    type: 'line_comment' | 'block_comment' | 'documentation_comment';
    text: string;
    range: {
        start: { line: number, column: number },
        end: { line: number, column: number }
    };
    metadata?: {
        isJSDoc?: boolean;
        tags?: string[];
    };
}

async function findComments(
    filePath: string,
    options: {
        type?: 'line' | 'block' | 'doc';
        pattern?: string;
        includeMetadata?: boolean;
    }
): Promise<CommentNode[]>
```

Benefits:
- Precise comment identification
- Language-aware parsing
- Maintains code structure
- Can distinguish between comment types

### 2. Regex Pattern Matching

Use specialized regex patterns for different comment types:

```typescript
const COMMENT_PATTERNS = {
    singleLine: /\/\/.*$/gm,
    multiLine: /\/\*[\s\S]*?\*\//g,
    jsDoc: /\/\*\*[\s\S]*?\*\//g,
    todos: /\/\/\s*TODO:.*$/gm
};

interface CommentMatch {
    type: 'single' | 'multi' | 'doc';
    content: string;
    lineNumber: number;
    indentation: string;
}

async function findCommentsByPattern(
    filePath: string,
    pattern: string | RegExp,
    options: {
        type?: 'single' | 'multi' | 'doc';
        includeIndentation?: boolean;
    }
): Promise<CommentMatch[]>
```

Benefits:
- Simple implementation
- Works across file types
- Can target specific comment patterns
- Handles indentation preservation

### 3. Semantic Comment Analysis

Use natural language processing to understand and edit comments:

```typescript
interface CommentSemantics {
    type: 'todo' | 'explanation' | 'warning' | 'documentation';
    importance: 'high' | 'medium' | 'low';
    context: {
        relatedCode?: string;
        scope?: 'function' | 'class' | 'file';
    };
}

async function analyzeComments(
    filePath: string,
    options: {
        type?: CommentSemantics['type'];
        includeContext?: boolean;
    }
): Promise<Array<CommentMatch & { semantics: CommentSemantics }>>
```

Benefits:
- Understanding of comment purpose
- Context-aware editing
- Better handling of documentation

## Implementation Strategy

### 1. New Tool: edit_comments

Add a specialized tool for comment editing:

```typescript
## edit_comments
Description: Request to edit comments in code files with awareness of comment types and context.
Parameters:
- path: (required) The path of the file to edit
- pattern: (required) Text or pattern to find in comments
- type: (optional) Type of comment to target ('line' | 'block' | 'doc')
- edit_type: (required) The type of edit ('replace' | 'insert' | 'delete')
- content: (required for replace/insert) The new comment content
Usage:
<edit_comments>
<path>src/app.ts</path>
<pattern>TODO: Implement error handling</pattern>
<type>line</type>
<edit_type>replace</edit_type>
<content>// DONE: Error handling implemented with try-catch</content>
</edit_comments>
```

### 2. Comment-Aware Editing Rules

Special handling for different comment scenarios:

```typescript
const COMMENT_EDIT_RULES = {
    // Preserve JSDoc structure
    jsDoc: (content: string) => {
        return content.split('\n').map(line => 
            line.trim().startsWith('*') ? line : ` * ${line}`
        ).join('\n');
    },
    
    // Maintain inline comment spacing
    inlineComment: (content: string, originalIndent: string) => {
        return originalIndent + '// ' + content.trimStart();
    },
    
    // Handle block comment formatting
    blockComment: (content: string, originalIndent: string) => {
        return [
            `${originalIndent}/*`,
            ...content.split('\n').map(line => `${originalIndent} * ${line.trim()}`),
            `${originalIndent} */`
        ].join('\n');
    }
};
```

### 3. Context Preservation

Maintain important comment context:

```typescript
interface CommentContext {
    codeBlock?: {
        start: number;
        end: number;
        content: string;
    };
    relatedSymbols?: string[];
    indentation: string;
    precedingBlankLines: number;
}

async function preserveCommentContext(
    filePath: string,
    commentRange: Range,
    newContent: string,
    context: CommentContext
): Promise<string>
```

## Example Workflows

### 1. Updating a TODO Comment
```typescript
// Find and update a TODO comment
<edit_comments>
<path>src/app.ts</path>
<pattern>TODO: Add validation</pattern>
<type>line</type>
<edit_type>replace</edit_type>
<content>// DONE: Added input validation in v2.0</content>
</edit_comments>
```

### 2. Enhancing Documentation
```typescript
// Update JSDoc documentation
<edit_comments>
<path>src/utils.ts</path>
<pattern>@param data</pattern>
<type>doc</type>
<edit_type>replace</edit_type>
<content>
/**
 * @param {object} data - The input data object
 * @param {string} data.id - Unique identifier
 * @param {string} data.name - User's name
 * @returns {Promise<void>}
 * @throws {ValidationError} When data is invalid
 */
</content>
</edit_comments>
```

## Best Practices

1. **Comment Preservation**
   - Maintain existing indentation
   - Preserve comment markers
   - Keep comment alignment

2. **Context Awareness**
   - Consider surrounding code
   - Maintain documentation standards
   - Respect language conventions

3. **Smart Updates**
   - Update related comments together
   - Maintain comment consistency
   - Preserve important metadata

## Future Improvements

1. **Enhanced Analysis**
   - Better comment classification
   - Improved context understanding
   - Smarter documentation updates

2. **Integration Features**
   - IDE comment formatting
   - Documentation generators
   - Code style compliance

3. **Language Support**
   - More comment styles
   - Language-specific rules
   - Custom comment formats

## Conclusion

Effective comment editing requires:
1. Precise comment identification
2. Context preservation
3. Format-aware updates
4. Smart content management

The proposed tools and strategies provide a robust foundation for LLMs to handle comment editing while maintaining code quality and documentation standards.
