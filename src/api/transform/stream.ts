export interface ApiStreamChunk {
	type: "text" | "usage"
	text?: string
	inputTokens?: number
	outputTokens?: number
	cacheWriteTokens?: number
	cacheReadTokens?: number
	totalCost?: number
}

export type ApiStream = AsyncGenerator<ApiStreamChunk, void, unknown>
