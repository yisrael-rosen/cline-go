# Go Code Editing Tool Design

## Overview
This tool provides functionality for programmatically editing Go source code while preserving its structure, formatting, and documentation. It supports three main operations: replacing existing declarations, inserting new declarations relative to existing ones, and deleting declarations.

## Core Concepts

### Declarations
A declaration in Go can be:
- Function declarations (`func foo()`)
- Method declarations (`func (s *Service) foo()`)
- Type declarations (`type Foo struct{}`, `type Bar interface{}`)
- Variable declarations (`var x int`)
- Constant declarations (`const y = 42`)

### Edit Operations

#### Replace Operation
- Replaces an existing declaration with a new one
- The new declaration must be valid Go code
- Comments associated with the new declaration replace the old ones
- Example: Replacing a function to add a new parameter
  ```go
  // Before
  func Process(data []byte) error {
      return nil
  }
  
  // After
  func Process(ctx context.Context, data []byte) error {
      return nil
  }
  ```

#### Insert Operation
- Adds a new declaration before or after an existing one
- Requires:
  1. The new declaration (Symbol and Content)
  2. The target declaration to insert relative to (RelativeToSymbol)
  3. Position ("before" or "after")
- Preserves both the existing declaration and its comments
- Example: Adding a validation method before a process method
  ```go
  // Before
  func (s *Service) Process() error {
      return nil
  }
  
  // After (inserting before Process)
  func (s *Service) Validate() error {
      return nil
  }
  
  func (s *Service) Process() error {
      return nil
  }
  ```

#### Delete Operation
- Removes an existing declaration and its associated comments
- Example: Removing a deprecated method
  ```go
  // Before
  func (s *Service) OldMethod() error {
      return nil
  }
  
  // After
  // (method removed)
  ```

### Comments Handling
- Comments are considered part of the declaration they document
- For replace operations:
  - New declaration's comments replace the old ones
  - Other comments in the file are preserved
- For insert operations:
  - New declaration's comments are added
  - Existing declaration's comments are preserved
- For delete operations:
  - Declaration's comments are removed with it

### Code Structure Preservation
- Maintains proper spacing between declarations
- Preserves indentation
- Keeps blank lines for readability
- Maintains package declaration
- Preserves imports

## Request Structure

### EditRequest
```go
type EditRequest struct {
    Path     string       // File path to edit
    EditType string       // "replace", "insert", or "delete"
    Symbol   string       // Symbol name to edit or add
    Content  string       // New content for replace/insert
    Insert   *InsertConfig // Required for insert operations
}

type InsertConfig struct {
    Position         string // "before" or "after"
    RelativeToSymbol string // Target symbol to insert relative to
}
```

### EditResult
```go
type EditResult struct {
    Success bool   // Whether the operation succeeded
    Error   string // Error message if failed
    Content string // Updated file content
}
```

## Error Handling

The tool should validate and handle:
1. Invalid edit types
2. Missing required fields
3. Invalid Go syntax in new content
4. Non-existent target symbols
5. File read/write errors
6. Parse errors
7. Invalid insert positions

## Examples

### Adding a Context Parameter
```go
// Request
{
    "Path": "service.go",
    "EditType": "replace",
    "Symbol": "Process",
    "Content": `// Process handles data processing with context
func Process(ctx context.Context, data []byte) error {
    return nil
}`
}
```

### Adding Interface Implementation
```go
// Request
{
    "Path": "service.go",
    "EditType": "insert",
    "Symbol": "Handle",
    "Content": `// Handle implements Handler interface
func (s *Service) Handle(ctx context.Context) error {
    return nil
}`,
    "Insert": {
        "Position": "after",
        "RelativeToSymbol": "Service"
    }
}
```

### Removing Deprecated Method
```go
// Request
{
    "Path": "service.go",
    "EditType": "delete",
    "Symbol": "OldMethod"
}
```

## Implementation Guidelines

1. Parse the original file first to understand its structure
2. For new content:
   - Parse it separately to validate syntax
   - Extract comments and associate with declarations
3. Find target symbol in original file
4. Build new declarations list based on operation
5. Reconstruct file with proper formatting
6. Validate result before writing back

## Usage Considerations

1. Always validate input before processing
2. Preserve file structure and formatting
3. Handle comments properly
4. Maintain code readability
5. Provide clear error messages
6. Avoid partial updates - operations should be atomic
