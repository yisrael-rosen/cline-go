import { READ_FILE_TEMPLATE, WRITE_TO_FILE_TEMPLATE } from '../file-tools';

describe('file-tools templates', () => {
  const mockCwd = 'c:/test/dir';

  describe('READ_FILE_TEMPLATE', () => {
    const template = READ_FILE_TEMPLATE(mockCwd);

    it('should contain required sections', () => {
      expect(template).toContain('## read_file');
      expect(template).toContain('Description:');
      expect(template).toContain('Parameters:');
      expect(template).toContain('Usage:');
    });

    it('should have proper parameter documentation', () => {
      expect(template).toContain('path: (required)');
      expect(template).toContain(`relative to the current working directory ${mockCwd}`);
    });

    it('should have valid tool usage format', () => {
      expect(template).toContain('$$read_file$$');
      expect(template).toContain('$$path$$');
      expect(template).toContain('$$/path$$');
      expect(template).toContain('$$/read_file$$');
    });

  });

  describe('WRITE_TO_FILE_TEMPLATE', () => {
    const template = WRITE_TO_FILE_TEMPLATE(mockCwd);

    it('should contain required sections', () => {
      expect(template).toContain('## write_to_file');
      expect(template).toContain('Description:');
      expect(template).toContain('Parameters:');
      expect(template).toContain('Usage:');
    });

    it('should have proper parameter documentation', () => {
      expect(template).toContain('path: (required)');
      expect(template).toContain('content: (required)');
      expect(template).toContain(`relative to the current working directory ${mockCwd}`);
    });

    it('should have valid tool usage format', () => {
      expect(template).toContain('$$write_to_file$$');
      expect(template).toContain('$$path$$');
      expect(template).toContain('$$/path$$');
      expect(template).toContain('$$content$$');
      expect(template).toContain('$$/content$$');
      expect(template).toContain('$$/write_to_file$$');
    });


  });
});
