import { ApiConfiguration, ApiProvider } from "./api"

export interface WebviewMessage {
    type:
        | "apiConfiguration"
        | "customInstructions"
        | "alwaysAllowReadOnly"
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
}

export type ClineAskResponse = "yesButtonClicked" | "noButtonClicked" | "messageResponse"
