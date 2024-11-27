// WARNING: This file contains imports for all tools. Edit with caution.
import { EXECUTE_COMMAND_TOOL } from './execute-command';
import { SEARCH_FILES_TOOL } from './search-files';
import { LIST_FILES_TOOL } from './list-files';
import { LIST_CODE_DEFINITION_NAMES_TOOL } from './list-code-definition-names';
import { FIND_REFERENCES_TOOL } from './find-references';
import { ATTEMPT_COMPLETION_TOOL } from './attempt-completion';
import { ASK_FOLLOWUP_QUESTION_TOOL } from './ask-followup-question';

export const getAllTools = (cwd: string): string => {
  const tools = [
    EXECUTE_COMMAND_TOOL(cwd),
    SEARCH_FILES_TOOL(cwd),
    LIST_FILES_TOOL(cwd),
    LIST_CODE_DEFINITION_NAMES_TOOL(cwd),
    FIND_REFERENCES_TOOL(cwd),
    ATTEMPT_COMPLETION_TOOL(),
    ASK_FOLLOWUP_QUESTION_TOOL()
  ];

  return tools.join('\n\n');
};
