import { Anthropic } from "@anthropic-ai/sdk"
import { Message } from "../../shared/api"

export function toAnthropicMessage(message: Message): Anthropic.Messages.MessageParam {
    // Anthropic doesn't support system role in messages
    if (message.role === 'system') {
        throw new Error('System messages should be handled separately for Anthropic')
    }
    
    return {
        role: message.role as 'user' | 'assistant',
        content: message.content
    }
}

export function fromAnthropicMessage(message: Anthropic.Messages.MessageParam): Message {
    return {
        role: message.role,
        content: typeof message.content === 'string' 
            ? message.content 
            : message.content.map(block => {
                if ('text' in block) {
                    return block.text
                }
                return ''
            }).join('')
    }
}
