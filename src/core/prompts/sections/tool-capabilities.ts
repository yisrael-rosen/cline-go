import { ToolCapabilitiesMap } from '../../../shared/types/project-config';

export const defaultToolCapabilities: ToolCapabilitiesMap = {
  execute_command: {
    description: 'Execute CLI commands on the system. Use this when you need to perform system operations or run specific commands to accomplish any step in the user\'s task.',
    notes: [
      'Must tailor commands to the user\'s system',
      'Provide clear explanation of what the command does',
      'Prefer complex CLI commands over creating executable scripts',
      'Commands will be executed in the current working directory'
    ]
  },
  search_files: {
    description: 'Search files using regex patterns to find specific content with surrounding context.',
    notes: [
      'Searches for patterns or specific content across multiple files',
      'Displays each match with encapsulating context',
      'Uses Rust regex syntax'
    ]
  },
  list_files: {
    description: 'List files and directories to understand project structure.',
    notes: [
      'Can list recursively or top-level only',
      'Helps understand project structure',
      'Do not use to confirm file creation'
    ]
  },
  list_code_definition_names: {
    description: 'List code definitions like classes, functions, and methods to understand code structure.',
    notes: [
      'Provides insights into codebase structure',
      'Shows important constructs and relationships',
      'Helps understand overall architecture'
    ]
  },
  find_references: {
    description: 'Find all references and implementations of code symbols.',
    notes: [
      'Uses VSCode\'s built-in language services',
      'Works across all supported languages',
      'Helps understand symbol usage'
    ]
  },
  attempt_completion: {
    description: 'Present the final result after confirming all operations succeeded.',
    notes: [
      'Must confirm previous tool successes before using',
      'Can include demo command to showcase result',
      'Result should be final and not require further input'
    ]
  },
  ask_followup_question: {
    description: 'Ask the user for additional information when needed.',
    notes: [
      'Use when clarification is needed',
      'Keep questions clear and specific',
      'Use judiciously to maintain efficiency'
    ]
  },
  browser_action: {
    description: 'Control a browser for web-related tasks and testing.',
    notes: [
      'Must start with launch and end with close',
      'One action per message',
      'Browser window is 900x600 pixels',
      'Click coordinates must target element centers'
    ],
    examples: [
      'Verify web component rendering',
      'Test user interactions',
      'Debug web application issues'
    ]
  }
};

export const generateCapabilities = (
  cwd: string,
  enabledTools: string[],
  customCapabilities: Record<string, any> = {}
): string => {
  // Generate summary of available tools
  const toolSummaries = enabledTools
    .map(tool => {
      const cap = defaultToolCapabilities[tool];
      if (!cap) return null;
      return cap.description.split('.')[0];
    })
    .filter(Boolean);

  const summary = toolSummaries.length > 0
    ? `You have access to tools that let you: ${toolSummaries.join('; ')}.`
    : 'You have access to tools that let you .';

  // Generate detailed capabilities for each tool
  const details = enabledTools
    .map(toolName => {
      const defaultCap = defaultToolCapabilities[toolName];
      const customCap = customCapabilities[toolName] || {};

      if (!defaultCap) return '';

      let capability = `\n\n- ${customCap.description || defaultCap.description}`;

      const notes = [...(defaultCap.notes || []), ...(customCap.notes || [])];
      if (notes.length > 0) {
        capability += '\n  Notes:';
        notes.forEach(note => {
          capability += `\n    - ${note}`;
        });
      }

      const examples = [...(defaultCap.examples || []), ...(customCap.examples || [])];
      if (examples.length > 0) {
        capability += '\n  Examples:';
        examples.forEach(example => {
          capability += `\n    - ${example}`;
        });
      }

      return capability;
    })
    .filter(Boolean)
    .join('');

  return summary + details;
};
