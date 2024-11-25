# LLM Line Number Identification Strategies

This document explores various strategies for helping LLMs identify line numbers for editing, analyzing the existing tools and proposing new approaches.

## Current Tools Analysis

### 1. Existing Capabilities

#### edit-lines.ts
- Provides line editing functionality
- Has findLineNumber() and findLines() functions
- Supports context-aware line searching
- Handles indentation preservation

#### ripgrep Integration
- Powerful regex-based search
- Provides context around matches
- Returns line numbers with results
- Groups results by file

#### edit-code-symbols
- Symbol-based code editing
- Language-aware modifications
- Preserves code structure

## Proposed Strategies

### 1. Enhanced Text Search Approach

Use the existing findLines() function with improvements:

```typescript
interface LineSearchResult {
    lineNumber: number;
    content: string;
    context: {
        before: string[];
        after: string[];
    };
}

async function findEditableLines(
    filePath: string,
    searchText: string,
    contextLines: number = 2,
    options: {
        isRegex?: boolean;
        caseSensitive?: boolean;
        wholeWord?: boolean;
    }
): Promise<LineSearchResult[]>
```

Benefits:
- Provides context for better line identification
- Supports multiple search modes
- Returns structured results for LLM processing

### 2. Pattern-Based Line Identification

Create a new tool specifically for line identification:

```typescript
interface LinePattern {
    type: 'exact' | 'regex' | 'fuzzy';
    pattern: string;
    contextRequired?: {
        before?: string[];
        after?: string[];
    };
}

async function identifyLines(
    filePath: string,
    patterns: LinePattern[]
): Promise<number[]>
```

Benefits:
- Flexible pattern matching
- Context-aware identification
- Multiple pattern support

### 3. Semantic Line Identification

Leverage VSCode's language services:

```typescript
interface SemanticLineQuery {
    type: 'function' | 'class' | 'comment' | 'import';
    name?: string;
    content?: string;
    position?: 'start' | 'end' | 'body';
}

async function findSemanticLines(
    filePath: string,
    query: SemanticLineQuery
): Promise<number[]>
```

Benefits:
- Language-aware line identification
- Semantic understanding of code
- More precise than text search

## Implementation Strategy

### 1. New Tool: find_line_numbers

Add a new tool to system.ts:

```typescript
## find_line_numbers
Description: Request to find line numbers in a file based on various search criteria. This tool helps identify specific lines for editing by searching for patterns, exact matches, or semantic elements.
Parameters:
- path: (required) The path of the file to search
- search: (required) The text or pattern to search for
- type: (optional) The type of search ('exact' | 'regex' | 'semantic')
- context: (optional) Number of context lines to include
Usage:
<find_line_numbers>
<path>src/file.ts</path>
<search>function processData</search>
<type>exact</type>
<context>2</context>
</find_line_numbers>
```

### 2. Integration with edit-lines

Modify edit-lines.ts to work seamlessly with the new line identification:

```typescript
interface SmartLineEdit {
    // Line identification
    search?: {
        text: string;
        type: 'exact' | 'regex' | 'semantic';
        context?: number;
    };
    lineNumber?: number;  // Direct line number if known
    
    // Edit operation
    editType: 'replace' | 'insert' | 'delete';
    content?: string;
    options?: {
        preserveIndentation?: boolean;
        trimWhitespace?: boolean;
    };
}
```

### 3. Workflow Example

```typescript
// Example LLM workflow:

// 1. First, identify the line
<find_line_numbers>
<path>src/app.ts</path>
<search>TODO: Implement error handling</search>
<type>exact</type>
<context>2</context>
</find_line_numbers>

// Response shows:
// Line 15: // TODO: Implement error handling
// Context:
// Line 13: function processData(data: any) {
// Line 14:   // Some processing logic here
// Line 16:   return processedData;
// Line 17: }

// 2. Then, edit the identified line
<edit_lines>
<path>src/app.ts</path>
<line>15</line>
<edit_type>replace</edit_type>
<content>  if (!isValid(data)) throw new Error('Invalid data');</content>
</edit_lines>
```

## Best Practices for LLMs

1. **Search Strategy Selection**
   - Use exact search for unique strings
   - Use regex for patterns
   - Use semantic search for code structures

2. **Context Verification**
   - Always verify context before editing
   - Check surrounding lines match expected code
   - Confirm correct location before modification

3. **Error Handling**
   - Handle multiple matches appropriately
   - Verify line numbers are valid
   - Consider file changes between operations

## Future Improvements

1. **Smart Context Analysis**
   - Use AI to understand code context
   - Improve pattern matching accuracy
   - Better handle code movements

2. **Caching and Performance**
   - Cache search results
   - Optimize for large files
   - Reduce unnecessary file reads

3. **Integration with Other Tools**
   - Combine with symbol-based editing
   - Integrate with VSCode features
   - Support for more languages

## Conclusion

The key to successful line editing by LLMs is accurate line number identification. By providing robust tools and clear workflows, we can enable LLMs to:

1. Accurately identify target lines
2. Verify context before editing
3. Make precise modifications
4. Handle edge cases appropriately

This multi-faceted approach leverages existing VSCode capabilities while adding new tools specifically designed for LLM use cases.
