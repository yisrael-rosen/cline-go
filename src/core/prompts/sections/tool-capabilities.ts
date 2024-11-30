import { ToolCapabilitiesMap } from '../../../shared/types/project-config';

// Core capabilities that are always available
const CORE_CAPABILITIES = [
  `- You have access to tools for executing commands, file operations, searching code, and managing interactions. These core tools form the foundation of your capabilities:
    - execute_command: For running system commands
    - read_file/write_to_file: For file operations
    - search_files: For searching across codebases
    - list_files: For exploring file structures
    - list_code_definition_names: For understanding code organization
    - find_references: For locating symbol usage
    - ask_followup_question: For gathering additional information when needed
    - attempt_completion: For presenting task results`,

  `- When exploring and understanding code:
    - list_files provides an overview of project structure and organization
    - search_files helps find specific code patterns or implementations
    - list_code_definition_names reveals the high-level structure of code
    - find_references locates all usages of specific code elements`,

  `- For system operations and file management:
    - execute_command runs CLI commands with proper explanations
    - read_file examines existing file contents
    - write_to_file creates or updates files
    - Interactive and long-running commands are supported in the terminal`
];

export const generateCapabilities = (
  cwd: string,
  enabledTools: string[],
  customCapabilities: Record<string, any> = {}
): string => {
  const hasTools = (tools: string[]) => 
    tools.every(tool => enabledTools.includes(tool));

  const capabilities = [...CORE_CAPABILITIES];

  // Optional code editing capabilities
  if (hasTools(['edit_code_symbols', 'get_code_symbols'])) {
    capabilities.push(
      `- For precise code modifications, you have symbol-based editing tools:
    - get_code_symbols: Use this tool to analyze a file's structure and understand what symbols (functions, methods, classes) are available for editing. This should be used before edit_code_symbols to ensure accurate targeting of code elements.
    - edit_code_symbols: Use this tool when you need to make precise changes to specific code elements like functions, methods, or classes. This is the preferred tool for:
        - Refactoring a method's implementation while preserving its signature
        - Adding new methods to an existing class
        - Removing deprecated code elements
        - Any changes where you want to target specific symbols in the code`
    );
  }

  // Optional Go-specific editing capabilities
  if (hasTools(['edit_go_symbols', 'get_go_symbols'])) {
    capabilities.push(
      `- For Go code modifications, you have specialized tools:
    - get_go_symbols: Use this tool to analyze Go file structure before reading or editing Go files. This provides an efficient way to understand Go-specific code organization without needing to read the entire file content. Always use this tool first when working with Go files to:
        - Understand the available symbols (functions, methods, types, etc.)
        - Plan your edits more effectively
        - Get an overview of the code structure
    - edit_go_symbols: Use this tool specifically for Go code modifications, allowing you to:
        - Modify function implementations while preserving Go-specific syntax and structure
        - Add new methods to existing types
        - Update struct definitions and interfaces
        - Make precise changes to Go-specific code elements like receivers and package-level declarations`
    );
  }

  // Optional JSON editing capabilities
  if (hasTools(['edit_json'])) {
    capabilities.push(
      `- For JSON file modifications, you have a specialized tool:
    - edit_json: Use this tool for precise modifications to JSON files using dot notation paths. This tool allows you to:
        - Set values at specific paths in the JSON structure
        - Delete fields or array elements
        - Append items to arrays
        - Make targeted changes to JSON configuration files
        - Update nested JSON structures while preserving the overall format`
    );
  }

  // Browser capabilities
  if (hasTools(['browser_action'])) {
    capabilities.push(
      `- You can use the browser_action tool to interact with websites (including html files and locally running development servers) through a Puppeteer-controlled browser when you feel it is necessary in accomplishing the user's task. This tool is particularly useful for web development tasks, as it allows you to launch a browser, navigate to pages, interact with elements through clicks and keyboard input, and capture the results through screenshots and console logs. This tool may be useful at key stages of web development tasks, such as after implementing new features, making substantial changes, when troubleshooting issues, or to verify the result of your work. You can analyze the provided screenshots to ensure correct rendering or identify errors, and review console logs for runtime issues.`,
      
      `- For example, if asked to add a component to a react website, you might create the necessary files, use execute_command to run the site locally, then use browser_action to launch the browser, navigate to the local server, and verify the component renders & functions correctly before closing the browser.`
    );
  }

  // Add any custom capabilities
  Object.values(customCapabilities).forEach(capability => {
    capabilities.push(capability);
  });

  return capabilities.join('\n\n');
};
