import * as assert from 'assert';
import { CAPABILITIES } from '../../core/prompts/sections/capabilities';
import { ProjectConfig } from '../../shared/types/project-config';

describe('CAPABILITIES', () => {
  const cwd = '/test/path';

  it('should include tools from config', () => {
    const config: ProjectConfig = {
      enabledTools: ['execute_command', 'search_files', 'browser_action']
    };

    const result = CAPABILITIES(cwd, false, config);
    assert.ok(result.includes('Execute CLI commands on the system'));
    assert.ok(result.includes('Perform a regex search across files'));
    assert.ok(result.includes('Interact with a Puppeteer-controlled browser'));
  });

  it('should include custom tool capabilities', () => {
    const config: ProjectConfig = {
      enabledTools: ['execute_command'],
      toolCapabilities: {
        execute_command: {
          description: 'Custom command description',
          notes: ['Custom note']
        }
      }
    };

    const result = CAPABILITIES(cwd, false, config);
    assert.ok(result.includes('Custom command description'));
    assert.ok(result.includes('Custom note'));
  });

  it('should handle empty config', () => {
    const result = CAPABILITIES(cwd, false);
    // Should just have the base capability text without any tools
    assert.ok(result === 'You have access to tools that let you .');
  });

  it('should handle undefined tools', () => {
    const config: ProjectConfig = {
      enabledTools: ['non_existent_tool']
    };

    const result = CAPABILITIES(cwd, false, config);
    // Should ignore undefined tools
    assert.ok(result === 'You have access to tools that let you .');
  });

  it('should show all tools when all are enabled', () => {
    const config: ProjectConfig = {
      enabledTools: [
        'execute_command',
        'search_files',
        'list_files',
        'list_code_definition_names',
        'find_references',
        'attempt_completion',
        'ask_followup_question',
        'browser_action'
      ]
    };

    const result = CAPABILITIES(cwd, false, config);
    console.log('\nFull capabilities output with all tools enabled:\n');
    console.log(result);
    console.log('\n');

    // Verify all tools are included
    assert.ok(result.includes('Execute CLI commands on the system'));
    assert.ok(result.includes('Perform a regex search across files'));
    assert.ok(result.includes('List files and directories'));
    assert.ok(result.includes('List definition names'));
    assert.ok(result.includes('Find all references'));
    assert.ok(result.includes('Present the result of your work'));
    assert.ok(result.includes('Ask the user a question'));
    assert.ok(result.includes('Interact with a Puppeteer-controlled browser'));
  });
});
