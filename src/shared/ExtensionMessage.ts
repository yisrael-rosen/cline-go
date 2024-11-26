import { EditType, InsertPosition } from "../services/vscode/edit-code-symbols"

export type BrowserAction = "launch" | "click" | "type" | "scroll_down" | "scroll_up" | "close"

export interface BrowserActionResult {
    logs?: string
    screenshot?: string
    currentUrl?: string
    currentMousePosition?: string
}

export const browserActions = ["launch", "click", "type", "scroll_down", "scroll_up", "close"] as const

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
    | "api_req_retried"
    | "tool"
    | "shell_integration_warning"
    | "inspect_site_result"
    | "browser_action"
    | "browser_action_result"
    | "task"

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
    | "type"
    | "position"
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
        | "editedGoSymbols"
        | "getCodeSymbols"
        | "listFilesTopLevel"
        | "listFilesRecursive"
        | "listCodeDefinitionNames"
        | "findReferences"
        | "searchFiles"
    path?: string
    content?: string
    diff?: string
    editType?: EditType
    symbol?: string
    editContent?: string
    position?: InsertPosition
    regex?: string
    filePattern?: string
}

export interface ClineApiReqInfo {
    request?: string
    tokensIn?: number
    tokensOut?: number
    cacheWrites?: number
    cacheReads?: number
    cost?: number
    cancelReason?: ClineApiReqCancelReason
    streamingFailedMessage?: string
}

export type ClineApiReqCancelReason = "streaming_failed" | "user_cancelled"

export interface ClineMessage {
    ts: number
    type: "ask" | "say"
    ask?: ClineAsk
    say?: ClineSay
    text?: string
    images?: string[]
    partial?: boolean
}

export interface ClineSayBrowserAction {
    action: BrowserAction
    coordinate?: string
    text?: string
}

export type ExtensionMessageType = 
    | "state" 
    | "action" 
    | "theme" 
    | "selectedImages" 
    | "partialMessage" 
    | "invoke" 
    | "workspaceUpdated"
    | "newTask"
    | "clearTask"
    | "askResponse"
    | "selectImages"

export interface ExtensionMessage {
    type: ExtensionMessageType
    state?: any
    action?: string
    text?: string
    images?: string[]
    partialMessage?: ClineMessage
    invoke?: "sendMessage" | "primaryButtonClick" | "secondaryButtonClick"
    filePaths?: string[]
    askResponse?: "messageResponse" | "yesButtonClicked" | "noButtonClicked"
}
