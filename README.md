# Cline - Enhanced VSCode AI Assistant

> **⚠️ Important:** This fork currently supports only Claude models. Other language models (OpenAI, Google, etc.) are not supported.

This fork extends the original Cline project with advanced code analysis and editing capabilities through VSCode API integration and custom Go tooling. Remarkably, 99% of this fork's development was performed by Cline itself, demonstrating the potential of AI-driven development.

## Key Improvements

### Intelligent Code Analysis
- **find_references**: Leverages VSCode's API to analyze code relationships
  - Shows all references to symbols (like F12 in VSCode)
  - Critical for understanding impact before making changes
  - Ensures safer code modifications
  - Prevents unintended side effects

### Code Editing Tools

#### VSCode API-Based Tools
- **get_code_symbols** & **edit_code_symbols**: Built on VSCode's native language services API
  - Language-agnostic symbol analysis and editing
  - Leverages VSCode's built-in language intelligence
  - Full support for symbol-based operations (replace/insert/delete)

#### Specialized Go Tools
- **get_go_symbols** & **edit_go_symbols**: Custom-built CLI tool in Go
  - Serves same purpose as VSCode API tools but specialized for Go
  - Handles complex Go code patterns that generic API couldn't process well
  - Direct manipulation through Go's AST package for better precision
  - Better handling of Go-specific structures and documentation
  - More reliable for complex Go codebases

### Enhanced Settings Management
- Settings moved to VSCode's native UI
  - Accessible through User/Workspace settings
  - Better integration with VSCode's configuration system
  - Improved user experience for settings management

### Smart Tool Selection
- Project-specific tool configuration through VSCode settings
  - Enable only the most effective tools for each project
  - Prevents AI from using suboptimal tools for specific tasks
  - Guides AI towards using the most appropriate tools
  - Future-proof as more specialized tools are added

## Testing Infrastructure

### Comprehensive VSCode Integration Tests
- Tests run in clean VSCode instances
- Covers all edge cases for general code tools
- Validates VSCode API integration
- Ensures reliable symbol operations across languages

## Roadmap

### Planned Features
1. **Automated Testing & Deployment**
   - Containerized testing for safety
   - Automatic commits after task completion
   - Self-verification through tests
   - Streamlined PR review process

2. **Enhanced Customization**
   - User-editable system prompts without rebuilding
   - Improved symbol-based editing tools
   - Append-only file modification tool
   - Line-based editing for specific use cases

3. **Project Intelligence**
   - Dedicated file for storing project insights
   - Learning from previous interactions
   - Remembering project-specific patterns
   - Reducing repetitive explanations

## Contributing

Contributions are welcome! Please read the contributing guidelines and check existing issues before submitting pull requests.

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

---

*This fork enhances Cline with specialized code analysis and editing capabilities, with most development performed by Cline itself. The focus is on safe, efficient code modifications through intelligent analysis and precise editing tools.*
