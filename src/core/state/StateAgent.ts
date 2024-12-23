import { ApiHandler } from '../../api';
import { Anthropic } from '@anthropic-ai/sdk';

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
4. Keep response in XML format:
<stateUpdate>
  <state>
    <mainGoal>string</mainGoal>
    <status>active|blocked|completed</status>
    <currentStep>string</currentStep>
    <lastAction>string</lastAction>
  </state>
  <reason>string</reason>
  <recommendation>string (optional)</recommendation>
</stateUpdate>

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

  private stateToXml(state: MinimalTaskState): string {
    return `<state>
  <mainGoal>${this.escapeXml(state.mainGoal)}</mainGoal>
  <status>${state.status}</status>
  ${state.currentStep ? `<currentStep>${this.escapeXml(state.currentStep)}</currentStep>` : ''}
  ${state.lastAction ? `<lastAction>${this.escapeXml(state.lastAction)}</lastAction>` : ''}
</state>`;
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private parseXmlResponse(xml: string): StateUpdateResult {
    // Basic XML parsing using regex - in production you'd want to use a proper XML parser
    const getTagContent = (tag: string) => {
      const match = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
      return match ? match[1] : '';
    };

    const mainGoal = getTagContent('mainGoal');
    const status = getTagContent('status') as 'active' | 'blocked' | 'completed';
    const currentStep = getTagContent('currentStep');
    const lastAction = getTagContent('lastAction');
    const reason = getTagContent('reason');
    const recommendation = getTagContent('recommendation');

    return {
      newState: {
        mainGoal,
        status,
        ...(currentStep && { currentStep }),
        ...(lastAction && { lastAction })
      },
      reason,
      ...(recommendation && { recommendation })
    };
  }

  private formatUpdateInput(input: StateUpdateInput): string {
    return STATE_AGENT_PROMPT
      .replace('{currentState}', this.stateToXml(input.currentState))
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
    const systemPrompt = this.formatUpdateInput(input);

    try {
      // Create messages array in Anthropic format
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
      const result = this.parseXmlResponse(fullResponse);
      
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
    // Check that all required fields are present and valid
    const requiredStateFields = ['mainGoal', 'status'];
    const validStatuses = ['active', 'blocked', 'completed'];

    const hasRequiredFields = requiredStateFields.every(field => 
      Object.prototype.hasOwnProperty.call(result.newState, field)
    );
    const hasValidStatus = validStatuses.includes(result.newState.status);
    const hasValidReason = typeof result.reason === 'string' && result.reason.length > 0;

    return hasRequiredFields && hasValidStatus && hasValidReason;
  }
}
