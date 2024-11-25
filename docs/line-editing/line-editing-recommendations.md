# Line Editing Implementation Recommendations

## Executive Summary

After analyzing the existing codebase and exploring various approaches for line editing in LLM-powered tools, here are the key recommendations for implementation.

## Recommended Approach: Multi-Strategy Line Identification

### Core Strategy

Implement a hierarchical approach that combines multiple line identification methods:

1. **Symbol-Based Identification** (Primary)
   - Use existing edit-code-symbols for structured code
   - Best for functions, classes, and methods
   - Already implemented and proven reliable

2. **Context-Aware Search** (Secondary)
   - Use enhanced findLines() with context
   - Best for comments, configuration, and text files
   - More reliable than direct line numbers

3. **Direct Line Numbers** (Fallback)
   - Use only when other methods fail
   - Maintain as last resort option
   - Simple and straightforward

## Implementation Plan

### Phase 1: Enhance Existing Tools

1. **Improve findLines()**
```typescript
export interface LineMatch {
    lineNumber: number;
    lineContent: string;
    context: {
        before: string[];
        after: string[];
    };
}

export async function findLines(
    filePath: string,
    searchText: string,
    contextLines: number = 2,
    options: {
        isRegex?: boolean;
        caseSensitive?: boolean;
        wholeWord?: boolean;
    } = {}
): Promise<LineMatch[]>
```

2. **Add Line Range Support**
```typescript
export interface LineRange {
    start: number;
    end?: number;
}

export async function editLineRange(
    filePath: string,
    range: LineRange,
    editType: 'replace' | 'insert' | 'delete',
    content?: string,
    options?: LineEditOptions
): Promise<string>
```

### Phase 2: New Tool Integration

Add a new tool to system.ts that combines all strategies:

```typescript
## smart_edit
Description: Request to edit file content using the most appropriate strategy based on the context. This tool automatically selects between symbol-based, context-aware, or line-based editing.
Parameters:
- path: (required) The path of the file to edit
- target: (required) The target to edit, can be:
  * A symbol name (e.g., "processData")
  * A search pattern (e.g., "TODO: Fix this")
  * A line number (e.g., "15")
- edit_type: (required) The type of edit ('replace' | 'insert' | 'delete')
- content: (required for replace/insert) The new content
- context_lines: (optional) Number of context lines to include in search
Usage:
<smart_edit>
<path>src/app.ts</path>
<target>TODO: Implement error handling</target>
<edit_type>replace</edit_type>
<content>if (!isValid(data)) throw new Error('Invalid data');</content>
<context_lines>2</context_lines>
</smart_edit>
```

### Phase 3: LLM Integration

Update system prompts to guide the LLM in using the smart_edit tool effectively:

1. **Strategy Selection Guidelines**
```
When editing code:
1. For function/class changes, use symbol name as target
2. For specific text changes, use unique search pattern
3. Use line numbers only when absolutely necessary
```

2. **Context Verification**
```
Before making edits:
1. Verify the target exists in the file
2. Check surrounding context matches expectations
3. Confirm the edit won't break code structure
```

## Key Benefits

1. **Reliability**
   - Multiple strategies ensure successful edits
   - Context verification prevents mistakes
   - Fallback options handle edge cases

2. **Flexibility**
   - Works with any file type
   - Handles both code and text
   - Adapts to different editing needs

3. **Maintainability**
   - Built on existing tools
   - Clear strategy hierarchy
   - Easy to extend

## Example Workflows

### 1. Editing a Function
```typescript
// LLM identifies function by name
<smart_edit>
<path>src/utils.ts</path>
<target>processData</target>
<edit_type>replace</edit_type>
<content>
function processData(data: any): void {
    if (!data) throw new Error('Data required');
    // Process the data
    console.log('Data processed');
}
</content>
</smart_edit>
```

### 2. Updating a Comment
```typescript
// LLM uses context-aware search
<smart_edit>
<path>src/app.ts</path>
<target>TODO: Implement error handling</target>
<edit_type>replace</edit_type>
<content>// Error handling implemented in v2.0</content>
<context_lines>2</context_lines>
</smart_edit>
```

## Implementation Priority

1. **High Priority**
   - Enhance findLines() with better context support
   - Add smart_edit tool to system.ts
   - Update system prompts

2. **Medium Priority**
   - Add line range support
   - Improve error handling
   - Add more context verification

3. **Low Priority**
   - Add caching for search results
   - Implement pattern matching improvements
   - Add more language-specific features

## Conclusion

The recommended approach provides a robust, flexible system for line editing that:
- Leverages existing tools effectively
- Provides multiple strategies for different scenarios
- Maintains code integrity through context verification
- Offers clear guidance for LLM usage

This implementation balances reliability, usability, and maintainability while providing a clear path for future improvements.
