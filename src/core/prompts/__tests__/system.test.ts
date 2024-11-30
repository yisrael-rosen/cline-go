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

    it('should output full system prompt for analysis', async () => {
      const result = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig);
      console.log('\n=== FULL SYSTEM PROMPT ===\n');
      console.log(result);
      console.log('\n=== END SYSTEM PROMPT ===\n');
      expect(true).toBe(true); // Just to have an assertion
    });

    it('should generate complete system prompt with all features enabled', async () => {
      const result = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig);
      
      // Verify base prompt is included
      expect(result).toContain('You are Cline, a highly skilled software engineer');
      
      // Verify tool formatting section is included
      expect(result).toContain('Tool use is formatted using XML-style tags');
      
      // Verify all tools are included
      expect(result).toContain('## read_file');
      expect(result).toContain('## write_to_file');
      expect(result).toContain('## execute_command');
      expect(result).toContain('## search_files');
      expect(result).toContain('## list_files');
      expect(result).toContain('## list_code_definition_names');
      expect(result).toContain('## find_references');
      expect(result).toContain('## attempt_completion');
      expect(result).toContain('## ask_followup_question');
      expect(result).toContain('## browser_action');
      expect(result).toContain('## edit_code_symbols');
      expect(result).toContain('## edit_go_symbols');
      expect(result).toContain('## get_go_symbols');
      expect(result).toContain('## get_code_symbols');
      expect(result).toContain('## edit_json');
    });

    it('should include hierarchical rule structure', async () => {
      const result = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig);
      
      // Verify critical rules section
      expect(result).toContain('# CRITICAL RULES (HIGHEST PRIORITY');
      expect(result).toContain('ALWAYS provide the COMPLETE file content');
      expect(result).toContain('ALWAYS wait for user confirmation');
      
      // Verify operational constraints
      expect(result).toContain('# OPERATIONAL CONSTRAINTS');
      expect(result).toContain('Your current working directory is:');
      
      // Verify validation framework
      expect(result).toContain('# VALIDATION FRAMEWORK');
      expect(result).toContain('## Before Any Code Changes:');
      expect(result).toContain('## Before Using Any Tool:');
      
      // Verify development standards
      expect(result).toContain('# DEVELOPMENT STANDARDS');
      expect(result).toContain('## Test-Driven Development:');
      
      // Verify memory refresh triggers
      expect(result).toContain('# MEMORY REFRESH TRIGGERS');
      expect(result).toContain('Before each significant action, verify:');
      
      // Verify attention control mechanisms
      expect(result).toContain('# ATTENTION CONTROL MECHANISMS');
      expect(result).toContain('Focus on one task at a time');
    });

    it('should respect shell override in project config', async () => {
      const config = { ...baseProjectConfig, shellOverride: '/bin/bash' };
      const result = await SYSTEM_PROMPT(mockCwd, true, config);
      expect(result).toContain('Default Shell: /bin/bash');
    });

    it('should not include tools section when computer use is disabled', async () => {
      const result = await SYSTEM_PROMPT(mockCwd, false, baseProjectConfig);
      expect(result).not.toContain('## browser_action');
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

      const result = await SYSTEM_PROMPT(mockCwd, true, config);
      expect(result).toContain('## edit_code_symbols');
      expect(result).toContain('## edit_go_symbols');
      expect(result).not.toContain('## browser_action');
      expect(result).not.toContain('## get_go_symbols');
      expect(result).not.toContain('## get_code_symbols');
      expect(result).not.toContain('## edit_json');
    });

    it('should include edit_json when enabled in config', async () => {
      const config = {
        ...baseProjectConfig,
        enabledTools: {
          edit_json: true
        }
      };

      const result = await SYSTEM_PROMPT(mockCwd, true, config);
      expect(result).toContain('## edit_json');
      expect(result).toContain('path-based modifications');
      expect(result).toContain('operation: (required) Type of operation');
      expect(result).toContain('symbol: (required) JSON path using dot notation');
      expect(result).toContain('value: (required for set/append)');
    });

    it('should append custom instructions when provided', async () => {
      const customInstructions = 'Test custom instructions';
      const result = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig, customInstructions);
      expect(result).toContain('\n\nCUSTOM INSTRUCTIONS\n\nTest custom instructions');
    });

    it('should not append custom instructions section when instructions are empty', async () => {
      const result = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig, '');
      expect(result).not.toContain('CUSTOM INSTRUCTIONS');
    });

    it('should not append custom instructions section when instructions are undefined', async () => {
      const result = await SYSTEM_PROMPT(mockCwd, true, baseProjectConfig, undefined);
      expect(result).not.toContain('CUSTOM INSTRUCTIONS');
    });
  });
});
