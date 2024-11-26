# Go Escape Analysis Guide

This guide covers escape analysis patterns in Go, including pointer escapes, inlining opportunities, and zero allocation techniques.

## Table of Contents
1. [Escape Analysis](#escape-analysis)
2. [Inlining Patterns](#inlining-patterns)
3. [Zero Allocation Patterns](#zero-allocation-patterns)
4. [Integration Examples](#integration-examples)

## Escape Analysis

### Pointer Escapes

The parser can detect unnecessary pointer escapes:

```go
// Unnecessary pointer escape
type User struct {
    Name string
    Age  int
}

func NewUser(name string) *User {  // Will trigger warning
    return &User{
        Name: name,
        Age:  0,
    }
}

// Better: Return value for small structs
func NewUser(name string) User {
    return User{
        Name: name,
        Age:  0,
    }
}
```

Example analysis:
```bash
curl -X POST http://localhost:8080/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "content": "func NewUser(name string) *User { return &User{Name: name} }",
        "checks": ["escape"]
    }'
```

### Closure Captures

Identifies problematic closure variable captures:

```go
// Pointer captured by closure
func processItems(items []Item) {
    var processor *Processor  // Will trigger warning
    go func() {
        processor.Process(items)  // Captured pointer
    }()
}

// Better: Pass value to closure
func processItems(items []Item) {
    processor := NewProcessor()
    go func(p Processor) {
        p.Process(items)
    }(processor)
}
```

## Inlining Patterns

### Inline Candidates

Detects functions that could be inlined:

```go
// Good candidate for inlining
func isValid(x int) bool {  // Will be detected as inline candidate
    return x > 0 && x < 100
}

// Not a good candidate
func processData(data []byte) error {
    // Too many statements
    validate()
    transform()
    store()
    notify()
    cleanup()
    return nil
}
```

### Inlining Blockers

Identifies patterns that prevent inlining:

```go
// Has inlining blocker
func process(data []byte) error {  // Will trigger warning
    defer cleanup()  // Prevents inlining
    return processData(data)
}

// Better: Separate concerns
func process(data []byte) error {
    err := processData(data)
    cleanup()
    return err
}
```

## Zero Allocation Patterns

### String Conversions

Detects unnecessary string allocations:

```go
// Allocates new string
func process(data []byte) {
    str := string(data)  // Will trigger warning
    log.Print(str)
}

// Better: Use []byte directly
func process(data []byte) {
    log.Printf("%s", data)  // Uses []byte directly
}
```

### Interface Conversions

Analyzes unnecessary interface conversions:

```go
// Unnecessary interface conversion
func process(data interface{}) {
    if _, ok := data.(interface{}); ok {  // Will trigger warning
        // ...
    }
}

// Better: Use concrete types
func process(data string) {
    // Work with concrete type directly
}
```

## Integration Examples

### VSCode Extension

```typescript
import { GoParser } from 'go-parser-wrapper';

async function analyzeEscapes() {
    const parser = new GoParser();
    
    // Check escape patterns
    const escapeResult = await parser.analyze('main.go', {
        checks: ['escape']
    });
    
    // Check inlining opportunities
    const inlineResult = await parser.analyze('main.go', {
        checks: ['inline']
    });
    
    // Check allocation patterns
    const allocResult = await parser.analyze('main.go', {
        checks: ['alloc']
    });
    
    // Handle results
    displayIssues(escapeResult.issues);
    displayIssues(inlineResult.issues);
    displayIssues(allocResult.issues);
}
```

### CI/CD Pipeline

```yaml
name: Escape Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Escape Analysis Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["escape"]
              }'
              
      - name: Inline Analysis Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["inline"]
              }'
              
      - name: Allocation Analysis Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["alloc"]
              }'
```

## Best Practices

### Escape Analysis

1. **Return Values**
   - Return small structs by value
   - Use pointers for large objects
   - Consider cache effects

2. **Closure Variables**
   - Pass values to goroutines
   - Avoid capturing pointers
   - Copy if necessary

### Inlining

1. **Function Size**
   - Keep functions small
   - Avoid defer in hot paths
   - Split complex functions

2. **Inlining Hints**
   - Use //go:inline comments
   - Remove inlining blockers
   - Profile before optimizing

### Zero Allocations

1. **String Handling**
   - Use []byte when possible
   - Avoid unnecessary conversions
   - Reuse buffers

2. **Interface Usage**
   - Use concrete types
   - Avoid empty interfaces
   - Minimize type assertions

## Common Issues and Solutions

### Escape Issues

1. **Small Value Pointers**
   ```go
   // Problem
   func NewPoint() *Point {
       return &Point{1, 2}
   }

   // Solution
   func NewPoint() Point {
       return Point{1, 2}
   }
   ```

2. **Closure Captures**
   ```go
   // Problem
   var data *Data
   go func() {
       process(data)
   }()

   // Solution
   data := getData()
   go func(d Data) {
       process(d)
   }(data)
   ```

### Inlining Issues

1. **Function Complexity**
   ```go
   // Problem
   func process() {
       // Many statements
   }

   // Solution
   func process() {
       preprocess()
       compute()
       cleanup()
   }
   ```

2. **Defer Usage**
   ```go
   // Problem
   func hot() {
       defer cleanup()
   }

   // Solution
   func hot() {
       result := compute()
       cleanup()
       return result
   }
   ```

### Allocation Issues

1. **String Conversion**
   ```go
   // Problem
   s := string(bytes)
   process(s)

   // Solution
   process(bytes)
   ```

2. **Interface Usage**
   ```go
   // Problem
   var data interface{} = getData()
   val := data.(string)

   // Solution
   data := getData()
   process(data) // Use concrete type
   ```

## Next Steps

1. Set up escape analysis in your CI/CD pipeline
2. Configure custom analysis rules
3. Monitor allocation patterns
4. Implement suggested improvements
