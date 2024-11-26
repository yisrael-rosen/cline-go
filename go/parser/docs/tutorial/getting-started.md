# Getting Started with Go Parser

This tutorial will guide you through using the Go Parser in different scenarios.

## Installation

1. Build the parser:
```bash
cd go/parser
go run build/build.go
```

This will create binaries in the `bin` directory for your platform.

## Basic Usage

### 1. Command Line Interface

The simplest way to use the parser is through the CLI:

```bash
# Parse a Go file
./bin/goparser -input input.json -output output.json
```

Example input.json:
```json
{
    "operation": "parse",
    "file": "main.go"
}
```

### 2. Node.js Integration

Install the wrapper:
```bash
cd wrapper
npm install
```

Use in your code:
```typescript
import { GoParser } from 'go-parser-wrapper';

const parser = new GoParser();

// Parse a file
const symbols = await parser.parseFile('main.go');
console.log('Symbols:', symbols);

// Edit a symbol
const result = await parser.editSymbol('main.go', {
    symbolName: 'ProcessData',
    editType: 'replace',
    newContent: 'func ProcessData(data []byte) error { return nil }'
});
```

### 3. Web Service

Start the web service:
```bash
cd examples/web-service
go run main.go
```

Make requests:
```bash
# Parse Go code
curl -X POST http://localhost:8080/parse \
    -H "Content-Type: application/json" \
    -d '{
        "content": "package main\n\nfunc Hello() {}"
    }'

# Edit a symbol
curl -X POST http://localhost:8080/edit \
    -H "Content-Type: application/json" \
    -d '{
        "content": "package main\n\nfunc Hello() {}",
        "symbolName": "Hello",
        "editType": "replace",
        "newContent": "func Hello() { println(\"Hello\") }"
    }'
```

## Common Tasks

### 1. Finding Functions

```typescript
const parser = new GoParser();
const symbols = await parser.parseFile('main.go');

// Find all functions
const functions = symbols.filter(s => s.kind === 'function');

// Find a specific function
const mainFunc = symbols.find(s => s.name === 'main' && s.kind === 'function');
```

### 2. Modifying Code

```typescript
// Replace a function
await parser.editSymbol('main.go', {
    symbolName: 'ProcessData',
    editType: 'replace',
    newContent: `
func ProcessData(data []byte) error {
    if len(data) == 0 {
        return errors.New("empty data")
    }
    return nil
}`
});

// Delete a function
await parser.editSymbol('main.go', {
    symbolName: 'OldFunction',
    editType: 'delete'
});
```

### 3. Working with Documentation

```typescript
const parser = new GoParser();
const symbols = await parser.parseFile('main.go');

// Find documented symbols
const documented = symbols.filter(s => s.doc);

// Update documentation
await parser.editSymbol('main.go', {
    symbolName: 'ProcessData',
    editType: 'replace',
    newContent: `
// ProcessData handles data processing.
// It validates input and returns an error if the data is empty.
//
// Deprecated: Use NewProcessor instead.
func ProcessData(data []byte) error {
    return nil
}`
});
```

## VSCode Extension Integration

1. Install dependencies:
```bash
cd examples/vscode-integration
npm install
```

2. Build the extension:
```bash
npm run compile
```

3. Run the extension:
- Press F5 in VSCode
- Open a Go file
- Use commands:
  - "Go Parser: Parse File"
  - "Go Parser: Edit Symbol"

## Best Practices

1. **Error Handling**
```typescript
try {
    const result = await parser.editSymbol('main.go', {
        symbolName: 'ProcessData',
        editType: 'replace',
        newContent: 'invalid go code'
    });
    if (!result.success) {
        console.error('Edit failed:', result.error);
    }
} catch (err) {
    console.error('Parser error:', err);
}
```

2. **File Path Handling**
```typescript
import * as path from 'path';

const filePath = path.resolve(__dirname, 'src', 'main.go');
const symbols = await parser.parseFile(filePath);
```

3. **Batch Processing**
```typescript
// Process multiple files
async function processDirectory(dir: string) {
    const files = await fs.readdir(dir);
    for (const file of files) {
        if (path.extname(file) === '.go') {
            const symbols = await parser.parseFile(path.join(dir, file));
            // Process symbols...
        }
    }
}
```

## Troubleshooting

1. **Parser Not Found**
- Ensure the parser binary is in the correct location
- Set GOPARSER_PATH environment variable
- Check binary permissions

2. **Parse Errors**
- Verify the Go code is valid
- Check file permissions
- Look for syntax errors

3. **Edit Failures**
- Verify symbol name exists
- Ensure new content is valid Go code
- Check file write permissions

## Next Steps

1. Explore the [API Documentation](../api/README.md)
2. Try the [Examples](../examples/README.md)
3. Contribute to the project
