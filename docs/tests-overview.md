# Cline Tests Overview

## Running Tests

### Recommended Method
The most focused and efficient way to run specific tests is using vscode-test directly:

```bash
vscode-test --label 0 --reporter c:\Users\ROSEN\dev\cline\node_modules\@vscode\test-cli\out\fullJsonStreamReporter.cjs --run c:\Users\ROSEN\dev\cline\out\test\suite\edit-lines.test.js --grep "^Edit Lines "
```

This method:
- Runs tests directly in VS Code environment
- Provides focused test execution
- Gives clear output
- Is faster than running all tests

### Alternative Methods
1. Using npm test with grep:
```bash
npm test -- --grep "Edit Lines"
```

2. Using test tags:
```bash
npm run test:edit-lines
```

## Test Structure

The project uses multiple test frameworks and approaches to ensure code quality:

### 1. Core Test Suites

#### Extension Tests (`src/test/suite/extension.test.ts`)
- Basic extension functionality tests
- Verifies extension activation and core features
- Simple integration tests with VS Code API

#### Capabilities Tests (`src/test/core/capabilities.test.ts`)
- Tests core capabilities of the extension
- Verifies feature availability and configuration
- Ensures proper capability reporting

#### Memory Service Tests (`src/test/services/memory/`)
- Tests memory management functionality
- Handles state persistence
- Verifies memory limits and cleanup

#### Template Runner Tests (`src/test/runTemplateTests.ts`)
- Tests template execution system
- Verifies template processing
- Tests template variable substitution

### 2. Feature-Specific Test Suites

#### Edit Lines Tests (`src/test/suite/edit-lines.test.ts`)
- Tests line-based text editing functionality
- Covers:
  - Single line replacement
  - Line insertion
  - Line deletion
  - Indentation preservation
  - Whitespace handling
  - Mixed line endings
  - Empty file handling

#### Template Tests (`src/test/core/prompts/templates.test.ts`)
- Tests template management system
- Features tested:
  - Template CRUD operations
  - Template validation
  - Category management
  - Template export/import
  - Active template management

### 3. Code Analysis Test Suites

#### Find Document Symbols Tests (`src/test/suite/find-document-symbols.test.ts`)
- Tests symbol detection in TypeScript/JavaScript files
- Verifies:
  - Interface detection
  - Class detection
  - Method detection
  - Property detection
  - Empty file handling

#### Find References Tests
- Complex References (`src/test/suite/find-references.test.ts`)
  - Tests cross-file reference finding
  - Handles complex code structures
  - Tests workspace-wide references

- Simple References (`src/test/suite/find-references-simple.test.ts`)
  - Tests basic reference finding
  - Single file references
  - Simple code structures

### 4. Code Modification Test Suites

#### Edit Code Symbols Tests (`src/test/suite/edit-code-symbols.test.ts`)
- Tests symbol-based code modification
- Features tested:
  - Method content replacement
  - Method insertion
  - Method deletion
  - Interface modification
  - Multiple sequential operations

#### Switch Case Tests (`src/test/suite/switch-case.test.ts`)
- Tests switch statement handling
- Covers:
  - Empty case handling
  - Case statement modification
  - Fallthrough cases
  - Nested switch statements
  - Whitespace preservation

## Test Configuration

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.test.ts'
    ],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(os-name|default-shell)/)'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
```

Key Configuration Points:
- Uses `ts-jest` for TypeScript support
- Tests run in Node.js environment
- Looks for tests in `__tests__` directories
- Handles TypeScript and JavaScript files
- Excludes certain node modules from transformation

### TypeScript Test Configuration (`src/test/tsconfig.json`)
- Separate TypeScript configuration for tests
- Ensures proper compilation of test files
- Configures module resolution and types

### VS Code Test Runner Configuration
- Uses `@vscode/test-electron`
- Handles VS Code extension testing environment
- Manages test workspace and extension host

## Test Project Structure

```
src/test/
├── core/                    # Core functionality tests
│   ├── __mocks__/          # VS Code API mocks
│   ├── capabilities.test.ts
│   └── prompts/            # Template and prompt tests
├── services/               # Service-specific tests
│   └── memory/            # Memory service tests
├── suite/                  # Integration test suites
│   ├── test-project/      # Test files for integration tests
│   │   ├── src/           # Source files for testing
│   │   │   ├── auth.ts    # Authentication test files
│   │   │   ├── message.ts # Messaging test files
│   │   │   ├── user.ts    # User management test files
│   │   │   └── empty.ts   # Empty file test cases
│   │   ├── *.ts          # Test TypeScript files
│   │   ├── *.js          # Compiled JavaScript files
│   │   └── tsconfig.json # Test project configuration
│   └── *.test.ts         # Test suite files
├── extension.test.ts      # Main extension tests
├── runTemplateTests.ts    # Template runner tests
└── tsconfig.json         # Test TypeScript configuration
```

## Test Frameworks Used

1. **Mocha**
   - Used for VS Code extension tests
   - Provides test suite organization
   - Handles async tests

2. **Jest**
   - Used for unit tests
   - Provides mocking capabilities
   - Handles TypeScript tests

## Mock System

### VS Code API Mocks (`src/test/core/__mocks__/vscode.ts`)
- Provides mock implementations of VS Code APIs
- Simulates VS Code environment
- Enables testing without VS Code runtime

### Test Project Files
- Located in `src/test/suite/test-project/`
- Includes both TypeScript and JavaScript files
- Provides realistic test scenarios

## Writing New Tests

### Guidelines

1. **Test Organization**
   - Place unit tests in `__tests__` directories
   - Place integration tests in `test/suite`
   - Use descriptive test suite and case names

2. **Test Coverage**
   - Write tests for new features
   - Include both positive and negative test cases
   - Test edge cases and error conditions

3. **Test Independence**
   - Each test should be independent
   - Clean up test environment after each test
   - Don't rely on test execution order

### Best Practices

1. **File Organization**
   - Keep test files close to implementation
   - Use consistent naming conventions
   - Group related tests in suites

2. **Test Structure**
   - Use descriptive test names
   - Follow Arrange-Act-Assert pattern
   - Include setup and teardown as needed

3. **Assertions**
   - Use specific assertions
   - Include meaningful error messages
   - Test both success and failure cases

## Debugging Tests

### VS Code Integration Tests
1. Set breakpoints in test files
2. Use VS Code debug configuration
3. Run tests in debug mode

### Jest Unit Tests
1. Use Jest debug configuration
2. Run specific test files
3. Use Jest watch mode for development

## Common Issues and Solutions

1. **Test File Not Found**
   - Ensure test project files are in correct location
   - Check file paths in test configuration
   - Verify TypeScript compilation settings

2. **VS Code API Errors**
   - Check mock implementations
   - Verify VS Code extension activation
   - Ensure proper test environment setup

3. **TypeScript Compilation Issues**
   - Verify tsconfig.json settings
   - Check module resolution
   - Ensure proper type definitions

## Future Improvements

1. **Test Coverage**
   - Increase overall test coverage
   - Add more edge case tests
   - Improve error case coverage

2. **Test Performance**
   - Optimize test execution time
   - Parallelize test runs where possible
   - Reduce test dependencies

3. **Test Maintenance**
   - Regular test cleanup
   - Remove duplicate tests
   - Update outdated test cases

4. **Test Project Structure**
   - Better organization of test files
   - More comprehensive test scenarios
   - Improved mock system
