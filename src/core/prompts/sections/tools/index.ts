import { EDIT_JSON_TOOL } from './edit-json';
import { FIND_REFERENCES_TOOL } from './find-references';
import { EDIT_CODE_SYMBOLS_TOOL } from './edit-code-symbols';
import { EDIT_GO_SYMBOLS_TOOL } from './edit-go-symbols';
import { GET_GO_SYMBOLS_TOOL } from './get-go-symbols';
import { GET_CODE_SYMBOLS_TOOL } from './get-code-symbols';
import { ATTEMPT_COMPLETION_TOOL } from './attempt-completion';
import { ASK_FOLLOWUP_QUESTION_TOOL } from './ask-followup-question';
import { EXECUTE_COMMAND_TOOL } from './execute-command';
import { SEARCH_FILES_TOOL } from './search-files';
import { LIST_FILES_TOOL } from './list-files';
import { LIST_CODE_DEFINITION_NAMES_TOOL } from './list-code-definition-names';
import { ToolUseName } from '../../../../shared/ExtensionMessage';

const toolDefinitions = {
  edit_json: EDIT_JSON_TOOL,
  edit_code_symbols: EDIT_CODE_SYMBOLS_TOOL,
  edit_go_symbols: EDIT_GO_SYMBOLS_TOOL,
  get_go_symbols: GET_GO_SYMBOLS_TOOL,
  get_code_symbols: GET_CODE_SYMBOLS_TOOL,
  attempt_completion: ATTEMPT_COMPLETION_TOOL,
  ask_followup_question: ASK_FOLLOWUP_QUESTION_TOOL,
  execute_command: EXECUTE_COMMAND_TOOL,
  search_files: SEARCH_FILES_TOOL,
  list_files: LIST_FILES_TOOL,
  list_code_definition_names: LIST_CODE_DEFINITION_NAMES_TOOL,
  find_references: FIND_REFERENCES_TOOL,
};

export function getAllTools(cwd: string, supportsComputerUse: boolean, enabledTools: ToolUseName[]): string {
  if (!supportsComputerUse) return '';

  const enabledToolDefinitions = Object.entries(toolDefinitions)
    .filter(([name]) => enabledTools.includes(name as ToolUseName))
    .map(([_, definition]) => definition(cwd))
    .join('\n\n');

  return enabledToolDefinitions;
}

export const tools = toolDefinitions;
