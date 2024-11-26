# Go-Specific Pattern Analysis Guide

This guide covers the Go-specific pattern analysis features, including idiomatic Go patterns, concurrency patterns, and error handling patterns.

## Table of Contents
1. [Go Patterns](#go-patterns)
2. [Concurrency Patterns](#concurrency-patterns)
3. [Error Handling Patterns](#error-handling-patterns)
4. [Integration Examples](#integration-examples)

## Go Patterns

### Functional Options Pattern

The parser can detect and analyze functional options pattern usage:

```go
// Basic functional options pattern
type Server struct {
    addr string
    port int
}

type ServerOption func(*Server)

func WithPort(port int) ServerOption {  // Detected as options pattern
    return func(s *Server) {
        s.port = port
    }
}

func NewServer(opts ...ServerOption) *Server {
    s := &Server{
        addr: "localhost",  // Default value
        port: 8080,        // Default value
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// Usage
server := NewServer(
    WithPort(9000),
)
```

Example analysis:
```bash
curl -X POST http://localhost:8080/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "content": "type ServerOption func(*Server)\n\nfunc WithPort(port int) ServerOption {}",
        "checks": ["go-patterns"]
    }'
```

### Constructor Patterns

Analyzes constructor implementations:

```go
// Missing validation
func NewConfig(path string) *Config {  // Will trigger warning
    return &Config{path: path}
}

// Better implementation
func NewConfig(path string) (*Config, error) {
    if path == "" {
        return nil, errors.New("path cannot be empty")
    }
    if !filepath.IsAbs(path) {
        return nil, errors.New("path must be absolute")
    }
    return &Config{path: path}, nil
}
```

## Concurrency Patterns

### Worker Pool Pattern

Detects worker pool implementations:

```go
// Basic worker pool without context
func processItems(items []Item) {  // Will trigger warning
    jobs := make(chan Item)
    results := make(chan Result)

    // Start workers
    for i := 0; i < 3; i++ {
        go worker(jobs, results)
    }

    // Send jobs
    go func() {
        for _, item := range items {
            jobs <- item
        }
        close(jobs)
    }()
}

// Better implementation with context
func processItems(ctx context.Context, items []Item) error {
    g, ctx := errgroup.WithContext(ctx)
    jobs := make(chan Item)
    results := make(chan Result)

    // Start workers
    for i := 0; i < 3; i++ {
        g.Go(func() error {
            return worker(ctx, jobs, results)
        })
    }

    // Send jobs
    go func() {
        defer close(jobs)
        for _, item := range items {
            select {
            case jobs <- item:
            case <-ctx.Done():
                return
            }
        }
    }()

    return g.Wait()
}
```

### Pipeline Pattern

Analyzes pipeline implementations:

```go
// Pipeline without context
func processData() <-chan Result {  // Will trigger warning
    out := make(chan Result)
    go func() {
        defer close(out)
        // Process data
    }()
    return out
}

// Better implementation with context
func processData(ctx context.Context) (<-chan Result, error) {
    out := make(chan Result)
    go func() {
        defer close(out)
        select {
        case <-ctx.Done():
            return
        case out <- result:
            // Process data
        }
    }()
    return out, nil
}
```

## Error Handling Patterns

### Error Wrapping

Detects proper error wrapping:

```go
// Unwrapped error
func processFile(path string) error {
    data, err := ioutil.ReadFile(path)
    if err != nil {
        return err  // Will trigger warning
    }
    return process(data)
}

// Proper error wrapping
func processFile(path string) error {
    data, err := ioutil.ReadFile(path)
    if err != nil {
        return fmt.Errorf("failed to read file %s: %w", path, err)
    }
    return process(data)
}
```

### Custom Error Types

Analyzes custom error type implementations:

```go
// Basic error type without context
type ValidationError struct {  // Will trigger warning
    msg string
}

func (e *ValidationError) Error() string {
    return e.msg
}

// Better implementation with context
type ValidationError struct {
    Field   string
    Value   interface{}
    Message string
    Code    string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %v is invalid: %s (code: %s)", 
        e.Field, e.Value, e.Message, e.Code)
}
```

## Integration Examples

### VSCode Extension

```typescript
import { GoParser } from 'go-parser-wrapper';

async function analyzeGoPatterns() {
    const parser = new GoParser();
    
    // Check Go patterns
    const patternResult = await parser.analyze('main.go', {
        checks: ['go-patterns']
    });
    
    // Check concurrency patterns
    const concurrencyResult = await parser.analyze('main.go', {
        checks: ['concurrency']
    });
    
    // Check error handling
    const errorResult = await parser.analyze('main.go', {
        checks: ['errors']
    });
    
    // Handle results
    displayIssues(patternResult.issues);
    displayIssues(concurrencyResult.issues);
    displayIssues(errorResult.issues);
}
```

### CI/CD Pipeline

```yaml
name: Go Pattern Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Go Pattern Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["go-patterns"]
              }'
              
      - name: Concurrency Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["concurrency"]
              }'
              
      - name: Error Handling Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["errors"]
              }'
```

## Best Practices

### Go Patterns

1. **Functional Options**
   - Use for optional configuration
   - Provide good defaults
   - Document each option

2. **Constructors**
   - Validate inputs
   - Return errors when needed
   - Set sensible defaults

### Concurrency

1. **Worker Pools**
   - Use context for cancellation
   - Handle errors properly
   - Control number of workers

2. **Pipelines**
   - Add context handling
   - Close channels properly
   - Handle backpressure

### Error Handling

1. **Error Wrapping**
   - Add context to errors
   - Use %w for wrapping
   - Include relevant details

2. **Custom Errors**
   - Add context fields
   - Implement unwrap if needed
   - Follow error interface

## Common Issues and Solutions

### Pattern Issues

1. **Poor Options Pattern**
   ```go
   // Problem
   type Server struct {
       config map[string]interface{}  // Too generic
   }

   // Solution
   type Server struct {
       addr string
       port int
   }

   type ServerOption func(*Server)
   ```

2. **Unsafe Constructor**
   ```go
   // Problem
   func NewClient(addr string) *Client {
       return &Client{addr: addr}  // No validation
   }

   // Solution
   func NewClient(addr string) (*Client, error) {
       if addr == "" {
           return nil, errors.New("address required")
       }
       return &Client{addr: addr}, nil
   }
   ```

### Concurrency Issues

1. **Uncontrolled Workers**
   ```go
   // Problem
   for _, item := range items {
       go process(item)  // No control
   }

   // Solution
   g, ctx := errgroup.WithContext(ctx)
   for _, item := range items {
       item := item
       g.Go(func() error {
           return process(ctx, item)
       })
   }
   ```

2. **Channel Leaks**
   ```go
   // Problem
   ch := make(chan int)
   go func() {
       ch <- 1  // Might block forever
   }()

   // Solution
   ch := make(chan int)
   go func() {
       defer close(ch)
       select {
       case ch <- 1:
       case <-ctx.Done():
           return
       }
   }()
   ```

### Error Issues

1. **Lost Context**
   ```go
   // Problem
   if err != nil {
       return err  // Context lost
   }

   // Solution
   if err != nil {
       return fmt.Errorf("failed to process: %w", err)
   }
   ```

2. **Poor Error Types**
   ```go
   // Problem
   type MyError string

   // Solution
   type MyError struct {
       Op   string
       Path string
       Err  error
   }
   ```

## Next Steps

1. Set up Go pattern analysis in your CI/CD pipeline
2. Configure custom pattern rules
3. Monitor pattern usage metrics
4. Implement suggested improvements
