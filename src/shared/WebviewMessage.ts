import { ApiConfiguration, ApiProvider } from "./api"
import { ToolUseName } from "./ExtensionMessage"

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
        | "cancelTask";
    text?: string;
    askResponse?: ClineAskResponse;
    apiConfiguration?: ApiConfiguration;
    images?: string[];
    bool?: boolean;
    tools?: ToolUseName[];
}

export type ClineAskResponse = "yesButtonClicked" | "noButtonClicked" | "messageResponse"
