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
        get_code_symbols: true
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
      
      // Verify sections are included
      expect(systemPrompt).toContain('CAPABILITIES');
      expect(systemPrompt).toContain('RULES');
      expect(systemPrompt).toContain('SYSTEM INFORMATION');
      expect(systemPrompt).toContain('OBJECTIVE');
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
          get_code_symbols: false
        }
      };

      const systemPrompt = await SYSTEM_PROMPT(mockCwd, true, config);
      expect(systemPrompt).toContain('## edit_code_symbols');
      expect(systemPrompt).toContain('## edit_go_symbols');
      expect(systemPrompt).not.toContain('## browser_action');
      expect(systemPrompt).not.toContain('## get_go_symbols');
      expect(systemPrompt).not.toContain('## get_code_symbols');
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
  });
});
