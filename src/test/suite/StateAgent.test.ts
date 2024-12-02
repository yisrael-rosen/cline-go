import * as assert from 'assert';
import * as vscode from 'vscode';
import { StateAgent } from '../../core/state/StateAgent';
import { buildApiHandler } from '../../api';

suite('StateAgent Integration Tests', () => {
    test('should update state using real API', async () => {
        // Get configuration from VSCode
        const config = vscode.workspace.getConfiguration('cline');
        const extension = vscode.extensions.getExtension('saoudrizwan.cline');
        if (!extension) {
            console.log('Extension not found, skipping test');
            return;
        }

        const context = await extension.activate();
        const apiKey = await context.secrets.get('apiKey');
        if (!apiKey) {
            console.log('API key not found in secrets, skipping test');
            return;
        }

        // Create API handler with VSCode configuration
        const api = buildApiHandler({
            apiModelId: "claude-3-5-sonnet-20241022",
            apiKey
        });

        const agent = new StateAgent(api);

        // Test case - starting a task
        const input = {
            currentState: {
                mainGoal: "",
                status: "active" as const
            },
            lastMessage: "Create a hello world program"
        };

        const result = await agent.updateState(input);
        console.log('API Response:', JSON.stringify(result, null, 2));

        // Verify response
        assert.ok(result.newState.mainGoal, 'Should have a main goal');
        assert.ok(['active', 'blocked', 'completed'].includes(result.newState.status), 'Should have valid status');
        assert.ok(result.reason, 'Should have a reason');
    }).timeout(30000);
});
