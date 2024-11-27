// WARNING: This file contains imports for all tools. Edit with caution.
import { EXECUTE_COMMAND_TOOL } from './execute-command';
import { SEARCH_FILES_TOOL } from './search-files';
import { LIST_FILES_TOOL } from './list-files';
import { LIST_CODE_DEFINITION_NAMES_TOOL } from './list-code-definition-names';
import { FIND_REFERENCES_TOOL } from './find-references';
import { ATTEMPT_COMPLETION_TOOL } from './attempt-completion';
import { ASK_FOLLOWUP_QUESTION_TOOL } from './ask-followup-question';
import { BROWSER_TOOLS } from '../browser-tools';  // Add this import

export const getAllTools = (cwd: string, supportsComputerUse: boolean): string => {
  const tools = [
    EXECUTE_COMMAND_TOOL(cwd),
    SEARCH_FILES_TOOL(cwd),
    LIST_FILES_TOOL(cwd),
    LIST_CODE_DEFINITION_NAMES_TOOL(cwd),
    FIND_REFERENCES_TOOL(cwd),
    ATTEMPT_COMPLETION_TOOL(),
    ASK_FOLLOWUP_QUESTION_TOOL()
  ];

  if (supportsComputerUse) {
    tools.push(BROWSER_TOOLS);
  }

  return tools.join('\n\n');
};
