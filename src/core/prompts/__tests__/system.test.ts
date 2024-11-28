/// <reference types="jest" />

import { SYSTEM_PROMPT, ProjectConfig } from '../system';

// Mock modules
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

// Mock section imports
jest.mock('../sections/base', () => ({
  BASE_PROMPT: 'You are Cline, a highly skilled software engineer',
  TOOL_USE_FORMATTING: 'Tool use formatting section'
}));

jest.mock('../sections/capabilities', () => ({
  CAPABILITIES: () => 'Capabilities section'
}));

jest.mock('../sections/rules', () => ({
  RULES: () => 'Rules section'
}));

jest.mock('../sections/tools/index', () => ({
  getAllTools: (cwd: string, supportsComputerUse: boolean) => {
    const tools = [
      '## execute_command\nCommand tool description',
      '## read_file\nRead file tool description',
      '## write_to_file\nWrite file tool description',
      '## search_files\nSearch files tool description'
    ];
    
    if (!supportsComputerUse) {
      return '';
    }
    
    return tools.join('\n\n');
  }
}));

jest.mock('../sections/objective', () => ({
  OBJECTIVE: 'Objective section'
}));

// Add String.prototype.toPosix for testing
declare global {
  interface String {
    toPosix(): string;
  }
}

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
    jest.clearAllMocks();
  });

  it('should generate complete system prompt with all features enabled', async () => {
    const projectConfig: ProjectConfig = {
      name: 'test-project',
      customInstructions: undefined,
      enabledTools: [
        'read_file',
        'write_to_file',
        'list_files',
        'search_files',
        'execute_command',
        'ask_followup_question',
        'attempt_completion'
      ]
    };

    const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, projectConfig);

    // Verify main sections are present
    expect(systemPrompt).toContain('You are Cline, a highly skilled software engineer');
    expect(systemPrompt).toContain('TOOL USE');
    expect(systemPrompt).toContain('Tool use formatting section');
    expect(systemPrompt).toContain('Capabilities section');
    expect(systemPrompt).toContain('Rules section');
    expect(systemPrompt).toContain('OBJECTIVE');
    expect(systemPrompt).toContain('Objective section');

    // Verify system information is correct
    expect(systemPrompt).toContain('Operating System: Windows 11');
    expect(systemPrompt).toContain('Default Shell: C:\\WINDOWS\\system32\\cmd.exe');
    expect(systemPrompt).toContain('Home Directory: C:/Users/ROSEN');
    expect(systemPrompt).toContain('Current Working Directory: c:/Users/ROSEN/dev/cline');

    // Verify tools are present when computer use is enabled
    expect(systemPrompt).toContain('## execute_command');
    expect(systemPrompt).toContain('## read_file');
    expect(systemPrompt).toContain('## write_to_file');
    expect(systemPrompt).toContain('## search_files');
  });

  it('should respect shell override in project config', async () => {
    const projectConfig: ProjectConfig = {
      name: 'test-project',
      shellOverride: '/bin/bash'
    };

    const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, projectConfig);
    expect(systemPrompt).toContain('Default Shell: /bin/bash');
  });

  it('should not include tools section when computer use is disabled', async () => {
    const systemPrompt = await SYSTEM_PROMPT(mockCwd, false);
    
    // Should not contain any tool sections when computer use is disabled
    expect(systemPrompt).not.toContain('## execute_command');
    expect(systemPrompt).not.toContain('## read_file');
    expect(systemPrompt).not.toContain('## write_to_file');
    expect(systemPrompt).not.toContain('## search_files');
  });

  it('should filter tools based on enabledTools config', async () => {
    const projectConfig: ProjectConfig = {
      name: 'test-project',
      enabledTools: ['read_file', 'write_to_file']
    };

    const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, projectConfig);

    // Should contain enabled tools
    expect(systemPrompt).toContain('## read_file');
    expect(systemPrompt).toContain('## write_to_file');

    // Should not contain filtered out tools
    expect(systemPrompt).not.toContain('## execute_command');
    expect(systemPrompt).not.toContain('## search_files');
  });
});
