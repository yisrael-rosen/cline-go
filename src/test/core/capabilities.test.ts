import * as assert from 'assert';
import { CAPABILITIES } from '../../core/prompts/sections/capabilities';
import { ProjectConfig } from '../../shared/types/project-config';

describe('CAPABILITIES', () => {
  const cwd = '/test/path';

  it('should format tool list with proper commas and conjunctions', () => {
    const config: ProjectConfig = {
      enabledTools: ['execute_command', 'list_files', 'search_files']
    };

    const result = CAPABILITIES(cwd, false, config);
    const firstLine = result.split('\n')[0];
    
    // Only show the tool list part
    console.log('\nTool list:');
    console.log(firstLine.split('let you ')[1].split('. These')[0]);
    
    assert.ok(firstLine.includes('execute CLI commands on the user\'s computer, list files, and perform regex searches'));
  });

  it('should handle single tool without commas', () => {
    const config: ProjectConfig = {
      enabledTools: ['execute_command']
    };

    const result = CAPABILITIES(cwd, false, config);
    const firstLine = result.split('\n')[0];
    
    // Only show the tool part
    console.log('\nSingle tool:');
    console.log(firstLine.split('let you ')[1].split('. These')[0]);
    
    assert.ok(firstLine.includes('execute CLI commands on the user\'s computer'));
    assert.ok(!firstLine.includes(','));
  });

  it('should include proper punctuation in descriptions', () => {
    const config: ProjectConfig = {
      enabledTools: ['browser_action']
    };

    const result = CAPABILITIES(cwd, false, config);
    const browserSection = result.split('\n\n').find(s => s.includes('browser_action'));
    
    // Only show first sentence of browser section
    console.log('\nBrowser section (first sentence):');
    console.log(browserSection?.split('. ')[0]);
    
    assert.ok(browserSection?.includes('web development tasks, as it allows'));
    assert.ok(browserSection?.includes('keyboard input, and capture'));
    assert.ok(browserSection?.includes('implementing new features, making substantial changes'));
  });

  it('should handle empty config', () => {
    const result = CAPABILITIES(cwd, false);
    const firstLine = result.split('\n')[0];
    
    // Show empty config result
    console.log('\nEmpty config:');
    console.log(firstLine);
    
    assert.ok(firstLine === '- You have access to tools that let you .');
  });
});
