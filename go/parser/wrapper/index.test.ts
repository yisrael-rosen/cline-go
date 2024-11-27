/// <reference types="jest" />

import { GoParser, EditRequest } from './index';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('GoParser', () => {
    let parser: GoParser;
    let tempDir: string;

    beforeEach(() => {
        parser = new GoParser();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'goparser-test-'));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    describe('editSymbol', () => {
        it('should handle multi-line comments in replacement', async () => {
            const filePath = path.join(tempDir, 'test.go');
            const initialContent = `package test
// Process handles data
// This is a legacy implementation
// @deprecated: use ProcessV2 instead
func Process(data []byte) error {
    return nil
}`;
            fs.writeFileSync(filePath, initialContent);

            const edit: EditRequest = {
                symbolName: 'Process',
                editType: 'replace',
                newContent: `// Process handles data with context
// This is the new implementation that:
// - Supports context
// - Provides better error handling
// - Follows new standards
func Process(ctx context.Context, data []byte) error {
    return nil
}`
            };

            const result = await parser.editSymbol(filePath, edit);
            expect(result.success).toBe(true);
            expect(result.content).toContain('handles data with context');
            expect(result.content).toContain('- Supports context');
            expect(result.content).not.toContain('@deprecated');
            expect(result.content).toContain('ctx context.Context');
        });

        it('should handle block comments in insertion', async () => {
            const filePath = path.join(tempDir, 'test.go');
            const initialContent = `package test
// Service handles operations
type Service struct{}

/* Process performs the main operation
   with multi-line processing logic */
func (s *Service) Process() error {
    return nil
}`;
            fs.writeFileSync(filePath, initialContent);

            const edit: EditRequest = {
                symbolName: 'Validate',
                editType: 'insert',
                newContent: `/* Validate ensures data integrity by:
   - Checking format
   - Validating constraints
   - Verifying permissions */
func (s *Service) Validate() error {
    return nil
}`,
                insert: {
                    position: 'before',
                    relativeToSymbol: 'Process'
                }
            };

            const result = await parser.editSymbol(filePath, edit);
            expect(result.success).toBe(true);
            expect(result.content).toContain('Validate ensures data integrity');
            expect(result.content).toContain('- Checking format');
            
            // Verify order
            const validateIndex = result.content!.indexOf('Validate');
            const processIndex = result.content!.indexOf('Process');
            expect(validateIndex).toBeLessThan(processIndex);
        });

        it('should replace a function', async () => {
            const filePath = path.join(tempDir, 'test.go');
            const initialContent = `package test
// Process handles data
func Process(data []byte) error {
    return nil
}`;
            fs.writeFileSync(filePath, initialContent);

            const edit: EditRequest = {
                symbolName: 'Process',
                editType: 'replace',
                newContent: `// Process handles data with context
func Process(ctx context.Context, data []byte) error {
    return nil
}`
            };

            const result = await parser.editSymbol(filePath, edit);
            expect(result.success).toBe(true);
            expect(result.content).toContain('ctx context.Context');
            expect(result.content).toContain('handles data with context');
        });

        it('should insert a method before target', async () => {
            const filePath = path.join(tempDir, 'test.go');
            const initialContent = `package test
// Service handles operations
type Service struct{}
// Process handles data
func (s *Service) Process() error {
    return nil
}`;
            fs.writeFileSync(filePath, initialContent);

            const edit: EditRequest = {
                symbolName: 'Validate',
                editType: 'insert',
                newContent: `// Validate ensures data integrity
func (s *Service) Validate() error {
    return nil
}`,
                insert: {
                    position: 'before',
                    relativeToSymbol: 'Process'
                }
            };

            const result = await parser.editSymbol(filePath, edit);
            expect(result.success).toBe(true);
            expect(result.content).toContain('Validate ensures data integrity');
            
            const validateIndex = result.content!.indexOf('Validate');
            const processIndex = result.content!.indexOf('Process');
            expect(validateIndex).toBeLessThan(processIndex);
        });

        it('should insert a method after target', async () => {
            const filePath = path.join(tempDir, 'test.go');
            const initialContent = `package test
// Service handles operations
type Service struct{}
// Process handles data
func (s *Service) Process() error {
    return nil
}`;
            fs.writeFileSync(filePath, initialContent);

            const edit: EditRequest = {
                symbolName: 'Cleanup',
                editType: 'insert',
                newContent: `// Cleanup performs cleanup
func (s *Service) Cleanup() error {
    return nil
}`,
                insert: {
                    position: 'after',
                    relativeToSymbol: 'Process'
                }
            };

            const result = await parser.editSymbol(filePath, edit);
            expect(result.success).toBe(true);
            expect(result.content).toContain('Cleanup performs cleanup');
            
            const processIndex = result.content!.indexOf('Process');
            const cleanupIndex = result.content!.indexOf('Cleanup');
            expect(processIndex).toBeLessThan(cleanupIndex);
        });

        it('should handle missing insert config', async () => {
            const filePath = path.join(tempDir, 'test.go');
            const initialContent = `package test
func Existing() {}`;
            fs.writeFileSync(filePath, initialContent);

            const edit: EditRequest = {
                symbolName: 'New',
                editType: 'insert',
                newContent: 'func New() {}'
            };

            const result = await parser.editSymbol(filePath, edit);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Insert configuration is required');
        });

        it('should handle invalid insert position', async () => {
            const filePath = path.join(tempDir, 'test.go');
            const initialContent = `package test
func Existing() {}`;
            fs.writeFileSync(filePath, initialContent);

            const edit: EditRequest = {
                symbolName: 'New',
                editType: 'insert',
                newContent: 'func New() {}',
                insert: {
                    position: 'invalid' as any,
                    relativeToSymbol: 'Existing'
                }
            };

            const result = await parser.editSymbol(filePath, edit);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid Position');
        });
    });
});
