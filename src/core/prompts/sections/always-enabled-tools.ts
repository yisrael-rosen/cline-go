import { ToolUseName } from '../../../shared/ExtensionMessage';

// These tools are always available regardless of user settings
export const ALWAYS_ENABLED_TOOLS: ToolUseName[] = [
  'execute_command',
  'read_file',
  'write_to_file',
  'search_files',
  'list_files',
  'list_code_definition_names',
  'ask_followup_question',
  'attempt_completion',
  'find_references'
];
