# LLM Line Editing Approaches

This document explores different approaches for enabling LLMs to edit specific lines in code files, analyzing the tradeoffs and implementation strategies for each approach.

## 1. Direct Line Number Approach

### Description
The simplest approach where the LLM directly specifies line numbers for editing.

### Pros
- Straightforward implementation
- Precise control over edits
- Works with any text file format

### Cons
- Line numbers can change as files are edited
- Brittle to file modifications
- Requires LLM to track line numbers manually

### Implementation Example
```typescript
interface LineEdit {
    lineNumber: number;
    editType: 'replace' | 'insert' | 'delete';
    content?: string;
}
```

## 2. Text Search-Based Approach

### Description
Find lines by searching for unique text patterns or content.

### Pros
- More resilient to file changes
- Doesn't require tracking line numbers
- Can find multiple instances for batch editing

### Cons
- May find unintended matches
- Requires unique text patterns
- Can be slow for large files

### Implementation Example
```typescript
interface TextSearchEdit {
    searchPattern: string;
    editType: 'replace' | 'insert' | 'delete';
    content?: string;
    matchIndex?: number; // For multiple matches
}
```

## 3. Symbol-Based Approach

### Description
Use VSCode's symbol detection to identify and edit code elements.

### Pros
- Language-aware editing
- Maintains code structure
- Handles nested scopes correctly

### Cons
- Limited to supported languages
- Requires language server initialization
- Not suitable for non-code files

### Implementation Example
```typescript
interface SymbolEdit {
    symbolName: string;
    editType: 'replace' | 'insert' | 'delete';
    content?: string;
    position?: 'before' | 'after';
}
```

## 4. Context-Aware Approach

### Description
Use surrounding context to identify edit locations.

### Pros
- More precise than pure text search
- Works with similar but non-identical code
- Better for refactoring

### Cons
- More complex implementation
- Higher computational overhead
- May require more tokens in prompts

### Implementation Example
```typescript
interface ContextEdit {
    target: string;
    beforeContext: string[];
    afterContext: string[];
    editType: 'replace' | 'insert' | 'delete';
    content?: string;
}
```

## 5. Hybrid AST + Line Approach

### Description
Combine Abstract Syntax Tree parsing with line-based editing.

### Pros
- Precise for code structures
- Maintains syntax validity
- Good for complex refactoring

### Cons
- Language specific
- Complex implementation
- Higher overhead

### Implementation Example
```typescript
interface AstLineEdit {
    astPath: string; // e.g., "class.method.body[0]"
    lineOffset: number;
    editType: 'replace' | 'insert' | 'delete';
    content?: string;
}
```

## 6. Regex Pattern Approach

### Description
Use regular expressions to identify edit locations.

### Pros
- Flexible pattern matching
- Can handle complex text patterns
- Works across file types

### Cons
- Complex regex patterns needed
- Risk of false matches
- Can be hard for LLMs to generate correct regex

### Implementation Example
```typescript
interface RegexEdit {
    pattern: string;
    editType: 'replace' | 'insert' | 'delete';
    content?: string;
    flags?: string;
}
```

## 7. Block-Based Approach

### Description
Edit blocks of code defined by indentation or brackets.

### Pros
- Preserves code structure
- Good for function/class level edits
- Works with most programming languages

### Cons
- Less precise than line editing
- May edit more than intended
- Depends on consistent formatting

### Implementation Example
```typescript
interface BlockEdit {
    blockStart: string;
    blockEnd: string;
    editType: 'replace' | 'insert' | 'delete';
    content?: string;
}
```

## Recommended Implementation Strategy

After analyzing these approaches, a multi-tiered strategy is recommended:

1. **Primary: Symbol-Based Editing**
   - Use for supported programming languages
   - Provides most reliable results
   - Already implemented in the codebase

2. **Secondary: Context-Aware Search**
   - Fallback for non-code files
   - Use when symbol editing isn't available
   - Implement with findLines() function

3. **Tertiary: Direct Line Editing**
   - Last resort for simple edits
   - Use when other methods fail
   - Keep as backup option

### Implementation Priority

1. **Phase 1: Enhance Current Tools**
   - Add context parameter to findLines()
   - Improve line number detection
   - Add pattern matching capabilities

2. **Phase 2: New Tool Integration**
   ```typescript
   interface SmartEdit {
       // Primary: Try symbol-based
       symbol?: {
           name: string;
           kind: string;
       };
       // Secondary: Try context search
       context?: {
           search: string;
           beforeLines: number;
           afterLines: number;
       };
       // Tertiary: Direct line number
       line?: number;
       // Common properties
       editType: 'replace' | 'insert' | 'delete';
       content?: string;
   }
   ```

3. **Phase 3: LLM Integration**
   - Update system prompts
   - Add examples for each approach
   - Implement fallback logic

## Conclusion

The most effective approach is a combination of methods, with the system attempting each strategy in order of reliability:

1. Try symbol-based editing first (most reliable)
2. Fall back to context-aware search
3. Use direct line editing as last resort

This provides a robust system that can handle various file types and editing scenarios while maintaining code integrity.

## Future Improvements

1. **Smart Pattern Detection**
   - Automatically determine best edit strategy
   - Learn from successful edits
   - Adapt to file types and languages

2. **Enhanced Context Analysis**
   - Use ML to understand code structure
   - Improve pattern matching
   - Better handle code movements

3. **Integration with IDE Features**
   - Leverage more VSCode capabilities
   - Improve language server integration
   - Add refactoring support
