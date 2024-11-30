import { ToolCapabilitiesMap } from '../../../shared/types/project-config';
import { TOOL_DEFINITIONS } from './tools/definitions';

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
    - find_references locates all usages of specific code elements`
];

export const generateCapabilities = (
  cwd: string,
  enabledTools: string[],
  customCapabilities: Record<string, any> = {}
): string => {
  const capabilities = [...CORE_CAPABILITIES];

  // Add tool-specific capabilities
  const tools = TOOL_DEFINITIONS.filter(tool => enabledTools.includes(tool.name));
  
  // Group tools by category
  const categories = {
    core: tools.filter(t => ['read_file', 'write_to_file', 'execute_command', 'search_files', 'list_files'].includes(t.name)),
    code: tools.filter(t => ['edit_code_symbols', 'get_code_symbols', 'edit_go_symbols', 'get_go_symbols'].includes(t.name)),
    json: tools.filter(t => ['edit_json'].includes(t.name)),
    browser: tools.filter(t => ['browser_action'].includes(t.name))
  };

  // Add core capabilities
  if (categories.core.length > 0) {
    capabilities.push(`- For system operations and file management:
    ${categories.core.map(tool => `- ${tool.name}: ${tool.shortDescription}`).join('\n    ')}`);
  }

  // Add code editing capabilities
  if (categories.code.length > 0) {
    capabilities.push(`- For code modifications:
    ${categories.code.map(tool => `- ${tool.name}: ${tool.shortDescription}`).join('\n    ')}`);
  }

  // Add JSON capabilities
  if (categories.json.length > 0) {
    capabilities.push(`- For JSON operations:
    ${categories.json.map(tool => `- ${tool.name}: ${tool.shortDescription}`).join('\n    ')}`);
  }

  // Add browser capabilities
  if (categories.browser.length > 0) {
    capabilities.push(`- For web interactions:
    ${categories.browser.map(tool => `- ${tool.name}: ${tool.shortDescription}`).join('\n    ')}`);
  }

  // Add any custom capabilities
  Object.values(customCapabilities).forEach(capability => {
    capabilities.push(capability);
  });

  return capabilities.join('\n\n');
};
