// Import the main Anthropic SDK client for API interactions
import { Anthropic } from "@anthropic-ai/sdk"
// Import streaming functionality for real-time response handling
import { Stream as AnthropicStream } from "@anthropic-ai/sdk/streaming"
// Import shared API configurations and model definitions
import {
    anthropicDefaultModelId,
    AnthropicModelId,
    anthropicModels,
    ApiHandlerOptions,
    ModelInfo,
} from "../../shared/api"
// Import base API handler interface that this class implements
import { ApiHandler } from "../index"
// Import stream transformation utilities for processing responses
import { ApiStream } from "../transform/stream"

/**
 * Implementation of the ApiHandler interface for Anthropic's API
 * Handles communication with Claude models including prompt caching optimization
 */
export class AnthropicHandler implements ApiHandler {
    private options: ApiHandlerOptions
    private client: Anthropic

    /**
     * Initialize handler with API configuration
     * @param options Configuration including API key and optional base URL
     */
    constructor(options: ApiHandlerOptions) {
        this.options = options
        this.client = new Anthropic({
            apiKey: this.options.apiKey,
            baseURL: this.options.anthropicBaseUrl || undefined,
        })
    }

    /**
     * Creates a streaming message response with prompt caching optimization
     * 
     * Prompt caching is a beta feature that optimizes API usage by caching and reusing
     * prompt prefixes. This reduces processing time and costs for repetitive tasks.
     * 
     * Cache Behavior:
     * - Cache lifetime: 5 minutes, refreshed on each use
     * - Minimum cacheable length: 1024/2048 tokens depending on model
     * - Cache is organization-specific and requires exact matching
     * 
     * Pricing for cached content:
     * - Cache writes: 25% more expensive than base input tokens
     * - Cache hits: 90% cheaper than base input tokens
     * 
     * @param systemPrompt System instructions for the model
     * @param messages Array of conversation messages
     */
    async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
        let stream: AnthropicStream<Anthropic.Beta.PromptCaching.Messages.RawPromptCachingBetaMessageStreamEvent>
        const modelId = this.getModel().id

        // Handle different model versions with specific configurations
        switch (modelId) {
            // Claude 3 models with prompt caching support
            // These models support the prompt caching beta feature
            case "claude-3-5-sonnet-20241022":  // Min cache: 1024 tokens
            case "claude-3-5-haiku-20241022":   // Min cache: 2048 tokens
            case "claude-3-opus-20240229":      // Min cache: 1024 tokens
            case "claude-3-haiku-20240307": {   // Min cache: 2048 tokens
                // Find indices of user messages for optimizing cache control
                const userMsgIndices = messages.reduce(
                    (acc, msg, index) => (msg.role === "user" ? [...acc, index] : acc),
                    [] as number[]
                )
                // Track last two user messages for ephemeral caching
                // This helps optimize multi-turn conversations
                const lastUserMsgIndex = userMsgIndices[userMsgIndices.length - 1] ?? -1
                const secondLastMsgUserIndex = userMsgIndices[userMsgIndices.length - 2] ?? -1

                // Create message stream with prompt caching enabled
                stream = await this.client.beta.promptCaching.messages.create(
                    {
                        model: modelId,
                        max_tokens: this.getModel().info.maxTokens || 8192,
                        temperature: 0,
                        // Mark system prompt as ephemeral to enable caching
                        system: [{ text: systemPrompt, type: "text", cache_control: { type: "ephemeral" } }],
                        // Process messages and add cache control for recent user messages
                        // This enables efficient caching of conversation context
                        messages: messages.map((message, index) => {
                            if (index === lastUserMsgIndex || index === secondLastMsgUserIndex) {
                                return {
                                    ...message,
                                    content:
                                        typeof message.content === "string"
                                            ? [
                                                {
                                                    type: "text",
                                                    text: message.content,
                                                    cache_control: { type: "ephemeral" },
                                                },
                                            ]
                                            : message.content.map((content, contentIndex) =>
                                                contentIndex === message.content.length - 1
                                                    ? { ...content, cache_control: { type: "ephemeral" } }
                                                    : content
                                            ),
                                }
                            }
                            return message
                        }),
                        stream: true,
                    },
                    {
                        // Enable prompt caching beta feature
                        headers: { "anthropic-beta": "prompt-caching-2024-07-31" },
                    }
                )
                break
            }
            // Default case for models without prompt caching support
            default: {
                stream = (await this.client.messages.create({
                    model: modelId,
                    max_tokens: this.getModel().info.maxTokens || 8192,
                    temperature: 0,
                    system: [{ text: systemPrompt, type: "text" }],
                    messages,
                    stream: true,
                })) as any
                break
            }
        }

        // Process streaming response chunks
        for await (const chunk of stream) {
            switch (chunk.type) {
                // Handle message start - includes initial usage statistics
                // Provides information about cache performance:
                // - cache_creation_input_tokens: Tokens written to new cache
                // - cache_read_input_tokens: Tokens read from existing cache
                // - input_tokens: Non-cached input tokens
                case "message_start":
                    const usage = chunk.message.usage
                    yield {
                        type: "usage",
                        inputTokens: usage.input_tokens || 0,
                        outputTokens: usage.output_tokens || 0,
                        cacheWriteTokens: usage.cache_creation_input_tokens || undefined,
                        cacheReadTokens: usage.cache_read_input_tokens || undefined,
                    }
                    break
                // Track ongoing token usage during streaming
                case "message_delta":
                    yield {
                        type: "usage",
                        inputTokens: 0,
                        outputTokens: chunk.usage.output_tokens || 0,
                    }
                    break
                case "message_stop":
                    break
                // Handle content block start with proper formatting
                case "content_block_start":
                    switch (chunk.content_block.type) {
                        case "text":
                            // Add newline between content blocks for readability
                            if (chunk.index > 0) {
                                yield {
                                    type: "text",
                                    text: "\n",
                                }
                            }
                            yield {
                                type: "text",
                                text: chunk.content_block.text,
                            }
                            break
                    }
                    break
                // Process incremental content updates
                case "content_block_delta":
                    switch (chunk.delta.type) {
                        case "text_delta":
                            yield {
                                type: "text",
                                text: chunk.delta.text,
                            }
                            break
                    }
                    break
                case "content_block_stop":
                    break
            }
        }
    }

    /**
     * Get current model configuration and capabilities
     * Returns the specified model if valid, otherwise returns default model
     */
    getModel(): { id: AnthropicModelId; info: ModelInfo } {
        const modelId = this.options.apiModelId
        if (modelId && modelId in anthropicModels) {
            const id = modelId as AnthropicModelId
            return { id, info: anthropicModels[id] }
        }
        return { id: anthropicDefaultModelId, info: anthropicModels[anthropicDefaultModelId] }
    }
}