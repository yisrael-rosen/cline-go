// Re-export types from extension's shared directory
import { ToolUseName } from "../../../src/shared/ExtensionMessage";
export type { ToolUseName } from "../../../src/shared/ExtensionMessage";
export type { WebviewMessage } from "../../../src/shared/WebviewMessage";

export type ToolInfo = {
  id: ToolUseName;
  name: string;
  description: string;
};

export const AVAILABLE_TOOLS: readonly ToolInfo[] = [
  {
    id: "execute_command",
    name: "Execute Command",
    description: "Run CLI commands on your system"
  },
  {
    id: "search_files",
    name: "Search Files",
    description: "Search across files using regex patterns"
  },
  {
    id: "list_files",
    name: "List Files",
    description: "List directory contents"
  },
  {
    id: "list_code_definition_names",
    name: "List Code Definitions",
    description: "Get overview of code structure"
  },
  {
    id: "find_references",
    name: "Find References",
    description: "Find all references to code symbols"
  },
  {
    id: "browser_action",
    name: "Browser Control",
    description: "Interact with web pages"
  },
  {
    id: "get_code_symbols",
    name: "Get Code Symbols",
    description: "Analyze code structure"
  },
  {
    id: "edit_code_symbols",
    name: "Edit Code Symbols",
    description: "Make precise code changes"
  },
  {
    id: "edit_go_symbols",
    name: "Edit Go Symbols",
    description: "Make precise changes to Go code"
  },
  {
    id: "get_go_symbols",
    name: "Get Go Symbols",
    description: "Analyze Go code structure"
  },
  {
    id: "read_file",
    name: "Read File",
    description: "Read file contents"
  },
  {
    id: "write_to_file",
    name: "Write to File",
    description: "Create or modify files"
  },
  {
    id: "ask_followup_question",
    name: "Ask Questions",
    description: "Request additional information from user"
  },
  {
    id: "attempt_completion",
    name: "Complete Task",
    description: "Present task results"
  }
];
