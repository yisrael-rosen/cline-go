import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useEvent } from "react-use"
import { ExtensionMessage, ClineMessage } from "../../../src/shared/ExtensionMessage"
import { type ApiConfiguration } from "../../../src/shared/api"
import { vscode } from "../utils/vscode"
import { convertTextMateToHljs } from "../utils/textMateToHljs"
import { findLastIndex } from "../../../src/shared/array"
import { ToolUseName } from "../types/extension"

interface ExtensionState {
    version: string
    clineMessages: ClineMessage[]
    taskHistory: any[]
    shouldShowAnnouncement: boolean
    apiConfiguration?: ApiConfiguration
    customInstructions?: string
    alwaysAllowReadOnly?: boolean
    enabledTools?: ToolUseName[]
}

interface ExtensionStateContextType extends ExtensionState {
    didHydrateState: boolean
    showWelcome: boolean
    theme: any
    filePaths: string[]
    setApiConfiguration: (config: ApiConfiguration) => void
    setCustomInstructions: (value?: string) => void
    setAlwaysAllowReadOnly: (value: boolean) => void
    setShowAnnouncement: (value: boolean) => void
    setEnabledTools: (value: ToolUseName[]) => void
}

const ExtensionStateContext = createContext<ExtensionStateContextType | undefined>(undefined)

export const ExtensionStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ExtensionState>({
        version: "",
        clineMessages: [],
        taskHistory: [],
        shouldShowAnnouncement: false,
        enabledTools: [],
    })
    const [didHydrateState, setDidHydrateState] = useState(false)
    const [showWelcome, setShowWelcome] = useState(false)
    const [theme, setTheme] = useState<any>(undefined)
    const [filePaths, setFilePaths] = useState<string[]>([])

    const handleMessage = useCallback((event: MessageEvent) => {
        const message: ExtensionMessage = event.data
        switch (message.type) {
            case "state": {
                setState(message.state!)
                const hasKey = message.state?.apiConfiguration?.apiKey !== undefined
                setShowWelcome(!hasKey)
                setDidHydrateState(true)
                break
            }
            case "theme": {
                if (message.text) {
                    setTheme(convertTextMateToHljs(JSON.parse(message.text)))
                }
                break
            }
            case "workspaceUpdated": {
                setFilePaths(message.filePaths ?? [])
                break
            }
            case "partialMessage": {
                const partialMessage = message.partialMessage!
                setState((prevState: ExtensionState) => {
                    const lastIndex = findLastIndex(prevState.clineMessages, (msg: ClineMessage) => msg.ts === partialMessage.ts)
                    if (lastIndex !== -1) {
                        const newClineMessages = [...prevState.clineMessages]
                        newClineMessages[lastIndex] = partialMessage
                        return { ...prevState, clineMessages: newClineMessages }
                    }
                    return prevState
                })
                break
            }
        }
    }, [])

    useEvent("message", handleMessage)

    useEffect(() => {
        vscode.postMessage({ type: "webviewDidLaunch" })
    }, [])

    const contextValue: ExtensionStateContextType = {
        ...state,
        didHydrateState,
        showWelcome,
        theme,
        filePaths,
        setApiConfiguration: (value: ApiConfiguration) => setState((prevState: ExtensionState) => ({ ...prevState, apiConfiguration: value })),
        setCustomInstructions: (value?: string) => setState((prevState: ExtensionState) => ({ ...prevState, customInstructions: value })),
        setAlwaysAllowReadOnly: (value: boolean) => setState((prevState: ExtensionState) => ({ ...prevState, alwaysAllowReadOnly: value })),
        setShowAnnouncement: (value: boolean) => setState((prevState: ExtensionState) => ({ ...prevState, shouldShowAnnouncement: value })),
        setEnabledTools: (value: ToolUseName[]) => {
            setState((prevState: ExtensionState) => ({ ...prevState, enabledTools: value }))
            vscode.postMessage({ type: "enabledTools", tools: value })
        },
    }

    return <ExtensionStateContext.Provider value={contextValue}>{children}</ExtensionStateContext.Provider>
}

export const useExtensionState = () => {
    const context = useContext(ExtensionStateContext)
    if (context === undefined) {
        throw new Error("useExtensionState must be used within an ExtensionStateContextProvider")
    }
    return context
}
