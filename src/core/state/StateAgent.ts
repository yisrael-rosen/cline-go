import { ApiHandler, buildApiHandler } from '../../api';
import { ApiStreamChunk } from '../../api/transform/stream';
import { Anthropic } from '@anthropic-ai/sdk';
import { ApiConfiguration } from '../../shared/api';

export type MessageType = 'TASK_START' | 'USER_MESSAGE' | 'ASSISTANT_MESSAGE' | 'EVENT';

export interface MinimalTaskState {
  mainGoal: string;
  status: 'active' | 'blocked' | 'completed';
  currentStep?: string;
  lastAction?: string;
}

export interface StateUpdateInput {
  currentState: MinimalTaskState;
  messageType: MessageType;
  sender: string;
  content: string;
}

export interface StateUpdateResult {
  newState: MinimalTaskState;
  reason: string;
  recommendation?: string;
}

export const STATE_AGENT_PROMPT = `You are a Task State Management Agent.
Your role is to maintain and update task state based on events, messages, and conversation flow.

CURRENT STATE:
{currentState}

NEW INFORMATION:
Message Type: {messageType}
Sender: {sender}
Content:
{content}

RULES:
1. Maintain task focus and context
2. Update status based on clear triggers:
   - 'blocked' when encountering issues or waiting for input
   - 'completed' when the main goal is achieved
   - 'active' during normal progress
3. Track current step based on activity
4. Keep response in JSON format:
{
  "newState": {
    "mainGoal": string,
    "status": "active" | "blocked" | "completed",
    "currentStep": string,
    "lastAction": string
  },
  "reason": string,
  "recommendation"?: string
}

Message Types:
- TASK_START: Initial task message that sets the main goal
- USER_MESSAGE: Message from the user that may change task direction
- ASSISTANT_MESSAGE: Response from the main assistant showing progress
- EVENT: System or environment event

Analyze the new information and provide updated state with explanation.`;

export class StateAgent {
  private api: ApiHandler;

  constructor(api: ApiHandler) {
    this.api = api;
  }

  private formatUpdateInput(input: StateUpdateInput): string {
    return STATE_AGENT_PROMPT
      .replace('{currentState}', JSON.stringify(input.currentState, null, 2))
      .replace('{messageType}', input.messageType)
      .replace('{sender}', input.sender)
      .replace('{content}', input.content);
  }

  async analyzeTask(taskText: string): Promise<StateUpdateResult> {
    return this.handleNewTask(taskText);
  }

  async handleNewTask(taskText: string): Promise<StateUpdateResult> {
    return this.updateState({
      currentState: {
        mainGoal: '',
        status: 'active'
      },
      messageType: 'TASK_START',
      sender: 'user',
      content: taskText
    });
  }

  async handleUserMessage(currentState: MinimalTaskState, message: string): Promise<StateUpdateResult> {
    return this.updateState({
      currentState,
      messageType: 'USER_MESSAGE',
      sender: 'user',
      content: message
    });
  }

  async handleAssistantMessage(currentState: MinimalTaskState, message: string): Promise<StateUpdateResult> {
    return this.updateState({
      currentState,
      messageType: 'ASSISTANT_MESSAGE',
      sender: 'assistant',
      content: message
    });
  }

  async handleEvent(currentState: MinimalTaskState, event: string): Promise<StateUpdateResult> {
    return this.updateState({
      currentState,
      messageType: 'EVENT',
      sender: 'system',
      content: event
    });
  }

  async updateState(input: StateUpdateInput): Promise<StateUpdateResult> {
    // Prepare the prompt with current state and new information
    const systemPrompt = this.formatUpdateInput(input);

    try {
      // Format messages for API
      const messages: Anthropic.Messages.MessageParam[] = [
        { role: 'user', content: systemPrompt }
      ];

      // Send request to LLM and handle streaming response
      const stream = this.api.createMessage(systemPrompt, messages);
      let fullResponse = '';

      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          fullResponse += chunk.text;
        }
      }
      
      // Parse and validate response
      const result = JSON.parse(fullResponse) as StateUpdateResult;
      
      // Basic validation
      if (!this.validateStateUpdate(result)) {
        throw new Error('Invalid state update from LLM');
      }

      return result;
    } catch (error) {
      console.error('State update failed:', error);
      // Return current state with error explanation
      return {
        newState: input.currentState,
        reason: `Failed to update state: ${error}`,
        recommendation: 'Please try again or simplify the update'
      };
    }
  }

  private validateStateUpdate(result: StateUpdateResult): boolean {
    // Check that all required fields are present
    const requiredStateFields = ['mainGoal', 'status'];
    const hasRequiredFields = requiredStateFields.every(field => 
      Object.prototype.hasOwnProperty.call(result.newState, field)
    );

    // Check that status is valid
    const validStatuses = ['active', 'blocked', 'completed'];
    const hasValidStatus = validStatuses.includes(result.newState.status);

    // Check that reason is provided
    const hasReason = typeof result.reason === 'string' && result.reason.length > 0;

    return hasRequiredFields && hasValidStatus && hasReason;
  }
}

