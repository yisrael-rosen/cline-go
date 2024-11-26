# Go Performance Pattern Analysis Guide

This guide covers performance-related patterns in Go, including memory optimization, generics usage, and context handling.

## Table of Contents
1. [Performance Patterns](#performance-patterns)
2. [Generics Patterns](#generics-patterns)
3. [Context Patterns](#context-patterns)
4. [Integration Examples](#integration-examples)

## Performance Patterns

### Slice Preallocation

The parser can detect opportunities for slice preallocation:

```go
// Inefficient: Growing slice in loop
func process(items []int) []int {
    var result []int  // Will trigger warning
    for _, item := range items {
        result = append(result, item*2)
    }
    return result
}

// Better: Preallocate slice
func process(items []int) []int {
    result := make([]int, 0, len(items))  // Preallocate capacity
    for _, item := range items {
        result = append(result, item*2)
    }
    return result
}
```

Example analysis:
```bash
curl -X POST http://localhost:8080/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "content": "func process(items []int) []int { var result []int; for range items { result = append(result, 0) }; return result }",
        "checks": ["performance"]
    }'
```

### String Concatenation

Identifies inefficient string concatenation:

```go
// Inefficient: String concatenation in loop
func buildString(items []string) string {
    result := ""  // Will trigger warning
    for _, item := range items {
        result += item + ","
    }
    return result
}

// Better: Use strings.Builder
func buildString(items []string) string {
    var builder strings.Builder
    builder.Grow(len(items) * 8)  // Estimate size
    for _, item := range items {
        builder.WriteString(item)
        builder.WriteByte(',')
    }
    return builder.String()
}
```

## Generics Patterns

### Type Constraints

Analyzes generic type constraints:

```go
// Too loose constraints
type Stack[T any] struct {  // Will trigger warning
    items []T
}

// Better: Use specific constraints
type Number interface {
    ~int | ~float64
}

type Stack[T Number] struct {
    items []T
}
```

### Generic Methods

Identifies opportunities for generics:

```go
// Duplicate code for different types
func SortInts(items []int) []int {  // Will trigger warning
    // Sort implementation
}

func SortStrings(items []string) []string {
    // Same sort implementation
}

// Better: Use generics
func Sort[T constraints.Ordered](items []T) []T {
    // Single implementation
}
```

## Context Patterns

### Context Parameter Position

Checks context parameter placement:

```go
// Incorrect context position
func processData(data []byte, ctx context.Context) error {  // Will trigger warning
    // ...
}

// Better: Context as first parameter
func processData(ctx context.Context, data []byte) error {
    // ...
}
```

### Context Propagation

Analyzes context propagation:

```go
// Missing context propagation
func processItem(ctx context.Context, item Item) error {
    return process(item)  // Will trigger warning
}

// Better: Propagate context
func processItem(ctx context.Context, item Item) error {
    return process(ctx, item)
}
```

## Integration Examples

### VSCode Extension

```typescript
import { GoParser } from 'go-parser-wrapper';

async function analyzePerformance() {
    const parser = new GoParser();
    
    // Check performance patterns
    const perfResult = await parser.analyze('main.go', {
        checks: ['performance']
    });
    
    // Check generics usage
    const genericsResult = await parser.analyze('main.go', {
        checks: ['generics']
    });
    
    // Check context usage
    const contextResult = await parser.analyze('main.go', {
        checks: ['context']
    });
    
    // Handle results
    displayIssues(perfResult.issues);
    displayIssues(genericsResult.issues);
    displayIssues(contextResult.issues);
}
```

### CI/CD Pipeline

```yaml
name: Performance Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Performance Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["performance"]
              }'
              
      - name: Generics Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["generics"]
              }'
              
      - name: Context Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["context"]
              }'
```

## Best Practices

### Performance

1. **Slice Operations**
   - Preallocate when size is known
   - Use copy() for slices
   - Avoid unnecessary allocations

2. **String Handling**
   - Use strings.Builder for concatenation
   - Preallocate builder capacity
   - Avoid string conversion in loops

### Generics

1. **Type Constraints**
   - Use specific constraints
   - Avoid empty interfaces
   - Consider composition

2. **Generic Functions**
   - Extract common logic
   - Use type parameters judiciously
   - Document constraints

### Context

1. **Parameter Order**
   - Context always first
   - Document timeout behavior
   - Handle cancellation

2. **Propagation**
   - Pass context to all functions
   - Check cancellation
   - Clean up resources

## Common Issues and Solutions

### Performance Issues

1. **Growing Slices**
   ```go
   // Problem
   var items []int
   for i := 0; i < n; i++ {
       items = append(items, i)
   }

   // Solution
   items := make([]int, 0, n)
   for i := 0; i < n; i++ {
       items = append(items, i)
   }
   ```

2. **String Building**
   ```go
   // Problem
   var result string
   for _, s := range strings {
       result += s
   }

   // Solution
   var builder strings.Builder
   builder.Grow(totalLen)
   for _, s := range strings {
       builder.WriteString(s)
   }
   ```

### Generics Issues

1. **Loose Constraints**
   ```go
   // Problem
   func Process[T any](item T) T {
       // ...
   }

   // Solution
   type Processor interface {
       Process() error
   }
   func Process[T Processor](item T) T {
       // ...
   }
   ```

2. **Duplicate Code**
   ```go
   // Problem
   func ProcessInts([]int) {}
   func ProcessFloats([]float64) {}

   // Solution
   func Process[T constraints.Number]([]T) {}
   ```

### Context Issues

1. **Wrong Order**
   ```go
   // Problem
   func Process(data []byte, ctx context.Context) {
       // ...
   }

   // Solution
   func Process(ctx context.Context, data []byte) {
       // ...
   }
   ```

2. **Missing Propagation**
   ```go
   // Problem
   func (s *Service) Process(ctx context.Context, data []byte) {
       s.worker.Process(data)  // Context lost
   }

   // Solution
   func (s *Service) Process(ctx context.Context, data []byte) {
       s.worker.Process(ctx, data)
   }
   ```

## Next Steps

1. Set up performance analysis in your CI/CD pipeline
2. Configure custom performance rules
3. Monitor performance metrics
4. Implement suggested improvements
