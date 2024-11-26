# Extended Go Pattern Analysis Guide

This guide covers additional Go-specific patterns, including interface design, testing patterns, and package organization.

## Table of Contents
1. [Interface Patterns](#interface-patterns)
2. [Testing Patterns](#testing-patterns)
3. [Package Organization](#package-organization)
4. [Integration Examples](#integration-examples)

## Interface Patterns

### Interface Composition

The parser can detect and analyze interface composition:

```go
// Poor interface design
type Handler interface {  // Will trigger warning
    HandleHTTP(w http.ResponseWriter, r *http.Request)
    HandleGRPC(ctx context.Context, req *Request)
    HandleCLI(args []string)
    Validate() error
    Process() error
}

// Better: Composed interfaces
type HTTPHandler interface {
    HandleHTTP(w http.ResponseWriter, r *http.Request)
}

type GRPCHandler interface {
    HandleGRPC(ctx context.Context, req *Request)
}

type CLIHandler interface {
    HandleCLI(args []string)
}

type Handler interface {
    HTTPHandler
    GRPCHandler
    CLIHandler
}
```

### IO Interface Usage

Detects types that could benefit from io interfaces:

```go
// Missing io interfaces
type DataProcessor struct {  // Will trigger warning
    buffer []byte
    stream *bytes.Buffer
}

// Better implementation
type DataProcessor struct {
    reader io.Reader
    writer io.Writer
}

func (p *DataProcessor) Process() error {
    _, err := io.Copy(p.writer, p.reader)
    return err
}
```

## Testing Patterns

### Table-Driven Tests

Identifies opportunities for table-driven tests:

```go
// Basic test
func TestValidate(t *testing.T) {  // Will trigger warning
    if err := Validate("good"); err != nil {
        t.Error(err)
    }
    if err := Validate(""); err == nil {
        t.Error("expected error")
    }
}

// Better: Table-driven test
func TestValidate(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        wantErr bool
    }{
        {"valid input", "good", false},
        {"empty input", "", true},
        {"invalid input", "bad", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := Validate(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Test Helpers

Analyzes test helper functions:

```go
// Missing helper marker
func setupTestDB(t *testing.T) *DB {  // Will trigger warning
    db, err := NewDB()
    if err != nil {
        t.Fatal(err)
    }
    return db
}

// Better implementation
func setupTestDB(t *testing.T) *DB {
    t.Helper() // Marks as helper for better error reporting
    db, err := NewDB()
    if err != nil {
        t.Fatal(err)
    }
    return db
}
```

## Package Organization

### Package Layout

Detects package organization issues:

```go
// Poor package organization
package utils  // Will trigger warning

// Mixed responsibilities
func ValidateUser(u *User) error {}
func ParseConfig(data []byte) (*Config, error) {}
func LogError(err error) {}

// Better organization
package user
func Validate(u *User) error {}

package config
func Parse(data []byte) (*Config, error) {}

package log
func Error(err error) {}
```

### Internal Packages

Identifies code that should be in internal packages:

```go
// Implementation details exposed
package myapp  // Will trigger warning

type internal struct {
    // Implementation details
}

func internalFunc() {}

// Better organization
package myapp
// Public API only

package internal/impl
// Implementation details
```

## Integration Examples

### VSCode Extension

```typescript
import { GoParser } from 'go-parser-wrapper';

async function analyzeGoPatterns() {
    const parser = new GoParser();
    
    // Check interface patterns
    const interfaceResult = await parser.analyze('main.go', {
        checks: ['interface-patterns']
    });
    
    // Check testing patterns
    const testResult = await parser.analyze('main.go', {
        checks: ['test-patterns']
    });
    
    // Check package organization
    const packageResult = await parser.analyze('main.go', {
        checks: ['package-patterns']
    });
    
    // Handle results
    displayIssues(interfaceResult.issues);
    displayIssues(testResult.issues);
    displayIssues(packageResult.issues);
}
```

### CI/CD Pipeline

```yaml
name: Go Extended Pattern Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Interface Pattern Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["interface-patterns"]
              }'
              
      - name: Test Pattern Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["test-patterns"]
              }'
              
      - name: Package Pattern Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["package-patterns"]
              }'
```

## Best Practices

### Interface Design

1. **Interface Composition**
   - Keep interfaces small
   - Compose larger interfaces
   - Follow interface segregation

2. **IO Interfaces**
   - Use standard interfaces
   - Prefer io.Reader/Writer
   - Enable composition

### Testing

1. **Table-Driven Tests**
   - Use descriptive names
   - Cover edge cases
   - Keep tests readable

2. **Test Helpers**
   - Mark with t.Helper()
   - Keep helpers focused
   - Document usage

### Package Organization

1. **Package Layout**
   - Group by domain
   - Avoid utils packages
   - Follow standard layout

2. **Internal Packages**
   - Hide implementation
   - Expose clean API
   - Control dependencies

## Common Issues and Solutions

### Interface Issues

1. **Large Interfaces**
   ```go
   // Problem
   type Service interface {
       // Too many methods
   }

   // Solution
   type Reader interface {
       Read() error
   }

   type Writer interface {
       Write() error
   }

   type Service interface {
       Reader
       Writer
   }
   ```

2. **Missing IO Interfaces**
   ```go
   // Problem
   type Processor struct {
       data []byte
   }

   // Solution
   type Processor struct {
       reader io.Reader
       writer io.Writer
   }
   ```

### Testing Issues

1. **Repetitive Tests**
   ```go
   // Problem
   func TestAdd(t *testing.T) {
       if Add(1, 1) != 2 { t.Error() }
       if Add(2, 2) != 4 { t.Error() }
   }

   // Solution
   func TestAdd(t *testing.T) {
       tests := []struct{
           x, y, want int
       }{
           {1, 1, 2},
           {2, 2, 4},
       }
       for _, tt := range tests {
           if got := Add(tt.x, tt.y); got != tt.want {
               t.Errorf("Add(%d, %d) = %d; want %d", tt.x, tt.y, got, tt.want)
           }
       }
   }
   ```

2. **Unclear Test Helpers**
   ```go
   // Problem
   func setup() *DB {
       // Setup code
   }

   // Solution
   func setupTestDB(t *testing.T) *DB {
       t.Helper()
       // Setup code with proper cleanup
       t.Cleanup(func() {
           // Cleanup code
       })
   }
   ```

### Package Issues

1. **Utility Packages**
   ```go
   // Problem
   package utils

   // Solution
   package stringutil
   package timeutil
   ```

2. **Mixed Concerns**
   ```go
   // Problem
   package app
   // Mixed implementation and API

   // Solution
   package app
   // Public API only
   
   package internal/impl
   // Implementation details
   ```

## Next Steps

1. Set up extended pattern analysis in your CI/CD pipeline
2. Configure custom pattern rules
3. Monitor pattern usage metrics
4. Implement suggested improvements
