import { ToolUseName } from "./ExtensionMessage";

export type HistoryItem = {
    id: string
    ts: number
    task: string
    tokensIn: number
    tokensOut: number
    cacheWrites?: number
    cacheReads?: number
    totalCost: number
    enabledTools?: ToolUseName[]
}
