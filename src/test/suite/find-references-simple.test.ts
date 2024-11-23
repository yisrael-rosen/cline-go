import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { findReferences } from '../../services/vscode/find-references';

suite('Find References Simple', () => {
    const projectPath = path.join(__dirname, 'test-project');
    const srcPath = path.join(projectPath, 'src');
    const filePath = path.join(srcPath, 'message.ts');

    test('should find multiple references to printMessage', async function() {
        // Increase timeout for this specific test
        this.timeout(10000);

        try {
            console.log('Opening document:', filePath);
            // First open the file in VSCode to ensure TypeScript language features are active
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);

            // Wait for TypeScript language features to be ready
            console.log('Waiting for TypeScript initialization...');
            await new Promise<void>(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('TypeScript initialization timeout'));
                }, 8000);

                try {
                    // Give TypeScript service time to initialize
                    await new Promise(r => setTimeout(r, 3000));
                    clearTimeout(timeout);
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });

            console.log('Finding references for printMessage...');
            // Find references
            const references = await findReferences(filePath, 'printMessage');
            console.log('Found references:', references);
            
            // Just verify we found more than one reference
            assert.ok(references.length > 1, 'Should find multiple references to printMessage');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should return empty array for non-existent symbol', async () => {
        const references = await findReferences(filePath, 'nonExistentFunction');
        assert.strictEqual(references.length, 0, 'Should return empty array for non-existent symbol');
    });

    test('should throw error for empty symbol', async () => {
        await assert.rejects(
            async () => await findReferences(filePath, ''),
            /Symbol must not be empty/,
            'Should throw error for empty symbol'
        );
    });
});
