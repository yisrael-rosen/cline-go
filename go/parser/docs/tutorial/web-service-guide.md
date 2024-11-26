# Go Parser Web Service Guide

This guide demonstrates how to use the Go Parser Web Service for advanced code analysis and manipulation.

## Table of Contents
1. [Basic Operations](#basic-operations)
2. [Batch Processing](#batch-processing)
3. [Code Analysis](#code-analysis)
4. [Advanced Features](#advanced-features)
5. [Integration Examples](#integration-examples)

## Basic Operations

### Parsing Go Code

```bash
curl -X POST http://localhost:8080/parse \
    -H "Content-Type: application/json" \
    -d '{
        "content": "package main\n\nfunc Hello() {}"
    }'
```

Response:
```json
{
    "success": true,
    "symbols": [
        {
            "name": "Hello",
            "kind": "function",
            "start": 18,
            "end": 32,
            "doc": ""
        }
    ]
}
```

### Editing Symbols

```bash
curl -X POST http://localhost:8080/edit \
    -H "Content-Type: application/json" \
    -d '{
        "content": "package main\n\nfunc Hello() {}",
        "symbolName": "Hello",
        "editType": "replace",
        "newContent": "func Hello() { println(\"Hello\") }"
    }'
```

## Batch Processing

### Parsing Multiple Files

```bash
curl -X POST http://localhost:8080/batch/parse \
    -H "Content-Type: application/json" \
    -d '{
        "files": [
            {
                "name": "main.go",
                "content": "package main\n\nfunc Hello() {}"
            },
            {
                "name": "util.go",
                "content": "package main\n\nfunc Util() {}"
            }
        ]
    }'
```

### Batch Editing

```bash
curl -X POST http://localhost:8080/batch/edit \
    -H "Content-Type: application/json" \
    -d '{
        "files": [
            {
                "name": "main.go",
                "content": "package main\n\nfunc Hello() {}",
                "edits": [
                    {
                        "symbolName": "Hello",
                        "editType": "replace",
                        "newContent": "func Hello() { println(\"Hello\") }"
                    }
                ]
            }
        ]
    }'
```

## Code Analysis

### Running Analysis Checks

```bash
curl -X POST http://localhost:8080/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "content": "package main\n\nfunc Hello() {}",
        "checks": ["unused", "complexity", "docs"]
    }'
```

Available checks:
- `unused`: Find unused variables and functions
- `complexity`: Calculate cyclomatic complexity
- `docs`: Check documentation coverage
- `errors`: Validate error handling
- `naming`: Check naming conventions

### Code Formatting

```bash
curl -X POST http://localhost:8080/format \
    -H "Content-Type: application/json" \
    -d '{
        "content": "package   main\n\nfunc    Hello()    {}"
    }'
```

## Advanced Features

### Symbol Search

Search for specific symbols with type filtering:

```bash
curl -X POST http://localhost:8080/search \
    -H "Content-Type: application/json" \
    -d '{
        "content": "package main\n\nfunc Hello() {}\nfunc World() {}",
        "pattern": "hello",
        "types": ["function"]
    }'
```

Available types:
- `function`
- `struct`
- `interface`
- `const`
- `var`
- `type`

## Integration Examples

### Python Client

```python
import requests
import json

class GoParserClient:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url

    def parse_code(self, content):
        response = requests.post(
            f"{self.base_url}/parse",
            json={"content": content}
        )
        return response.json()

    def edit_symbol(self, content, symbol_name, new_content):
        response = requests.post(
            f"{self.base_url}/edit",
            json={
                "content": content,
                "symbolName": symbol_name,
                "editType": "replace",
                "newContent": new_content
            }
        )
        return response.json()

# Usage
client = GoParserClient()
result = client.parse_code("package main\n\nfunc Hello() {}")
print(json.dumps(result, indent=2))
```

### Node.js Client

```javascript
const axios = require('axios');

class GoParserClient {
    constructor(baseUrl = 'http://localhost:8080') {
        this.baseUrl = baseUrl;
    }

    async parseCode(content) {
        const response = await axios.post(`${this.baseUrl}/parse`, {
            content
        });
        return response.data;
    }

    async editSymbol(content, symbolName, newContent) {
        const response = await axios.post(`${this.baseUrl}/edit`, {
            content,
            symbolName,
            editType: 'replace',
            newContent
        });
        return response.data;
    }

    async batchParse(files) {
        const response = await axios.post(`${this.baseUrl}/batch/parse`, {
            files
        });
        return response.data;
    }
}

// Usage
const client = new GoParserClient();
client.parseCode('package main\n\nfunc Hello() {}')
    .then(result => console.log(JSON.stringify(result, null, 2)));
```

## Best Practices

1. **Error Handling**
   - Always check the `success` field in responses
   - Handle HTTP errors appropriately
   - Validate input before sending

2. **Performance**
   - Use batch operations for multiple files
   - Consider caching parsed results
   - Limit request sizes

3. **Security**
   - Validate input code
   - Use HTTPS in production
   - Implement rate limiting

## Common Issues

1. **Invalid Go Code**
   ```json
   {
       "success": false,
       "error": "failed to parse: syntax error"
   }
   ```
   Solution: Validate Go code syntax before sending

2. **Symbol Not Found**
   ```json
   {
       "success": false,
       "error": "symbol 'NonExistent' not found"
   }
   ```
   Solution: Verify symbol names from parse results

3. **Server Errors**
   - Check server logs
   - Verify parser binary path
   - Ensure sufficient permissions

## Next Steps

1. Explore the [API Reference](../api/README.md)
2. Try the [Example Projects](../examples/README.md)
3. Join the community discussions
