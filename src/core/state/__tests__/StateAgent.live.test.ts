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
      apiModelId: "claude-3-5-sonnet-20241022",
      apiKey: process.env.ANTHROPIC_API_KEY
    };

    const api = buildApiHandler(config);
    const agent = new StateAgent(api);

    // Simple test case - starting a task
    const input = {
      currentState: {
        mainGoal: "",
        status: "active" as const
      },
      lastMessage: "Create a hello world program"
    };

    const result = await agent.updateState(input);
    console.log('API Response:', JSON.stringify(result, null, 2));

    // Verify we got a valid response
    expect(result.newState.mainGoal).toBeTruthy();
    expect(['active', 'blocked', 'completed']).toContain(result.newState.status);
    expect(result.reason).toBeTruthy();
  }, 30000); // Increased timeout for API call
});
