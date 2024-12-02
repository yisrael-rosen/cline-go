import { StateAgent } from '../StateAgent';
import { buildApiHandler } from '../../../api';
import { ApiConfiguration } from '../../../shared/api';
import { StateUpdateInput } from '../StateAgent';

// Helper function to parse XML-like string into StateUpdateInput
function parseXmlInput(xmlString: string): StateUpdateInput {
  // Basic XML parsing - in real code would use a proper XML parser
  const mainGoal = xmlString.match(/<main_goal>(.*?)<\/main_goal>/)?.[1] || "";
  const status = xmlString.match(/<status>(.*?)<\/status>/)?.[1] || "active";
  const lastMessage = xmlString.match(/<last_message>(.*?)<\/last_message>/)?.[1];

  return {
    currentState: {
      mainGoal,
      status: status as 'active' | 'blocked' | 'completed'
    },
    lastMessage
  };
}

// Helper function to format result as XML
function formatXmlResult(result: any): string {
  return `<state_update_result>
  <new_state>
    <main_goal>${result.newState.mainGoal}</main_goal>
    <status>${result.newState.status}</status>
    ${result.newState.currentStep ? `<current_step>${result.newState.currentStep}</current_step>` : ''}
    ${result.newState.lastAction ? `<last_action>${result.newState.lastAction}</last_action>` : ''}
  </new_state>
  <reason>${result.reason}</reason>
  ${result.recommendation ? `<recommendation>${result.recommendation}</recommendation>` : ''}
</state_update_result>`;
}

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
    const xmlInput = `
<state_update>
  <current_state>
    <main_goal></main_goal>
    <status>active</status>
  </current_state>
  <last_message>Create a hello world program</last_message>
</state_update>`;

    // Convert XML to JSON for internal processing
    const input = parseXmlInput(xmlInput);
    
    // Get result and convert to XML format
    const jsonResult = await agent.updateState(input);
    const xmlResult = formatXmlResult(jsonResult);
    
    console.log('API Response:', xmlResult);

    // Verify we got a valid response in XML format
    expect(xmlResult).toMatch(/<main_goal>.+<\/main_goal>/);
    expect(xmlResult).toMatch(/<status>(active|blocked|completed)<\/status>/);
    expect(xmlResult).toMatch(/<reason>.+<\/reason>/);
  }, 30000); // Increased timeout for API call
});
