import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { editCodeWithSymbols, getCodeSymbols, canEditWithSymbols } from '../../services/vscode/edit-code-symbols';

suite('Edit Code Symbols Test Suite', () => {
    const projectRoot = path.resolve(__dirname, '..', '..', '..', 'src', 'test', 'suite');
    const projectPath = path.join(projectRoot, 'test-project');
    const editTestPath = path.join(projectPath, 'edit-test.ts');

    async function initializeTypeScript(filePath: string): Promise<void> {
        console.log('Opening document:', filePath);
        const document = await vscode.workspace.openTextDocument(filePath);
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
    }

    async function updateFile(filePath: string, content: string): Promise<void> {
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(filePath),
            Buffer.from(content)
        );
        // Wait for file system and language server to update
        await new Promise(r => setTimeout(r, 1000));
        await initializeTypeScript(filePath);
    }

    test('should get code symbols from file', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            await initializeTypeScript(editTestPath);

            console.log('Getting code symbols...');
            const symbols = await getCodeSymbols(editTestPath);
            console.log('Found symbols:', symbols);
            
            assert.ok(symbols.length > 0, 'Should find symbols');
            const symbolNames = symbols.map(s => s.name);
            assert.ok(symbolNames.includes('TestInterface'), 'Should find TestInterface');
            assert.ok(symbolNames.includes('TestClass'), 'Should find TestClass');
            assert.ok(symbolNames.includes('getItems'), 'Should find getItems method');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should detect if file can be edited with symbols', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            await initializeTypeScript(editTestPath);
            const canEdit = await canEditWithSymbols(editTestPath);
            assert.strictEqual(canEdit, true, 'Should be able to edit TypeScript file');

            const readmePath = path.join(projectRoot, '..', '..', 'README.md');
            const canEditReadme = await canEditWithSymbols(readmePath);
            assert.strictEqual(canEditReadme, false, 'Should not be able to edit markdown file');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should replace method content', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            await initializeTypeScript(editTestPath);

            const modifiedContent = await editCodeWithSymbols(
                editTestPath,
                'replace',
                'getItems',
                `    public getItems(): TestInterface[] {
        return this.items.filter(item => item.id > 0);
    }`
            );
            
            assert.ok(
                modifiedContent.includes('return this.items.filter(item => item.id > 0);'),
                'Method content should be replaced'
            );
            assert.ok(
                !modifiedContent.includes('return [...this.items];'),
                'Old method content should be removed'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should insert new method after existing method', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            await initializeTypeScript(editTestPath);

            const modifiedContent = await editCodeWithSymbols(
                editTestPath,
                'insert',
                'getItems',
                `\n\n    public getItemById(id: number): TestInterface | undefined {
        return this.items.find(item => item.id === id);
    }`,
                'after'
            );
            
            assert.ok(
                modifiedContent.includes('public getItemById(id: number): TestInterface | undefined'),
                'New method should be inserted'
            );
            assert.ok(
                modifiedContent.indexOf('getItems') < modifiedContent.indexOf('getItemById'),
                'New method should be after getItems'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should delete a method', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            await initializeTypeScript(editTestPath);

            const modifiedContent = await editCodeWithSymbols(
                editTestPath,
                'delete',
                'initialize'
            );
            
            assert.ok(
                !modifiedContent.includes('initialize'),
                'Method should be deleted'
            );
            assert.ok(
                !modifiedContent.includes('this.items.push({'),
                'Method content should be deleted'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle multiple operations sequentially', async function(this: Mocha.Context) {
        this.timeout(15000);

        try {
            await initializeTypeScript(editTestPath);

            // First operation: Delete initialize method
            let modifiedContent = await editCodeWithSymbols(
                editTestPath,
                'delete',
                'initialize'
            );

            // Update file and refresh
            await updateFile(editTestPath, modifiedContent);

            // Second operation: Replace getItems method
            modifiedContent = await editCodeWithSymbols(
                editTestPath,
                'replace',
                'getItems',
                `    public getItems(): TestInterface[] {
        return this.items.filter(item => item.id > 0);
    }`
            );

            // Update file and refresh
            await updateFile(editTestPath, modifiedContent);

            // Third operation: Insert new method
            modifiedContent = await editCodeWithSymbols(
                editTestPath,
                'insert',
                'getItems',
                `\n\n    public getItemById(id: number): TestInterface | undefined {
        return this.items.find(item => item.id === id);
    }`,
                'after'
            );

            // Verify final state
            assert.ok(!modifiedContent.includes('initialize'), 'Method should be deleted');
            assert.ok(modifiedContent.includes('filter(item => item.id > 0)'), 'Method should be replaced');
            assert.ok(modifiedContent.includes('getItemById'), 'New method should be inserted');
            
            // Verify order of operations
            assert.ok(
                modifiedContent.indexOf('filter(item => item.id > 0)') < modifiedContent.indexOf('getItemById'),
                'Replaced method should come before inserted method'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should throw error for non-existent symbol', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            await initializeTypeScript(editTestPath);

            await editCodeWithSymbols(
                editTestPath,
                'replace',
                'nonExistentMethod',
                'some content'
            );
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.ok(error instanceof Error);
            assert.ok((error as Error).message.includes('not found in file'));
        }
    });

    test('should handle interface edits', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            await initializeTypeScript(editTestPath);

            const modifiedContent = await editCodeWithSymbols(
                editTestPath,
                'replace',
                'TestInterface',
                `export interface TestInterface {
    id: number;
    name: string;
    description?: string;
}`
            );
            
            assert.ok(
                modifiedContent.includes('description?: string'),
                'Interface should be updated with new property'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });
});
