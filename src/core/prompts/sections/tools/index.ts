// WARNING: This file contains imports for all tools. Edit with caution.
import { EXECUTE_COMMAND_TOOL } from './execute-command';
import { SEARCH_FILES_TOOL } from './search-files';
import { LIST_FILES_TOOL } from './list-files';
import { LIST_CODE_DEFINITION_NAMES_TOOL } from './list-code-definition-names';
import { FIND_REFERENCES_TOOL } from './find-references';
import { ATTEMPT_COMPLETION_TOOL } from './attempt-completion';
import { ASK_FOLLOWUP_QUESTION_TOOL } from './ask-followup-question';
import { BROWSER_TOOLS } from '../browser-tools';
import { CORE_TOOLS } from '../core-tools';
import { ToolUseName } from '../../../../shared/ExtensionMessage';
import { ALWAYS_ENABLED_TOOLS } from '../always-enabled-tools';
import { EDIT_CODE_SYMBOLS_TOOL } from './edit-code-symbols';
import { EDIT_GO_SYMBOLS_TOOL } from './edit-go-symbols';
import { GET_GO_SYMBOLS_TOOL } from './get-go-symbols';
import { GET_CODE_SYMBOLS_TOOL } from './get-code-symbols';

interface ToolDefinition {
  name: ToolUseName;
  content: string;
}

export const getAllTools = (cwd: string, supportsComputerUse: boolean, enabledTools?: ToolUseName[]): string => {
  const coreToolsContent = CORE_TOOLS(cwd);
  const [readFileTool, writeFileTool] = coreToolsContent.split('\n\n').filter(section => section.trim());

  const allTools: ToolDefinition[] = [];

  // Add core tools first
  allTools.push(
    { name: 'read_file', content: readFileTool },
    { name: 'write_to_file', content: writeFileTool }
  );

  // Add other tools
  allTools.push(
    { name: 'execute_command', content: EXECUTE_COMMAND_TOOL(cwd) },
    { name: 'search_files', content: SEARCH_FILES_TOOL(cwd) },
    { name: 'list_files', content: LIST_FILES_TOOL(cwd) },
    { name: 'list_code_definition_names', content: LIST_CODE_DEFINITION_NAMES_TOOL(cwd) },
    { name: 'find_references', content: FIND_REFERENCES_TOOL(cwd) },
    { name: 'attempt_completion', content: ATTEMPT_COMPLETION_TOOL() },
    { name: 'ask_followup_question', content: ASK_FOLLOWUP_QUESTION_TOOL() },
    { name: 'edit_code_symbols', content: EDIT_CODE_SYMBOLS_TOOL(cwd) },
    { name: 'edit_go_symbols', content: EDIT_GO_SYMBOLS_TOOL(cwd) },
    { name: 'get_go_symbols', content: GET_GO_SYMBOLS_TOOL(cwd) },
    { name: 'get_code_symbols', content: GET_CODE_SYMBOLS_TOOL(cwd) }
  );

  // Add browser tools if computer use is supported
  if (supportsComputerUse) {
    allTools.push({ name: 'browser_action', content: BROWSER_TOOLS });
  }

  // If no specific tools are enabled, include all tools
  if (!enabledTools) {
    return allTools.map(tool => tool.content).join('\n\n');
  }

  // Get unique tools (always enabled + user enabled)
  const uniqueTools = new Set([...ALWAYS_ENABLED_TOOLS, ...enabledTools]);
  
  // Filter tools to include only enabled tools
  const tools = allTools.filter(tool => uniqueTools.has(tool.name));

  // Remove duplicates by tool name
  const uniqueToolMap = new Map<string, ToolDefinition>();
  tools.forEach(tool => {
    if (!uniqueToolMap.has(tool.name)) {
      uniqueToolMap.set(tool.name, tool);
    }
  });

  return Array.from(uniqueToolMap.values())
    .map(tool => tool.content)
    .join('\n\n');
};
