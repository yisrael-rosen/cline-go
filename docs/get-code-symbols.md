# getCodeSymbols Tool Documentation

## Description
The `getCodeSymbols` tool allows you to retrieve the structure of code symbols (functions, methods, classes, etc.) in a source code file. This tool is particularly useful before using `edit_code_symbols` to understand the available symbols that can be edited in a file.

## Parameters
- `path`: (required) The path of the file to analyze (relative to the current working directory)

## Usage
```xml
<getCodeSymbols>
<path>src/services/myService.ts</path>
</getCodeSymbols>
```

## Example Response
```
File structure for 'src/services/myService.ts':
Class: MyService
Method: initialize
Method: processData
Function: helperFunction
Interface: ConfigOptions
```

## Common Use Cases
1. Before editing code symbols to verify the existence and type of symbols
2. To understand the structure of a file before making modifications
3. To discover available methods and classes in a file

## Notes
- The tool uses VSCode's language services to accurately identify symbols
- Works with supported languages like TypeScript, JavaScript, Python, etc.
- Returns both the symbol name and its type (Class, Method, Function, etc.)
- Should be used before `edit_code_symbols` to ensure accurate symbol targeting
