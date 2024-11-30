import { ToolUseName } from '../../../../shared/ExtensionMessage';
import { READ_FILE_TEMPLATE, WRITE_TO_FILE_TEMPLATE } from './templates/file-tools';

export interface ToolDefinition {
  name: ToolUseName;
  shortDescription: string;
  capabilities: string[];
  apiDoc: (cwd: string) => string;
  parameters: {
    name: string;
    required: boolean;
    description: string;
  }[];
  examples?: {
    description: string;
    code: string;
  }[];
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'read_file',
    shortDescription: 'For reading file contents',
    capabilities: [
      'Examines existing file contents',
      'Provides access to file contents for analysis'
    ],
    parameters: [
      {
        name: 'path',
        required: true,
        description: 'The path of the file to read'
      }
    ],
    apiDoc: READ_FILE_TEMPLATE
  },
  {
    name: 'write_to_file',
    shortDescription: 'For creating or updating files',
    capabilities: [
      'Creates new files or updates existing ones',
      'Automatically creates necessary directories',
      'Preserves file structure and formatting'
    ],
    parameters: [
      {
        name: 'path',
        required: true,
        description: 'The path of the file to write to'
      },
      {
        name: 'content',
        required: true,
        description: 'The content to write to the file'
      }
    ],
    apiDoc: WRITE_TO_FILE_TEMPLATE
  }
];

const generateToolCapabilities = (enabledTools: string[]): string => {
  const tools = TOOL_DEFINITIONS.filter(tool => enabledTools.includes(tool.name));
  
  // Group tools by category
  const categories = {
    core: tools.filter(t => ['read_file', 'write_to_file', 'execute_command', 'search_files', 'list_files'].includes(t.name)),
    code: tools.filter(t => ['edit_code_symbols', 'get_code_symbols', 'edit_go_symbols', 'get_go_symbols'].includes(t.name)),
    json: tools.filter(t => ['edit_json'].includes(t.name)),
    browser: tools.filter(t => ['browser_action'].includes(t.name))
  };

  const sections = [];

  // Core capabilities
  if (categories.core.length > 0) {
    sections.push(`- For system operations and file management:
    ${categories.core.map(tool => `- ${tool.name}: ${tool.shortDescription}`).join('\n    ')}`);
  }

  // Code editing capabilities
  if (categories.code.length > 0) {
    sections.push(`- For code modifications:
    ${categories.code.map(tool => `- ${tool.name}: ${tool.shortDescription}`).join('\n    ')}`);
  }

  // JSON capabilities
  if (categories.json.length > 0) {
    sections.push(`- For JSON operations:
    ${categories.json.map(tool => `- ${tool.name}: ${tool.shortDescription}`).join('\n    ')}`);
  }

  // Browser capabilities
  if (categories.browser.length > 0) {
    sections.push(`- For web interactions:
    ${categories.browser.map(tool => `- ${tool.name}: ${tool.shortDescription}`).join('\n    ')}`);
  }

  return sections.join('\n\n');
};

const generateToolDocs = (cwd: string, enabledTools: string[]): string => {
  return TOOL_DEFINITIONS
    .filter(tool => enabledTools.includes(tool.name))
    .map(tool => tool.apiDoc(cwd))
    .join('\n\n');
};

export { generateToolCapabilities, generateToolDocs };
