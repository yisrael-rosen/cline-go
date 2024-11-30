import { TOOL_DEFINITIONS, generateToolCapabilities, generateToolDocs } from '../definitions';
import { validateToolTemplate } from '../templates/validator';

describe('Tool Definitions', () => {
  const mockCwd = 'c:/test/dir';

  describe('TOOL_DEFINITIONS', () => {
    it('should have valid tool definitions', () => {
      expect(TOOL_DEFINITIONS.length).toBeGreaterThan(0);
      TOOL_DEFINITIONS.forEach(def => {
        expect(def).toHaveProperty('name');
        expect(def).toHaveProperty('shortDescription');
        expect(def).toHaveProperty('capabilities');
        expect(def).toHaveProperty('parameters');
        expect(def).toHaveProperty('apiDoc');
      });
    });

    it('should have valid documentation for each tool', () => {
      TOOL_DEFINITIONS.forEach(def => {
        const doc = def.apiDoc(mockCwd);
        expect(() => validateToolTemplate(doc)).not.toThrow();
      });
    });

    it('should have matching parameters and documentation', () => {
      TOOL_DEFINITIONS.forEach(def => {
        const doc = def.apiDoc(mockCwd);
        def.parameters.forEach(param => {
          if (param.required) {
            expect(doc).toContain(`${param.name}: (required)`);
            expect(doc).toContain(`$$${param.name}$$`);
            expect(doc).toContain(`$$/${param.name}$$`);
          }
        });
      });
    });
  });

  describe('generateToolCapabilities', () => {
    it('should generate capabilities for enabled tools', () => {
      const enabledTools = ['read_file', 'write_to_file'];
      const capabilities = generateToolCapabilities(enabledTools);

      enabledTools.forEach(tool => {
        const def = TOOL_DEFINITIONS.find(d => d.name === tool);
        expect(capabilities).toContain(def?.name);
        expect(capabilities).toContain(def?.shortDescription);
      });
    });

    it('should group tools by category', () => {
      const enabledTools = ['read_file', 'write_to_file', 'edit_code_symbols'];
      const capabilities = generateToolCapabilities(enabledTools);

      expect(capabilities).toContain('For system operations and file management:');
      expect(capabilities).toContain('For code modifications:');
    });

    it('should handle empty enabled tools list', () => {
      const capabilities = generateToolCapabilities([]);
      expect(capabilities).toBe('');
    });
  });

  describe('generateToolDocs', () => {
    it('should generate documentation for enabled tools', () => {
      const enabledTools = ['read_file', 'write_to_file'];
      const docs = generateToolDocs(mockCwd, enabledTools);

      enabledTools.forEach(tool => {
        const def = TOOL_DEFINITIONS.find(d => d.name === tool);
        expect(docs).toContain(`## ${tool}`);
        def?.parameters.forEach(param => {
          if (param.required) {
            expect(docs).toContain(`${param.name}: (required)`);
          }
        });
      });
    });

    it('should include working directory in documentation', () => {
      const docs = generateToolDocs(mockCwd, ['read_file']);
      expect(docs).toContain(`relative to the current working directory ${mockCwd}`);
    });

    it('should handle empty enabled tools list', () => {
      const docs = generateToolDocs(mockCwd, []);
      expect(docs).toBe('');
    });

    it('should generate valid documentation for each tool', () => {
      const docs = generateToolDocs(mockCwd, ['read_file', 'write_to_file']);
      const toolDocs = docs.split('\n\n');
      
      toolDocs.forEach(doc => {
        expect(() => validateToolTemplate(doc)).not.toThrow();
      });
    });
  });
});
