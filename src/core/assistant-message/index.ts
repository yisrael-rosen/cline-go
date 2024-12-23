export type AssistantMessageContent = TextContent | ToolUse

export { parseAssistantMessage } from "./parse-assistant-message"

export interface TextContent {
	type: "text"
	content: string
	partial: boolean
}

export const toolUseNames = [
	"execute_command",
	"read_file",
	"write_to_file",
	"search_files",
	"list_files",
	"list_code_definition_names",
	"browser_action",
	"ask_followup_question",
	"attempt_completion",
	"find_references",
	"edit_code_symbols",
	"edit_go_symbols",
	"get_code_symbols",
	"get_go_symbols",
	"edit_json",
] as const

// Converts array of tool call names into a union type ("execute_command" | "read_file" | ...)
export type ToolUseName = (typeof toolUseNames)[number]

export const toolParamNames = [
    "command",
    "path",
    "content",
    "regex",
    "file_pattern",
    "recursive",
    "action",
    "url",
    "coordinate",
    "text",
    "question",
    "result",
    "symbol",
    "edit_type",
    "position",
    "relative_to_symbol",
    "operation",
    "value",
] as const

export type ToolParamName = (typeof toolParamNames)[number]

export interface ToolUse {
	type: "tool_use"
	name: ToolUseName
	// params is a partial record, allowing only some or none of the possible parameters to be used
	params: Partial<Record<ToolParamName, string>>
	partial: boolean
}

export interface ExecuteCommandToolUse extends ToolUse {
	name: "execute_command"
	// Pick<Record<ToolParamName, string>, "command"> makes "command" required, but Partial<> makes it optional
	params: Partial<Pick<Record<ToolParamName, string>, "command">>
}

export interface ReadFileToolUse extends ToolUse {
	name: "read_file"
	params: Partial<Pick<Record<ToolParamName, string>, "path">>
}

export interface WriteToFileToolUse extends ToolUse {
	name: "write_to_file"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "content">>
}

export interface SearchFilesToolUse extends ToolUse {
	name: "search_files"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "regex" | "file_pattern">>
}

export interface ListFilesToolUse extends ToolUse {
	name: "list_files"
	params: Partial<Pick<Record<ToolParamName, string>, "path" | "recursive">>
}

export interface ListCodeDefinitionNamesToolUse extends ToolUse {
	name: "list_code_definition_names"
	params: Partial<Pick<Record<ToolParamName, string>, "path">>
}

export interface BrowserActionToolUse extends ToolUse {
	name: "browser_action"
	params: Partial<Pick<Record<ToolParamName, string>, "action" | "url" | "coordinate" | "text">>
}

export interface AskFollowupQuestionToolUse extends ToolUse {
	name: "ask_followup_question"
	params: Partial<Pick<Record<ToolParamName, string>, "question">>
}

export interface AttemptCompletionToolUse extends ToolUse {
	name: "attempt_completion"
	params: Partial<Pick<Record<ToolParamName, string>, "result" | "command">>
}

export interface FindReferencesToolUse extends ToolUse {
	name: "find_references"
	params: Partial<Pick<Record<ToolParamName, string>, "symbol" | "path">>
}

export interface EditCodeSymbolsToolUse extends ToolUse {
    name: "edit_code_symbols"
    params: Partial<Pick<Record<ToolParamName, string>, "path" | "edit_type" | "symbol" | "content" | "position">>
}

export interface GetCodeSymbols extends ToolUse {
	name: "get_code_symbols"
	params: Partial<Pick<Record<ToolParamName, string>, "path">>
}

export interface EditGoSymbols extends ToolUse {
    name: "edit_go_symbols"
    params: Partial<Pick<Record<ToolParamName, string>, 
        "path" | 
        "edit_type" | 
        "symbol" | 
        "content" | 
        "position" | 
        "relative_to_symbol"
    >>
}

export interface EditJsonToolUse extends ToolUse {
    name: "edit_json"
    params: Partial<Pick<Record<ToolParamName, string>, 
        "path" |
        "operation" |
        "symbol" |
        "value"
    >>
}
