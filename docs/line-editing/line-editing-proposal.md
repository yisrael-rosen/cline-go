# Line Editing Tool Proposal

## Overview

A line-based editing tool that complements `edit_code_symbols` by providing precise line-level modifications to files. While `edit_code_symbols` is ideal for semantic code changes (functions, classes, etc.), this tool would be better suited for:

- Making changes to specific line ranges
- Editing configuration files
- Modifying text files without language-specific symbols
- Making changes to code comments or documentation

## Core Interface

```typescript
interface LineRange {
    startLine: number;    // 1-based line numbers
    endLine?: number;     // Optional for multi-line edits
}

interface LineEditOptions {
    preserveIndentation?: boolean;  // Whether to maintain existing indentation
    trimWhitespace?: boolean;      // Whether to trim whitespace from content
}

async function editLines(
    filePath: string,
    editType: 'replace' | 'insert' | 'delete',
    range: LineRange,
    content?: string,
    options?: LineEditOptions
): Promise<string>
```

## Key Features

1. **Line Range Operations**
   - Replace lines within a range
   - Insert content before/after specific lines
   - Delete line ranges
   - Support for single-line and multi-line operations

2. **Indentation Handling**
   - Option to preserve existing indentation
   - Auto-indent inserted content based on surrounding context
   - Maintain consistent whitespace

3. **Content Validation**
   - Verify line numbers are valid for the file
   - Ensure content is provided for replace/insert operations
   - Validate line ranges (start <= end)

4. **Integration with VSCode**
   - Use VSCode's document API for file operations
   - Support for undo/redo operations
   - Preview changes in diff view

## Example Usage

```typescript
// Replace a single line
await editLines(
    'config.json',
    'replace',
    { startLine: 5 },
    '  "version": "2.0.0"',
    { preserveIndentation: true }
);

// Insert after a line
await editLines(
    'README.md',
    'insert',
    { startLine: 10 },
    '## New Section\n\nThis is a new section of documentation.',
    { trimWhitespace: true }
);

// Delete a range of lines
await editLines(
    'src/utils.ts',
    'delete',
    { startLine: 15, endLine: 20 }
);
```

## Implementation Considerations

1. **Line Number Handling**
   - Use 1-based line numbers for user interface (matching editor)
   - Convert to 0-based internally for VSCode operations
   - Validate line numbers against file length

2. **Indentation Preservation**
   - Detect existing indentation pattern
   - Apply to new content when preserveIndentation is true
   - Handle mixed spaces/tabs appropriately

3. **Error Handling**
   - Invalid line numbers
   - File access issues
   - Content format problems

4. **Performance**
   - Efficient line range operations
   - Minimal file reads/writes
   - Smart buffer management for large files

## Integration with Existing Tools

This tool would complement `edit_code_symbols` by providing:
- Line-level precision when symbol-based editing isn't appropriate
- Support for non-code files
- Simpler interface for basic text operations

## Testing Strategy

1. **Basic Operations**
   - Single line replacement
   - Multi-line deletion
   - Content insertion
   - Line range validation

2. **Edge Cases**
   - Empty files
   - End of file operations
   - Invalid line numbers
   - Mixed line endings

3. **Indentation**
   - Spaces vs tabs
   - Mixed indentation
   - Nested structures

4. **File Types**
   - Source code
   - Configuration files
   - Markdown documents
   - Plain text

## Implementation Plan

1. Create basic implementation with core functionality
2. Add indentation handling
3. Implement error handling
4. Add VSCode integration features
5. Create comprehensive test suite
6. Document API and usage examples

This tool would provide a valuable complement to the existing symbol-based editing capabilities, offering precise line-level control when needed.
