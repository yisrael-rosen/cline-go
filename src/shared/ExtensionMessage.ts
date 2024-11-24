import { CodeEdit } from "../services/vscode/edit-code-symbols"

// ... (keep existing imports and code)

export type ClineAsk =
    | "command"
    | "tool"
    | "followup"
    | "completion_result"
    | "command_output"
    | "api_req_failed"
    | "resume_task"
    | "resume_completed_task"
    | "mistake_limit_reached"
    | "browser_action_launch"

export type ClineSay =
    | "text"
    | "error"
    | "user_feedback"
    | "user_feedback_diff"
    | "command_output"
    | "api_req_started"
    | "api_req_finished"
	| "completion_result"
	| "completion_result"
	| "user_feedback"
	| "user_feedback_diff"
	| "api_req_retried"
	| "command_output"
	| "tool"
    | "completion_result"
	| "user_feedback"
	| "user_feedback_diff"
	| "api_req_retried"
	| "command_output"
	| "tool"
    | "shell_integration_warning"
    | "inspect_site_result"
    | "browser_action"
    | "browser_action_result"

export type ToolUseName =
    | "execute_command"
    | "read_file"
    | "write_to_file"
    | "edit_code_symbols"
    | "search_files"
    | "list_files"
    | "list_code_definition_names"
    | "browser_action"
    | "ask_followup_question"
    | "attempt_completion"

export type ToolParamName =
    | "command"
    | "path"
    | "content"
    | "regex"
    | "file_pattern"
    | "recursive"
    | "symbol"
    | "edits"
    | "action"
    | "url"
    | "coordinate"
    | "text"
    | "question"
    | "result"

export interface ClineSayTool {
    tool:
        | "readFile"
        | "editedExistingFile"
        | "newFileCreated"
        | "editedCodeSymbols"
        | "listFilesTopLevel"
        | "listFilesRecursive"
        | "listCodeDefinitionNames"
        | "findReferences"
    path?: string
    content?: string
    diff?: string
    edits?: CodeEdit[]
    symbol?: string
}

export type ClineApiReqCancelReason = "streaming_failed" | "user_cancelled"
