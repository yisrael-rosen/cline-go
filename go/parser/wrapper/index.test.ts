import { GoParser } from './index';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('GoParser', () => {
    let parser: GoParser;
    let tempDir: string;

    beforeAll(async () => {
        parser = new GoParser();
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'goparser-test-'));
    });

    afterAll(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    describe('parseFile', () => {
        it('should parse Go file and return symbols', async () => {
            // Create test file
            const content = `package test

// User represents a system user
type User struct {
    ID   int
    Name string
}

// ProcessData handles data processing
func ProcessData(data []byte) error {
    return nil
}`;

            const filePath = path.join(tempDir, 'test.go');
            await fs.writeFile(filePath, content);

            const result = await parser.parseFile(filePath);
            expect(result.success).toBe(true);
            expect(result.symbols).toBeDefined();
            expect(result.symbols?.length).toBeGreaterThan(0);

            // Verify symbols
            const symbols = result.symbols!;
            expect(symbols.find(s => s.name === 'User' && s.kind === 'struct')).toBeDefined();
            expect(symbols.find(s => s.name === 'ProcessData' && s.kind === 'function')).toBeDefined();

            // Verify documentation
            const user = symbols.find(s => s.name === 'User');
            expect(user?.doc).toContain('represents a system user');
        });

        it('should handle non-existent file', async () => {
            const result = await parser.parseFile('non-existent.go');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle invalid Go code', async () => {
            const filePath = path.join(tempDir, 'invalid.go');
            await fs.writeFile(filePath, 'invalid go code');

            const result = await parser.parseFile(filePath);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('editSymbol', () => {
        it('should modify a symbol in Go file', async () => {
            // Create test file
            const content = `package test

func ProcessData(data []byte) error {
    return nil
}`;

            const filePath = path.join(tempDir, 'edit.go');
            await fs.writeFile(filePath, content);

            const result = await parser.editSymbol(filePath, {
                symbolName: 'ProcessData',
                editType: 'replace',
                newContent: `func ProcessData(data []byte) error {
    if len(data) == 0 {
        return errors.New("empty data")
    }
    return nil
}`
            });

            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
            expect(result.content).toContain('empty data');
        });

        it('should handle non-existent symbol', async () => {
            const filePath = path.join(tempDir, 'edit.go');
            await fs.writeFile(filePath, 'package test\n\nfunc Existing() {}');

            const result = await parser.editSymbol(filePath, {
                symbolName: 'NonExistent',
                editType: 'replace',
                newContent: 'func NonExistent() {}'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle invalid edit type', async () => {
            const filePath = path.join(tempDir, 'edit.go');
            await fs.writeFile(filePath, 'package test\n\nfunc Test() {}');

            const result = await parser.editSymbol(filePath, {
                symbolName: 'Test',
                editType: 'invalid' as any,
                newContent: 'func Test() {}'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle invalid Go code in new content', async () => {
            const filePath = path.join(tempDir, 'edit.go');
            await fs.writeFile(filePath, 'package test\n\nfunc Test() {}');

            const result = await parser.editSymbol(filePath, {
                symbolName: 'Test',
                editType: 'replace',
                newContent: 'invalid go code'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should handle binary not found', async () => {
            const badParser = new GoParser();
            (badParser as any).binaryPath = 'non-existent-binary';

            await expect(badParser.parseFile('test.go')).rejects.toThrow();
        });

        it('should handle invalid JSON output', async () => {
            // This would require mocking the binary output
            // Implementation depends on your testing framework's capabilities
        });
    });
});
