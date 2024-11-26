# Extended Pattern Analysis Guide

This guide covers the extended pattern analysis features of the Go Parser, including behavioral, structural, and creational pattern detection.

## Table of Contents
1. [Behavioral Patterns](#behavioral-patterns)
2. [Structural Patterns](#structural-patterns)
3. [Creational Patterns](#creational-patterns)
4. [Integration Examples](#integration-examples)

## Behavioral Patterns

### Observer Pattern Detection

The parser can detect observer pattern implementations:

```go
// Classic observer pattern
type Subject struct {
    observers []Observer
}

func (s *Subject) Subscribe(o Observer) {  // Detected as observer pattern
    s.observers = append(s.observers, o)
}

func (s *Subject) Notify() {
    for _, o := range s.observers {
        o.Update()
    }
}

// Better approach using channels
type Event struct {
    Data string
}

func ProcessEvents(events <-chan Event) {
    for event := range events {
        // Process event
    }
}
```

Example analysis:
```bash
curl -X POST http://localhost:8080/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "content": "type Subject struct { observers []Observer }\n\nfunc (s *Subject) Subscribe(o Observer) {}",
        "checks": ["behavioral"]
    }'
```

### Strategy Pattern Analysis

Identifies strategy pattern usage:

```go
// Classic strategy pattern
type PaymentStrategy interface {  // Detected as strategy pattern
    Pay(amount float64) error
}

type CreditCardPayment struct{}
type PayPalPayment struct{}

// Better approach using functional options
type PaymentOptions struct {
    processor func(amount float64) error
}

func WithCreditCard() func(*PaymentOptions) {
    return func(o *PaymentOptions) {
        o.processor = processCreditCard
    }
}
```

## Structural Patterns

### Decorator Pattern Detection

Analyzes decorator pattern implementations:

```go
// Classic decorator
type Component interface {
    Operation() string
}

type ConcreteDecorator struct {  // Detected as decorator pattern
    Component Component
}

// Better approach for HTTP handlers
func LogMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Log request
        next.ServeHTTP(w, r)
        // Log response
    })
}
```

### Adapter Pattern Analysis

Detects adapter pattern usage:

```go
// Classic adapter pattern
type Target interface {
    Request() string
}

type Adapter struct {  // Detected as adapter pattern
    adaptee *Adaptee
}

// Better approach using interfaces
type Service interface {
    Process(data []byte) error
}

type LegacyAdapter struct {
    legacy LegacyService
}
```

## Creational Patterns

### Builder Pattern Detection

Identifies builder pattern implementations:

```go
// Classic builder pattern
type UserBuilder struct {  // Detected as builder pattern
    user *User
}

func (b *UserBuilder) WithName(name string) *UserBuilder {
    b.user.Name = name
    return b
}

func (b *UserBuilder) Build() *User {
    return b.user
}

// Better approach using functional options
type Option func(*User)

func WithName(name string) Option {
    return func(u *User) {
        u.Name = name
    }
}

func NewUser(opts ...Option) *User {
    u := &User{}
    for _, opt := range opts {
        opt(u)
    }
    return u
}
```

### Prototype Pattern Analysis

Detects prototype pattern usage:

```go
// Classic prototype pattern
type Prototype interface {
    Clone() Prototype
}

type ConcretePrototype struct {  // Detected as prototype pattern
    field string
}

func (p *ConcretePrototype) Clone() Prototype {
    return &ConcretePrototype{field: p.field}
}

// Better approach using copy
type Config struct {
    Settings map[string]string
}

func (c *Config) Copy() *Config {
    newConfig := &Config{
        Settings: make(map[string]string),
    }
    for k, v := range c.Settings {
        newConfig.Settings[k] = v
    }
    return newConfig
}
```

## Integration Examples

### VSCode Extension

```typescript
import { GoParser } from 'go-parser-wrapper';

async function analyzeExtendedPatterns() {
    const parser = new GoParser();
    
    // Check behavioral patterns
    const behavioralResult = await parser.analyze('main.go', {
        checks: ['behavioral']
    });
    
    // Check structural patterns
    const structuralResult = await parser.analyze('main.go', {
        checks: ['structural']
    });
    
    // Check creational patterns
    const creationalResult = await parser.analyze('main.go', {
        checks: ['creational']
    });
    
    // Handle results
    displayIssues(behavioralResult.issues);
    displayIssues(structuralResult.issues);
    displayIssues(creationalResult.issues);
}
```

### CI/CD Pipeline

```yaml
name: Extended Pattern Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Behavioral Pattern Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["behavioral"]
              }'
              
      - name: Structural Pattern Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["structural"]
              }'
              
      - name: Creational Pattern Check
        run: |
          curl -X POST http://localhost:8080/analyze \
              -H "Content-Type: application/json" \
              -d '{
                  "content": "$(cat main.go)",
                  "checks": ["creational"]
              }'
```

## Best Practices

### Behavioral Patterns

1. **Observer Pattern**
   - Use channels for event handling
   - Consider context for cancellation
   - Keep observers decoupled

2. **Strategy Pattern**
   - Use functional options
   - Keep strategies simple
   - Consider composition

### Structural Patterns

1. **Decorator Pattern**
   - Use middleware for HTTP
   - Keep decorators focused
   - Consider chaining

2. **Adapter Pattern**
   - Use interfaces
   - Keep adapters thin
   - Document adaptations

### Creational Patterns

1. **Builder Pattern**
   - Use functional options
   - Make builders fluent
   - Validate during build

2. **Prototype Pattern**
   - Implement deep copying
   - Consider serialization
   - Document clone behavior

## Common Issues and Solutions

### Behavioral Issues

1. **Complex Observer**
   ```go
   // Problem
   type Subject struct {
       observers []Observer
   }

   // Solution
   type Event struct {
       Data string
   }
   eventChan := make(chan Event)
   ```

2. **Rigid Strategy**
   ```go
   // Problem
   type Strategy interface {
       Execute()
   }

   // Solution
   type Option func(*Config)
   ```

### Structural Issues

1. **Heavy Decorator**
   ```go
   // Problem
   type Decorator struct {
       component Component
       // Many fields
   }

   // Solution
   func Decorate(c Component) Component {
       return ComponentFunc(func() {
           // Minimal decoration
           c.Operation()
       })
   }
   ```

2. **Complex Adapter**
   ```go
   // Problem
   type Adapter struct {
       oldSystem *Legacy
       // Complex adaptation
   }

   // Solution
   type Adapter interface {
       Convert(old Legacy) New
   }
   ```

### Creational Issues

1. **Complicated Builder**
   ```go
   // Problem
   type Builder struct {
       product *Product
       // Many steps
   }

   // Solution
   func NewProduct(opts ...Option) *Product {
       p := &Product{}
       for _, opt := range opts {
           opt(p)
       }
       return p
   }
   ```

2. **Shallow Clone**
   ```go
   // Problem
   func (p *Prototype) Clone() *Prototype {
       return &Prototype{p.data} // Shallow copy
   }

   // Solution
   func (p *Prototype) Clone() *Prototype {
       newData := make([]string, len(p.data))
       copy(newData, p.data)
       return &Prototype{newData}
   }
   ```

## Next Steps

1. Set up extended pattern analysis in your CI/CD pipeline
2. Configure custom pattern detection rules
3. Monitor pattern usage metrics
4. Implement modern alternatives to classic patterns
