import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { findDocumentSymbols } from '../../services/vscode/find-document-symbols';

suite('Find Document Symbols Test Suite', () => {
    // Use absolute paths from source directory
    const projectRoot = path.resolve(__dirname, '..', '..', '..', 'src', 'test', 'suite');
    const projectPath = path.join(projectRoot, 'test-project');
    const userFilePath = path.join(projectPath, 'user.ts');
    const authFilePath = path.join(projectPath, 'auth.ts');
    const emptyFilePath = path.join(projectPath, 'empty.ts');

    test('should find document symbols in user.ts', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            console.log('Opening document:', userFilePath);
            // First open the file in VSCode to ensure TypeScript language features are active
            const document = await vscode.workspace.openTextDocument(userFilePath);
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

            console.log('Finding document symbols...');
            const symbols = await findDocumentSymbols(userFilePath);
            console.log('Found symbols:', symbols);

            assert.ok(symbols.length > 0, 'Should find at least one symbol');
            
            // Check for specific symbols
            const symbolNames = symbols.map(s => s.split(':')[1]);
            assert.ok(symbolNames.includes('User'), 'Should find User interface');
            assert.ok(symbolNames.includes('UserService'), 'Should find UserService class');
            assert.ok(symbolNames.includes('createUser'), 'Should find createUser function');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should find document symbols in auth.ts', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            console.log('Opening document:', authFilePath);
            const document = await vscode.workspace.openTextDocument(authFilePath);
            await vscode.window.showTextDocument(document);

            console.log('Waiting for TypeScript initialization...');
            await new Promise<void>(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('TypeScript initialization timeout'));
                }, 8000);

                try {
                    await new Promise(r => setTimeout(r, 3000));
                    clearTimeout(timeout);
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });

            console.log('Finding document symbols...');
            const symbols = await findDocumentSymbols(authFilePath);
            console.log('Found symbols:', symbols);

            assert.ok(symbols.length > 0, 'Should find at least one symbol');
            
            // Check for specific symbols
            const symbolNames = symbols.map(s => s.split(':')[1]);
            assert.ok(symbolNames.includes('AuthService'), 'Should find AuthService class');
            assert.ok(symbolNames.includes('validateEmail'), 'Should find validateEmail function');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle files with no symbols', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            console.log('Opening document:', emptyFilePath);
            const document = await vscode.workspace.openTextDocument(emptyFilePath);
            await vscode.window.showTextDocument(document);

            console.log('Waiting for TypeScript initialization...');
            await new Promise<void>(async (resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('TypeScript initialization timeout'));
                }, 8000);

                try {
                    await new Promise(r => setTimeout(r, 3000));
                    clearTimeout(timeout);
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            });

            console.log('Finding document symbols...');
            const symbols = await findDocumentSymbols(emptyFilePath);
            console.log('Found symbols:', symbols);

            assert.strictEqual(symbols.length, 0, 'Should return an empty array for files with no symbols');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should throw an error for non-existent file', async function(this: Mocha.Context) {
        this.timeout(5000);
        const nonExistentFilePath = path.join(projectPath, 'non-existent.ts');

        try {
            await findDocumentSymbols(nonExistentFilePath);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof Error, 'Should throw an error');
        }
    });
});
