import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { editLines, LineRange, LineEditOptions } from '../../services/vscode/edit-lines';

suite('Edit Lines Test Suite', () => {
    const projectRoot = path.resolve(__dirname, '..', '..', '..', 'src', 'test', 'suite');
    const projectPath = path.join(projectRoot, 'test-project');
    const testFilePath = path.join(projectPath, 'edit-lines-test.txt');

    async function createTestFile(content: string): Promise<void> {
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(testFilePath),
            Buffer.from(content)
        );
        // Wait for file system to update
        await new Promise(r => setTimeout(r, 1000));
    }

    test('should replace a single line', async function() {
        this.timeout(10000);

        const initialContent = 
`Line 1
Line 2
Line 3
Line 4
Line 5`;

        try {
            await createTestFile(initialContent);

            const modifiedContent = await editLines(
                testFilePath,
                'replace',
                { startLine: 3 },
                'Modified Line 3'
            );

            assert.ok(modifiedContent.includes('Modified Line 3'), 'Line should be replaced');
            assert.ok(modifiedContent.includes('Line 2'), 'Previous line should remain');
            assert.ok(modifiedContent.includes('Line 4'), 'Next line should remain');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should replace multiple lines', async function() {
        this.timeout(10000);

        const initialContent = 
`Line 1
Line 2
Line 3
Line 4
Line 5`;

        try {
            await createTestFile(initialContent);

            const modifiedContent = await editLines(
                testFilePath,
                'replace',
                { startLine: 2, endLine: 4 },
                'New Line 2\nNew Line 3\nNew Line 4'
            );

            assert.ok(modifiedContent.includes('New Line 2'), 'First line should be replaced');
            assert.ok(modifiedContent.includes('New Line 3'), 'Middle line should be replaced');
            assert.ok(modifiedContent.includes('New Line 4'), 'Last line should be replaced');
            assert.ok(modifiedContent.includes('Line 1'), 'Line before range should remain');
            assert.ok(modifiedContent.includes('Line 5'), 'Line after range should remain');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should insert content after a line', async function() {
        this.timeout(10000);

        const initialContent = 
`Line 1
Line 2
Line 3`;

        try {
            await createTestFile(initialContent);

            const modifiedContent = await editLines(
                testFilePath,
                'insert',
                { startLine: 2 },
                'New Line\nAnother New Line'
            );

            const lines = modifiedContent.split('\n');
            assert.strictEqual(lines[0], 'Line 1', 'First line should remain unchanged');
            assert.strictEqual(lines[1], 'Line 2', 'Target line should remain unchanged');
            assert.strictEqual(lines[2], 'New Line', 'First inserted line should be correct');
            assert.strictEqual(lines[3], 'Another New Line', 'Second inserted line should be correct');
            assert.strictEqual(lines[4], 'Line 3', 'Last line should remain unchanged');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should delete lines', async function() {
        this.timeout(10000);

        const initialContent = 
`Line 1
Line 2
Line 3
Line 4
Line 5`;

        try {
            await createTestFile(initialContent);

            const modifiedContent = await editLines(
                testFilePath,
                'delete',
                { startLine: 2, endLine: 4 }
            );

            const lines = modifiedContent.split('\n');
            assert.strictEqual(lines.length, 2, 'Should have correct number of lines after deletion');
            assert.strictEqual(lines[0], 'Line 1', 'First line should remain');
            assert.strictEqual(lines[1], 'Line 5', 'Last line should remain');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should preserve indentation when specified', async function() {
        this.timeout(10000);

        const initialContent = 
`function test() {
    const x = 1;
    const y = 2;
    return x + y;
}`;

        try {
            await createTestFile(initialContent);

            const modifiedContent = await editLines(
                testFilePath,
                'replace',
                { startLine: 3 },
                'const y = 5;',
                { preserveIndentation: true }
            );

            assert.ok(modifiedContent.includes('    const y = 5;'), 'Indentation should be preserved');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should trim whitespace when specified', async function() {
        this.timeout(10000);

        const initialContent = 
`Line 1
    Line 2    
Line 3`;

        try {
            await createTestFile(initialContent);

            const modifiedContent = await editLines(
                testFilePath,
                'replace',
                { startLine: 2 },
                '    New Line 2    ',
                { trimWhitespace: true }
            );

            assert.ok(modifiedContent.includes('\nNew Line 2\n'), 'Whitespace should be trimmed');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle invalid line numbers', async function() {
        this.timeout(10000);

        const initialContent = 'Line 1\nLine 2\nLine 3';

        try {
            await createTestFile(initialContent);

            await assert.rejects(
                () => editLines(testFilePath, 'replace', { startLine: 0 }, 'Invalid'),
                /Invalid start line number/,
                'Should reject invalid start line'
            );

            await assert.rejects(
                () => editLines(testFilePath, 'replace', { startLine: 1, endLine: 5 }, 'Invalid'),
                /Invalid end line number/,
                'Should reject invalid end line'
            );

            await assert.rejects(
                () => editLines(testFilePath, 'replace', { startLine: 3, endLine: 1 }, 'Invalid'),
                /End line cannot be before start line/,
                'Should reject end line before start line'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle empty files', async function() {
        this.timeout(10000);

        try {
            await createTestFile('');

            const modifiedContent = await editLines(
                testFilePath,
                'insert',
                { startLine: 1 },
                'New Content'
            );

            assert.strictEqual(modifiedContent, 'New Content', 'Should insert content into empty file');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle end of file operations', async function() {
        this.timeout(10000);

        const initialContent = 'Line 1\nLine 2';

        try {
            await createTestFile(initialContent);

            const modifiedContent = await editLines(
                testFilePath,
                'insert',
                { startLine: 2 },
                'Line 3'
            );

            const lines = modifiedContent.split('\n');
            assert.strictEqual(lines.length, 3, 'Should have correct number of lines');
            assert.strictEqual(lines[2], 'Line 3', 'Should append content at end of file');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle mixed line endings', async function() {
        this.timeout(10000);

        const initialContent = 'Line 1\r\nLine 2\nLine 3\r\nLine 4';

        try {
            await createTestFile(initialContent);

            const modifiedContent = await editLines(
                testFilePath,
                'replace',
                { startLine: 2 },
                'New Line 2'
            );

            assert.ok(modifiedContent.includes('Line 1\r\n'), 'Should preserve CRLF');
            assert.ok(modifiedContent.includes('\nLine 3'), 'Should preserve LF');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle mixed indentation', async function() {
        this.timeout(10000);

        const initialContent = 
`function test() {
	const x = 1;
    const y = 2;
	    return x + y;
}`;

        try {
            await createTestFile(initialContent);

            const modifiedContent = await editLines(
                testFilePath,
                'replace',
                { startLine: 3 },
                'const y = 5;',
                { preserveIndentation: true }
            );

            assert.ok(modifiedContent.includes('    const y = 5;'), 'Should handle mixed tabs/spaces indentation');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });
});
