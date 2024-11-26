# Design Pattern Analysis Guide

This guide covers the pattern analysis features of the Go Parser, including design pattern detection, SOLID principles analysis, and API design checks.

## Table of Contents
1. [Design Pattern Analysis](#design-pattern-analysis)
2. [SOLID Principles Analysis](#solid-principles-analysis)
3. [API Design Analysis](#api-design-analysis)
4. [Integration Examples](#integration-examples)

## Design Pattern Analysis

### Singleton Pattern Detection

The parser can detect singleton pattern usage and potential issues:

```go
// Problematic singleton implementation
type Database struct {
    instance *Database  // Private instance
}

func GetInstance() *Database {  // Will trigger warning
    if instance == nil {
        instance = &Database{}
    }
    return instance
}

// Better approach using dependency injection
type Database struct {}

func NewDatabase(config Config) (*Database, error) {
    return &Database{}, nil
}
```

Example analysis:
```bash
curl -X POST http://localhost:8080/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "content": "type Database struct { instance *Database }\n\nfunc GetInstance() *Database { return instance }",
        "checks": ["pattern"]
    }'
```

Response:
```json
{
    "success": true,
    "issues": [
        {
            "type": "pattern",
            "message": "Singleton pattern detected in Database",
            "severity": "warning",
            "suggestion": "Consider dependency injection instead of singleton"
        }
    ]
}
```

### Factory Method Analysis

Analyzes factory method implementations:

```go
// Missing error handling
func NewUser(data []byte) *User {  // Will trigger warning
    return &User{}
}

// Better implementation
func NewUser(data []byte) (*User, error) {
    if len(data) == 0 {
        return nil, errors.New("empty data")
    }
    return &User{}, nil
}
```

## SOLID Principles Analysis

### Single Responsibility Principle

Detects types with multiple responsibilities:

```go
// Too many responsibilities
type UserService struct {  // Will trigger warning
    // Data access
    db *sql.DB
    
    // Email sending
    smtp *smtp.Client
    
    // Logging
    logger *log.Logger
    
    // Caching
    cache *redis.Client
}

// Better: Split into focused types
type UserRepository struct {
    db *sql.DB
}

type EmailService struct {
    smtp *smtp.Client
}
```

### Interface Segregation Principle

Identifies large interfaces that should be split:

```go
// Too many methods
type Service interface {  // Will trigger warning
    GetUser(id string) (*User, error)
    CreateUser(user *User) error
    UpdateUser(user *User) error
    DeleteUser(id string) error
    SendEmail(to, subject, body string) error
    LogActivity(activity string) error
    CacheData(key string, data []byte) error
}

// Better: Focused interfaces
type UserService interface {
    GetUser(id string) (*User, error)
    CreateUser(user *User) error
    UpdateUser(user *User) error
    DeleteUser(id string) error
}

type EmailService interface {
    SendEmail(to, subject, body string) error
}
```

## API Design Analysis

### API Versioning

Checks for proper API versioning:

```go
// Missing versioning
func HandleUser(w http.ResponseWriter, r *http.Request) {  // Will trigger warning
    // ...
}

// With versioning
func HandleUserV1(w http.ResponseWriter, r *http.Request) {
    // ...
}
```

### Error Response Analysis

Analyzes API error handling:

```go
// Poor error handling
func HandleUser(w http.ResponseWriter, r *http.Request) {  // Will trigger warning
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
}

// Better error handling
func HandleUser(w http.ResponseWriter, r *http.Request) {
    if err != nil {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(ErrorResponse{
            Code:    "INVALID_INPUT",
            Message: err.Error(),
        })
        return
    }
}
```

## Integration Examples

### VSCode Extension

```typescript
import { GoParser } from 'go-parser-wrapper';

async function analyzePatterns() {
    const parser = new GoParser();
    
    // Check design patterns
    const patternResult = await parser.analyze('main.go', {
        checks: ['pattern']
    });
    
    // Check SOLID principles
    const solidResult = await parser.analyze('main.go', {
        checks: ['solid']
    });
    
    // Check API design
    const apiResult = await parser.analyze('main.go', {
        checks: ['api']
    });
    
    // Handle results
    displayIssues(patternResult.issues);
    displayIssues(solidResult.issues);
    displayIssues(apiResult.issues);
}

function displayIssues(issues) {
    issues.forEach(issue => {
        console.log(`${issue.severity}: ${issue.message}`);
        console.log(`Suggestion: ${issue.suggestion}`);
    });
}
```

### CI/CD Pipeline

```yaml
name: Pattern Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Pattern Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["pattern"]
              }'
              
      - name: SOLID Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["solid"]
              }'
              
      - name: API Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["api"]
              }'
```

## Best Practices

### Design Patterns

1. **Singleton Pattern**
   - Prefer dependency injection
   - Use for truly global state only
   - Consider thread safety

2. **Factory Methods**
   - Include error handling
   - Validate inputs
   - Use descriptive names

### SOLID Principles

1. **Single Responsibility**
   - Keep types focused
   - Split large types
   - Group related functionality

2. **Interface Segregation**
   - Create small interfaces
   - Split by client needs
   - Focus on behavior

### API Design

1. **Versioning**
   - Version all endpoints
   - Plan for changes
   - Document versions

2. **Error Handling**
   - Use structured responses
   - Include error codes
   - Provide clear messages

## Common Issues and Solutions

### Pattern Issues

1. **Singleton Abuse**
   ```go
   // Problem
   var instance *Service
   func GetInstance() *Service {
       if instance == nil {
           instance = &Service{}
       }
       return instance
   }

   // Solution
   func NewService(config Config) *Service {
       return &Service{config: config}
   }
   ```

2. **Factory Method Issues**
   ```go
   // Problem
   func CreateUser(data []byte) *User {
       return &User{}
   }

   // Solution
   func CreateUser(data []byte) (*User, error) {
       if err := validate(data); err != nil {
           return nil, err
       }
       return &User{}, nil
   }
   ```

### SOLID Issues

1. **Multiple Responsibilities**
   ```go
   // Problem
   type Service struct {
       db *sql.DB
       cache *redis.Client
       logger *log.Logger
   }

   // Solution
   type DataStore interface {
       Get(key string) ([]byte, error)
       Set(key string, value []byte) error
   }

   type Service struct {
       store DataStore
       logger Logger
   }
   ```

2. **Large Interfaces**
   ```go
   // Problem
   type Handler interface {
       Handle(w http.ResponseWriter, r *http.Request)
       ValidateInput(data []byte) error
       ProcessData(data []byte) error
       SaveResult(result []byte) error
   }

   // Solution
   type Handler interface {
       Handle(w http.ResponseWriter, r *http.Request)
   }

   type Validator interface {
       Validate(data []byte) error
   }

   type Processor interface {
       Process(data []byte) error
   }
   ```

### API Issues

1. **Missing Versioning**
   ```go
   // Problem
   func HandleUser(w http.ResponseWriter, r *http.Request) {
       // ...
   }

   // Solution
   func HandleUserV1(w http.ResponseWriter, r *http.Request) {
       // ...
   }
   ```

2. **Poor Error Handling**
   ```go
   // Problem
   if err != nil {
       http.Error(w, err.Error(), 500)
       return
   }

   // Solution
   if err != nil {
       response := ErrorResponse{
           Code:    "INVALID_INPUT",
           Message: "Invalid user data provided",
           Details: err.Error(),
       }
       w.WriteHeader(http.StatusBadRequest)
       json.NewEncoder(w).Encode(response)
       return
   }
   ```

## Next Steps

1. Set up pattern analysis in your CI/CD pipeline
2. Configure custom pattern rules
3. Monitor pattern usage metrics
4. Implement suggested improvements
