/// <reference types="jest" />

import { SYSTEM_PROMPT, SystemConfig } from '../system';

// Mock only external modules
jest.mock('os-name', () => ({
  __esModule: true,
  default: () => 'Windows 11'
}));

jest.mock('default-shell', () => ({
  __esModule: true,
  default: 'C:\\WINDOWS\\system32\\cmd.exe'
}));

jest.mock('os', () => ({
  homedir: () => 'C:/Users/ROSEN'
}));

// Don't mock internal modules - use real implementations
jest.unmock('../sections/base');
jest.unmock('../sections/capabilities');
jest.unmock('../sections/rules');
jest.unmock('../sections/tools');
jest.unmock('../sections/objective');

describe('SYSTEM_PROMPT', () => {
  const mockCwd = 'c:/Users/ROSEN/dev/cline';
  
  beforeEach(() => {
    // Setup string toPosix mock
    String.prototype.toPosix = function() {
      return this.replace(/\\/g, '/');
    };
  });

  afterEach(() => {
    delete (String.prototype as any).toPosix;
  });

  it('should generate complete system prompt with all features enabled', async () => {
    const projectConfig: SystemConfig = {
      customInstructions: undefined,
      enabledTools: {
        browser_action: true,
        edit_code_symbols: true,
        edit_go_symbols: true,
        get_go_symbols: true,
        get_code_symbols: true
      }
    };

    const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, projectConfig);
    
    // Verify base prompt is included
    expect(systemPrompt).toContain('You are Cline, a highly skilled software engineer');
    
    // Verify tool formatting section is included
    expect(systemPrompt).toContain('Tool use is formatted using XML-style tags');
    
    // Verify all tools are included (both always enabled and user enabled)
    expect(systemPrompt).toContain('## read_file');
    expect(systemPrompt).toContain('## write_to_file');
    expect(systemPrompt).toContain('## execute_command');
    expect(systemPrompt).toContain('## search_files');
    expect(systemPrompt).toContain('## list_files');
    expect(systemPrompt).toContain('## list_code_definition_names');
    expect(systemPrompt).toContain('## find_references');
    expect(systemPrompt).toContain('## attempt_completion');
    expect(systemPrompt).toContain('## ask_followup_question');
    expect(systemPrompt).toContain('## browser_action');
    expect(systemPrompt).toContain('## edit_code_symbols');
    expect(systemPrompt).toContain('## edit_go_symbols');
    expect(systemPrompt).toContain('## get_go_symbols');
    expect(systemPrompt).toContain('## get_code_symbols');
    
    // Verify capabilities section is included
    expect(systemPrompt).toContain('CAPABILITIES');
    expect(systemPrompt).toContain('You have access to tools that let you');
    
    // Verify rules section is included
    expect(systemPrompt).toContain('RULES');
    expect(systemPrompt).toContain('Your current working directory is:');
    
    // Verify system information is included
    expect(systemPrompt).toContain('SYSTEM INFORMATION');
    expect(systemPrompt).toContain('Operating System: Windows 11');
    
    // Verify objective section is included
    expect(systemPrompt).toContain('OBJECTIVE');
    expect(systemPrompt).toContain('You accomplish a given task iteratively');
  });

  it('should respect shell override in project config', async () => {
    const projectConfig: SystemConfig = {
      shellOverride: '/bin/bash'
    };

    const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, projectConfig);
    expect(systemPrompt).toContain('Default Shell: /bin/bash');
  });

  it('should not include tools section when computer use is disabled', async () => {
    const systemPrompt = await SYSTEM_PROMPT(mockCwd, false);
    expect(systemPrompt).not.toContain('## browser_action');
  });

  it('should filter tools based on enabledTools config', async () => {
    const projectConfig: SystemConfig = {
      enabledTools: {
        edit_code_symbols: true,
        edit_go_symbols: true,
        browser_action: false,
        get_go_symbols: false,
        get_code_symbols: false
      }
    };

    const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, projectConfig);
    expect(systemPrompt).toContain('## edit_code_symbols');
    expect(systemPrompt).toContain('## edit_go_symbols');
    expect(systemPrompt).not.toContain('## browser_action');
  });
});
