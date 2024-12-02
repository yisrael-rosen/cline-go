# Cline Test Commands

## Basic Test Commands

### Run All Tests
```bash
npm test
```
This runs all test suites including VS Code extension tests and unit tests.

### Run Specific Test Suite
```bash
# Using vscode-test (Recommended)
vscode-test --label 0 --reporter c:\Users\ROSEN\dev\cline\node_modules\@vscode\test-cli\out\fullJsonStreamReporter.cjs --run c:\Users\ROSEN\dev\cline\out\test\suite\edit-lines.test.js --grep "^Edit Lines "

# Using npm test with grep
npm test -- --grep "Edit Lines"

# Using test tag
npm run test:edit-lines
```

### Compile Tests
```bash
npm run compile-tests
```
Compiles TypeScript test files before running tests.

## Running Specific Test Suites

### Extension Tests
```bash
# Run extension tests
npm test -- --grep "Extension Test Suite"

# Run specific extension test
npm test -- --grep "Sample test"
```

### Edit Lines Tests
```bash
# Run all edit lines tests
vscode-test --label 0 --reporter c:\Users\ROSEN\dev\cline\node_modules\@vscode\test-cli\out\fullJsonStreamReporter.cjs --run c:\Users\ROSEN\dev\cline\out\test\suite\edit-lines.test.js --grep "^Edit Lines "

# Run with edit-lines tag
npm run test:edit-lines

# Run specific edit lines test
npm test -- --grep "should replace a single line"
```

### Find References Tests
```bash
# Run all find references tests
npm test -- --grep "Find References"

# Run simple references tests
npm test -- --grep "Find References Simple"

# Run specific reference test
npm test -- --grep "should find all class references"
```

### Document Symbols Tests
```bash
# Run all document symbols tests
npm test -- --grep "Find Document Symbols Test Suite"

# Run specific symbols test
npm test -- --grep "should find document symbols in user.ts"
```

### Code Symbols Tests
```bash
# Run all code symbols tests
npm test -- --grep "Edit Code Symbols Test Suite"

# Run specific code symbols test
npm test -- --grep "should replace method content"
```

### Switch Case Tests
```bash
# Run all switch case tests
npm test -- --grep "Switch Case Test Suite"

# Run specific switch case test
npm test -- --grep "should handle empty cases"
```

### Template Tests
```bash
# Run all template tests
npm test -- --grep "templates"

# Run specific template test category
npm test -- --grep "Template CRUD"
npm test -- --grep "Template Validation"
npm test -- --grep "Template Categories"
```

### Capabilities Tests
```bash
# Run capabilities tests
npm test -- --grep "Capabilities"
```

## Development Testing Commands

### Watch Mode
```bash
# Watch test files for changes
npm run watch-tests

# Watch all source files
npm run watch
```

### Type Checking
```bash
# Check types
npm run check-types
```

### Linting
```bash
# Run linter
npm run lint
```

## Test Project Setup

### Install Dependencies
```bash
# Install all dependencies including test dependencies
npm run install:all
```

## VS Code Extension Testing

### Package Extension
```bash
# Build and package extension
npm run vscode:prepublish
```

### Build Commands
```bash
# Build extension
npm run compile

# Build webview
npm run build:webview
```

## Test Environment Options

### Running Tests with Different Configurations
```bash
# Run tests with specific Node options
NODE_OPTIONS=--experimental-vm-modules npm test

# Run tests with debug logging
DEBUG=* npm test

# Run tests with specific VS Code version
VSCODE_VERSION=1.84.0 npm test
```

### Test Tags
```bash
# Run tests with specific tags
npm run test:edit-lines
```

## Debugging Commands

### VS Code Debugging
1. Set breakpoints in test files
2. Press F5 to start debugging
3. Select "Extension Tests" configuration

### Node Debugging
```bash
# Run tests with Node debugger
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand

# Run specific test with debugger
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand path/to/test
```

## Common Command Combinations

### Full Test Suite
```bash
# Run complete test cycle
npm run compile-tests && npm run lint && npm test
```

### Development Cycle
```bash
# Watch mode with type checking
npm run watch-tests & npm run watch:tsc
```

### Clean Build and Test
```bash
# Clean build and run tests
npm run clean && npm run compile-tests && npm test
```

## Notes

1. Always run `npm run compile-tests` before running tests to ensure TypeScript files are up to date.
2. Use `--grep` pattern to run specific tests or test suites.
3. The `test:edit-lines` command is a specialized command for edit-lines tests.
4. VS Code extension tests require a VS Code instance to run.
5. Jest tests can run independently of VS Code.
6. For most focused test runs, use the vscode-test command with specific grep patterns.
