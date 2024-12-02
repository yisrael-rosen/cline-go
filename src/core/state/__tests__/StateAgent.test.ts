import { StateAgent, MinimalTaskState, StateUpdateInput } from '../StateAgent';
import { ApiHandler } from '../../../api';

describe('StateAgent', () => {
  let mockApi: jest.Mocked<ApiHandler>;
  let agent: StateAgent;

  beforeEach(() => {
    mockApi = {
      createMessage: jest.fn(),
      getModel: jest.fn().mockReturnValue({
        id: 'test-model',
        info: {
          maxTokens: 1000,
          contextWindow: 10000,
          supportsPromptCache: true
        }
      })
    } as any;
    agent = new StateAgent(mockApi);
  });

  it('should properly format prompt and parse LLM response for state updates', async () => {
    const input: StateUpdateInput = {
      currentState: {
        mainGoal: "Create README.md",
        status: "active",
        currentStep: "Writing file content"
      },
      newEvent: "Opening text editor"
    };

    // Mock streaming response
    mockApi.createMessage.mockImplementation(async function* () {
      yield { type: 'text', text: JSON.stringify({
        newState: {
          mainGoal: "Create README.md",
          status: "active", 
          currentStep: "Writing file content",
          lastAction: "Opened text editor"
        },
        reason: "Progressing with file content creation",
        recommendation: "Proceed with writing the content"
      })};
    });

    const result = await agent.updateState(input);

    // Verify LLM was called with correct prompt
    expect(mockApi.createMessage).toHaveBeenCalled();
    const prompt = mockApi.createMessage.mock.calls[0][0];
    
    // Verify prompt contains all required sections
    expect(prompt).toContain('CURRENT STATE:');
    expect(prompt).toContain(JSON.stringify(input.currentState, null, 2));
    expect(prompt).toContain('NEW INFORMATION:');
    expect(prompt).toContain('Event: Opening text editor');

    // Verify prompt contains rules
    expect(prompt).toContain('RULES:');
    expect(prompt).toContain('1. Maintain task focus and context');
    expect(prompt).toContain('2. Only change status when there\'s a clear reason');
    expect(prompt).toContain('3. Track current step based on activity');
    expect(prompt).toContain('4. Keep response in JSON format');

    // Verify state update result
    expect(result.newState.mainGoal).toBe("Create README.md");
    expect(result.newState.status).toBe("active");
    expect(result.newState.currentStep).toBe("Writing file content");
    expect(result.newState.lastAction).toBe("Opened text editor");
    expect(result.reason).toBe("Progressing with file content creation");
    expect(result.recommendation).toBe("Proceed with writing the content");
  });

  it('should handle invalid LLM responses gracefully', async () => {
    const input: StateUpdateInput = {
      currentState: {
        mainGoal: "Test task",
        status: "active"
      }
    };

    // Mock streaming invalid JSON response
    mockApi.createMessage.mockImplementation(async function* () {
      yield { type: 'text', text: '{"invalid": "response"}' };
    });
    
    const result = await agent.updateState(input);

    // Should preserve current state and return error info
    expect(result.newState).toEqual(input.currentState);
    expect(result.reason).toContain('Failed to update state');
    expect(result.recommendation).toBeTruthy();
  });

  it('should handle API errors gracefully', async () => {
    const input: StateUpdateInput = {
      currentState: {
        mainGoal: "Test task",
        status: "active"
      }
    };

    // Mock streaming error
    mockApi.createMessage.mockImplementation(async function* () {
      throw new Error('API error');
    });
    
    const result = await agent.updateState(input);
    expect(result.newState).toEqual(input.currentState);
    expect(result.reason).toContain('Failed to update state');
    expect(result.recommendation).toBeTruthy();
  });

  it('should validate state updates from LLM', async () => {
    const input: StateUpdateInput = {
      currentState: {
        mainGoal: "Test task",
        status: "active"
      }
    };

    // Mock streaming invalid status response
    mockApi.createMessage.mockImplementation(async function* () {
      yield { type: 'text', text: JSON.stringify({
        newState: {
          mainGoal: "Test task",
          status: "invalid_status" // Invalid status
        },
        reason: "Some reason"
      })};
    });
    
    const result = await agent.updateState(input);

    // Should reject invalid state and preserve current state
    expect(result.newState).toEqual(input.currentState);
    expect(result.reason).toContain('Failed to update state');
  });
});
