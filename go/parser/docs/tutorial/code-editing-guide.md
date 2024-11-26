# Go Code Editing Guide

This guide explains how to use the Go code editing functionality to modify Go source code programmatically.

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Supported Symbols](#supported-symbols)
3. [Examples](#examples)
4. [Error Handling](#error-handling)

## Basic Usage

The code editor provides a simple API for modifying Go source code:

```go
// Create an edit request
req := EditRequest{
    Path:     "main.go",     // File to edit
    Symbol:   "ProcessData", // Symbol to modify
    Position: "before",      // Where to insert (before/after) or empty for replace
    Content:  "func ProcessData() error { return nil }", // New content
}

// Perform the edit
result := Edit(req)

// Check the result
if !result.Success {
    log.Printf("Edit failed: %s", result.Error)
}
```

## Supported Symbols

The editor supports editing various Go language constructs:

### Functions and Methods

```go
// Replace a function
req := EditRequest{
    Symbol: "ProcessData",
    Content: `func ProcessData(ctx context.Context) error {
        // New implementation
        return nil
    }`,
}

// Replace a method
req := EditRequest{
    Symbol: "Handle",
    Content: `func (s *Service) Handle(ctx context.Context) error {
        return s.process(ctx)
    }`,
}
```

### Types

```go
// Replace a struct
req := EditRequest{
    Symbol: "User",
    Content: `type User struct {
        ID        int
        Name      string
        CreatedAt time.Time
    }`,
}

// Replace an interface
req := EditRequest{
    Symbol: "Handler",
    Content: `type Handler interface {
        Handle(ctx context.Context) error
    }`,
}
```

### Fields and Methods

```go
// Replace a struct field
req := EditRequest{
    Symbol: "Name",
    Content: `Name string // User's full name`,
}

// Replace an interface method
req := EditRequest{
    Symbol: "Process",
    Content: `Process(ctx context.Context) error`,
}
```

### Variables and Constants

```go
// Replace a variable
req := EditRequest{
    Symbol: "maxRetries",
    Content: `maxRetries = 5 // Maximum retry attempts`,
}

// Replace a constant
req := EditRequest{
    Symbol: "timeout",
    Content: `timeout = 60 * time.Second // Operation timeout`,
}
```

### Imports

```go
// Replace an import
req := EditRequest{
    Symbol: `"fmt"`,
    Content: `"log"`,
}
```

## Examples

### Adding a New Method

```go
// Add a method before an existing one
req := EditRequest{
    Path:     "service.go",
    Symbol:   "Process",
    Position: "before",
    Content: `func (s *Service) Validate(ctx context.Context) error {
        if s.config == nil {
            return errors.New("missing config")
        }
        return nil
    }`,
}
```

### Updating Error Handling

```go
// Replace error handling in a function
req := EditRequest{
    Path:   "handler.go",
    Symbol: "HandleRequest",
    Content: `func HandleRequest(w http.ResponseWriter, r *http.Request) {
        if err := process(r); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        w.WriteHeader(http.StatusOK)
    }`,
}
```

### Adding Context Support

```go
// Update a method to accept context
req := EditRequest{
    Path:   "service.go",
    Symbol: "Process",
    Content: `func (s *Service) Process(ctx context.Context, data []byte) error {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            return s.processData(data)
        }
    }`,
}
```

## Error Handling

The editor returns detailed error information:

```go
// Handle edit failures
result := Edit(req)
if !result.Success {
    switch {
    case strings.Contains(result.Error, "Symbol not found"):
        // Handle missing symbol
        log.Printf("Symbol %s not found", req.Symbol)
    case strings.Contains(result.Error, "Failed to parse"):
        // Handle invalid Go code
        log.Printf("Invalid Go code: %s", result.Error)
    default:
        // Handle other errors
        log.Printf("Edit failed: %s", result.Error)
    }
}
```

Common error cases:
1. Symbol not found in the file
2. Invalid Go code in the Content field
3. File parsing errors
4. File access errors

## Best Practices

1. **Symbol Names**
   - Use exact symbol names
   - Case sensitive
   - For imports, include quotes

2. **Content Formatting**
   - Provide complete declarations
   - Include comments if needed
   - Follow Go formatting conventions

3. **Position Usage**
   - Use empty for replacement
   - "before" for insertion before symbol
   - "after" for insertion after symbol

4. **Error Handling**
   - Always check Success field
   - Handle specific error cases
   - Validate file paths

## Integration Examples

### VSCode Extension

```typescript
import { Edit, EditRequest } from 'go-parser';

async function addContext(filePath: string, methodName: string) {
    const req: EditRequest = {
        Path: filePath,
        Symbol: methodName,
        Content: `func (s *Service) ${methodName}(ctx context.Context) error {
            // Added context support
            return nil
        }`,
    };
    
    const result = await Edit(req);
    if (!result.Success) {
        vscode.window.showErrorMessage(`Failed to add context: ${result.Error}`);
    }
}
```

### CLI Tool

```go
func main() {
    req := EditRequest{
        Path:   os.Args[1],
        Symbol: os.Args[2],
        Content: os.Args[3],
    }
    
    result := Edit(req)
    if !result.Success {
        fmt.Fprintf(os.Stderr, "Edit failed: %s\n", result.Error)
        os.Exit(1)
    }
}
```

## Next Steps

1. Set up automated code modifications in your CI/CD pipeline
2. Create custom code refactoring tools
3. Integrate with your development workflow
