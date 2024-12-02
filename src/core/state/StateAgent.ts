import { ApiHandler } from '../../api';
import { ApiStreamChunk } from '../../api/transform/stream';
import { Anthropic } from '@anthropic-ai/sdk';

export interface MinimalTaskState {
  mainGoal: string;
  status: 'active' | 'blocked' | 'completed';
  currentStep?: string;
  lastAction?: string;
}

export interface StateUpdateInput {
  currentState: MinimalTaskState;
  lastMessage?: string;
  newEvent?: string;
}

export interface StateUpdateResult {
  newState: MinimalTaskState;
  reason: string;
  recommendation?: string;
}

export const STATE_AGENT_PROMPT = `You are a Task State Management Agent.
Your role is to maintain and update task state based on events and messages.

CURRENT STATE:
{currentState}

NEW INFORMATION:
{newEvent}
{lastMessage}

RULES:
1. Maintain task focus and context
2. Only change status when there's a clear reason:
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

Consider the context of VSCode events:
- Document changes indicate active development
- Editor changes show context switching
- Task events reflect build/test activities

Analyze the new information and provide updated state with explanation.`;

export class StateAgent {
  private api: ApiHandler;

  constructor(api: ApiHandler) {
    this.api = api;
  }
	async analyzeTask(taskText: string): Promise<StateUpdateResult> {
		const input: StateUpdateInput = {
		  currentState: {
			mainGoal: '',
			status: 'active'
		  },
		  newEvent: 'New task started',
		  lastMessage: taskText
		};
		
		return this.updateState(input);
	  }
  private formatUpdateInput(input: StateUpdateInput): string {
    let prompt = STATE_AGENT_PROMPT
      .replace('{currentState}', JSON.stringify(input.currentState, null, 2));
    
    if (input.newEvent) {
      prompt = prompt.replace('{newEvent}', `Event: ${input.newEvent}`);
    } else {
      prompt = prompt.replace('{newEvent}', '');
    }
    
    if (input.lastMessage) {
      prompt = prompt.replace('{lastMessage}', `Message: ${input.lastMessage}`);
    } else {
      prompt = prompt.replace('{lastMessage}', '');
    }
    
    return prompt;
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
