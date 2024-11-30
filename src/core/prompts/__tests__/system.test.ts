import { SYSTEM_PROMPT, SystemConfig, addCustomInstructions } from '../system';

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

describe('system', () => {
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

  describe('addCustomInstructions', () => {
    it('should format custom instructions correctly', () => {
      const instructions = 'Test instructions';
      const result = addCustomInstructions(instructions);
      expect(result).toBe('\n\nCUSTOM INSTRUCTIONS\n\nTest instructions');
    });

    it('should return empty string for empty or whitespace instructions', () => {
      expect(addCustomInstructions('')).toBe('');
      expect(addCustomInstructions('   ')).toBe('');
      expect(addCustomInstructions(undefined as any)).toBe('');
    });
  });

  describe('SYSTEM_PROMPT', () => {
    const baseProjectConfig: SystemConfig = {
      enabledTools: {
        browser_action: true,
        edit_code_symbols: true,
        edit_go_symbols: true,
        get_go_symbols: true,
        get_code_symbols: true,
        edit_json: true
      },
      shellOverride: 'C:\\WINDOWS\\system32\\cmd.exe'
    };

    it('should generate complete system prompt with all features enabled', async () => {
      const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig);
      
      // Verify base prompt is included
      expect(systemPrompt).toContain('You are Cline, a highly skilled software engineer');
      
      // Verify tool formatting section is included
      expect(systemPrompt).toContain('Tool use is formatted using XML-style tags');
      
      // Verify all tools are included
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
      expect(systemPrompt).toContain('## edit_json');
      
      // Verify sections are included
      expect(systemPrompt).toContain('CAPABILITIES');
      expect(systemPrompt).toContain('RULES');
      expect(systemPrompt).toContain('SYSTEM INFORMATION');
      expect(systemPrompt).toContain('OBJECTIVE');

      // Verify validation rules are included
      expect(systemPrompt).toContain('Before making any changes to code, you MUST validate');
      expect(systemPrompt).toContain('When writing or modifying code, you MUST');
      expect(systemPrompt).toContain('Before using any tool, you MUST');
      expect(systemPrompt).toContain('Never trust assumptions about');
    });

    it('should respect shell override in project config', async () => {
      const config = { ...baseProjectConfig, shellOverride: '/bin/bash' };
      const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, config);
      expect(systemPrompt).toContain('Default Shell: /bin/bash');
    });

    it('should not include tools section when computer use is disabled', async () => {
      const systemPrompt = await SYSTEM_PROMPT(mockCwd, false, baseProjectConfig);
      expect(systemPrompt).not.toContain('## browser_action');
    });

    it('should filter tools based on enabledTools config', async () => {
      const config = {
        ...baseProjectConfig,
        enabledTools: {
          ...baseProjectConfig.enabledTools,
          browser_action: false,
          get_go_symbols: false,
          get_code_symbols: false,
          edit_json: false
        }
      };

      const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, config);
      expect(systemPrompt).toContain('## edit_code_symbols');
      expect(systemPrompt).toContain('## edit_go_symbols');
      expect(systemPrompt).not.toContain('## browser_action');
      expect(systemPrompt).not.toContain('## get_go_symbols');
      expect(systemPrompt).not.toContain('## get_code_symbols');
      expect(systemPrompt).not.toContain('## edit_json');
    });

    it('should include edit_json when enabled in config', async () => {
      const config = {
        ...baseProjectConfig,
        enabledTools: {
          edit_json: true
        }
      };

      const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, config);
      expect(systemPrompt).toContain('## edit_json');
      expect(systemPrompt).toContain('path-based modifications');
      expect(systemPrompt).toContain('operation: (required) Type of operation');
      expect(systemPrompt).toContain('symbol: (required) JSON path using dot notation');
      expect(systemPrompt).toContain('value: (required for set/append)');
    });

    it('should append custom instructions when provided', async () => {
      const customInstructions = 'Test custom instructions';
      const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig, customInstructions);
      expect(systemPrompt).toContain('\n\nCUSTOM INSTRUCTIONS\n\nTest custom instructions');
    });

    it('should not append custom instructions section when instructions are empty', async () => {
      const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig, '');
      expect(systemPrompt).not.toContain('CUSTOM INSTRUCTIONS');
    });

    it('should not append custom instructions section when instructions are undefined', async () => {
      const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig, undefined);
      expect(systemPrompt).not.toContain('CUSTOM INSTRUCTIONS');
    });

    it('should include validation and verification rules', async () => {
      const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig);
      
      // Verify code change validation rules
      expect(systemPrompt).toContain('Using search_files to find related code');
      expect(systemPrompt).toContain('Using find_references to check all usages');
      expect(systemPrompt).toContain('Using list_code_definition_names to understand');
      expect(systemPrompt).toContain('Reading any relevant test files');

      // Verify TDD and code quality rules
      expect(systemPrompt).toContain('Write tests first following Test-Driven Development');
      expect(systemPrompt).toContain('Verify your changes don\'t break existing functionality');
      expect(systemPrompt).toContain('Consider edge cases and error handling');
      expect(systemPrompt).toContain('Add appropriate error messages and logging');
      expect(systemPrompt).toContain('Follow the project\'s existing patterns');

      // Verify tool usage rules
      expect(systemPrompt).toContain('Analyze the current state using <thinking>');
      expect(systemPrompt).toContain('Validate all required parameters');
      expect(systemPrompt).toContain('Consider potential failure cases');
      expect(systemPrompt).toContain('Wait for confirmation after each tool use');

      // Verify assumption verification rules
      expect(systemPrompt).toContain('Never trust assumptions about');
      expect(systemPrompt).toContain('File existence - always verify');
      expect(systemPrompt).toContain('Code behavior - always check tests');
      expect(systemPrompt).toContain('User intentions - ask clarifying questions');
      expect(systemPrompt).toContain('System state - verify using appropriate tools');
      expect(systemPrompt).toContain('Command success - check results');
    });
  });
});
