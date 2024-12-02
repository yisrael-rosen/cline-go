import { StateAgent } from '../StateAgent';
import { buildApiHandler } from '../../../api';
import { ApiConfiguration } from '../../../shared/api';

describe('StateAgent Live API Tests', () => {
  it('should receive valid state update from real API', async () => {
    // Skip test if no API key in environment
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('Skipping test - ANTHROPIC_API_KEY not set');
      return;
    }

    // Create API handler with configuration
    const config: ApiConfiguration = {
      apiModelId: "claude-3-5-haiku-20241022",
      apiKey: process.env.ANTHROPIC_API_KEY
    };

    const api = buildApiHandler(config);
    const agent = new StateAgent(api);

    // Test new task handling
    const taskText = "Create a hello world program";
    const result = await agent.handleNewTask(taskText);

    // Verify response format
    expect(result.newState).toBeDefined();
    expect(result.newState.mainGoal).toBeDefined();
    expect(result.newState.status).toMatch(/^(active|blocked|completed)$/);
    expect(result.reason).toBeDefined();

    // Test user message handling
    const userMessage = "I want to use Python for this";
    const userResult = await agent.handleUserMessage(result.newState, userMessage);
    
    expect(userResult.newState).toBeDefined();
    expect(userResult.newState.mainGoal).toBeDefined();
    expect(userResult.newState.status).toMatch(/^(active|blocked|completed)$/);
    expect(userResult.reason).toBeDefined();

    // Test assistant message handling
    const assistantMessage = "I'll help you create a Python hello world program";
    const assistantResult = await agent.handleAssistantMessage(userResult.newState, assistantMessage);
    
    expect(assistantResult.newState).toBeDefined();
    expect(assistantResult.newState.mainGoal).toBeDefined();
    expect(assistantResult.newState.status).toMatch(/^(active|blocked|completed)$/);
    expect(assistantResult.reason).toBeDefined();

    // Test event handling
    const event = "File created: hello.py";
    const eventResult = await agent.handleEvent(assistantResult.newState, event);
    
    expect(eventResult.newState).toBeDefined();
    expect(eventResult.newState.mainGoal).toBeDefined();
    expect(eventResult.newState.status).toMatch(/^(active|blocked|completed)$/);
    expect(eventResult.reason).toBeDefined();

  }, 30000); // Increased timeout for API calls
});
