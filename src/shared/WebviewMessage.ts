import { ApiConfiguration, ApiProvider } from "./api"
import { ToolUseName, ClineAskResponse } from "./ExtensionMessage"

export interface WebviewMessage {
    type:
        | "apiConfiguration"
        | "customInstructions"
        | "alwaysAllowReadOnly"
        | "enabledTools"
        | "webviewDidLaunch"
        | "newTask"
        | "askResponse"
        | "clearTask"
        | "didShowAnnouncement"
        | "selectImages"
        | "exportCurrentTask"
        | "showTaskWithId"
        | "deleteTaskWithId"
        | "exportTaskWithId"
        | "resetState"
        | "openImage"
        | "openFile"
        | "openMention"
        | "cancelTask"
        | "copySystemPrompt"
        | "getTaskState";
    text?: string;
    askResponse?: ClineAskResponse;
    apiConfiguration?: ApiConfiguration;
    images?: string[];
    bool?: boolean;
    tools?: ToolUseName[];
}
