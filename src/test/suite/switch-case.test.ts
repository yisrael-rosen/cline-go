import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { editCodeWithSymbols, getCodeSymbols, canEditWithSymbols } from '../../services/vscode/edit-code-symbols';

suite('Switch Case Edit Test Suite', () => {
    const projectRoot = path.resolve(__dirname, '..', '..', '..', 'src', 'test', 'suite');
    const projectPath = path.join(projectRoot, 'test-project');
    const switchCaseTestPath = path.join(projectPath, 'switch-case-test.ts');
    let originalContent: string;
    let testFileUri: vscode.Uri;

    // Create an in-memory document for testing
    async function createTestDocument(content: string): Promise<vscode.Uri> {
        const uri = vscode.Uri.file(path.join(projectPath, 'test-memory.ts'));
        const edit = new vscode.WorkspaceEdit();
        edit.createFile(uri, { ignoreIfExists: true });
        edit.insert(uri, new vscode.Position(0, 0), content);
        await vscode.workspace.applyEdit(edit);
        await new Promise(r => setTimeout(r, 1000)); // Wait for VS Code to process
        return uri;
    }

    // Update in-memory document content
    async function updateDocument(uri: vscode.Uri, content: string): Promise<void> {
        const edit = new vscode.WorkspaceEdit();
        const doc = await vscode.workspace.openTextDocument(uri);
        const fullRange = new vscode.Range(
            doc.positionAt(0),
            doc.positionAt(doc.getText().length)
        );
        edit.replace(uri, fullRange, content);
        await vscode.workspace.applyEdit(edit);
        await new Promise(r => setTimeout(r, 1000)); // Wait for VS Code to process
    }

    suiteSetup(async () => {
        // Store original content
        originalContent = await vscode.workspace.openTextDocument(switchCaseTestPath)
            .then(doc => doc.getText());
        
        // Create test file URI
        testFileUri = vscode.Uri.file(path.join(projectPath, 'test-memory.ts'));
    });

    suiteTeardown(async () => {
        // Restore original content
        await vscode.workspace.fs.writeFile(
            vscode.Uri.file(switchCaseTestPath),
            Buffer.from(originalContent)
        );

        // Delete test file if it exists
        try {
            await vscode.workspace.fs.delete(testFileUri);
        } catch (err) {
            // Ignore if file doesn't exist
        }
    });

    test('should handle empty cases with fallthrough', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            const symbols = await getCodeSymbols(uri.fsPath);
            
            // Verify empty cases are found
            const symbolNames = symbols.map(s => s.name);
            assert.ok(symbolNames.includes('case 1'), 'Should find empty case 1');
            assert.ok(symbolNames.includes('case 2'), 'Should find empty case 2');
            assert.ok(symbolNames.includes('case 3'), 'Should find empty case 3');

            // Delete middle empty case
            const beforeContent = await vscode.workspace.openTextDocument(uri).then(doc => doc.getText());
            const modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'delete',
                'case 2'
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            // Verify the case was deleted
            assert.ok(beforeContent.includes('case 2:'), 'Case should exist before deletion');
            assert.ok(!modifiedContent.includes('case 2:'), 'Case should be deleted');
            assert.ok(modifiedContent.includes('case 1:'), 'First case should remain');
            assert.ok(modifiedContent.includes('case 3:'), 'Last case should remain');
            assert.ok(modifiedContent.includes('return \'Low number\''), 'Return statement should remain');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle cases with block statements', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            // Replace case with block statement
            const modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'replace',
                "case 'boolean'",
                `        case 'boolean': {
            const value = input.toString();
            const timestamp = new Date().toISOString();
            console.log(\`Processing boolean value \${value} at \${timestamp}\`);
            return \`Boolean value: \${value}\`;
        }`
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            assert.ok(
                modifiedContent.includes('const value = input.toString()'),
                'Block statement variables should be preserved'
            );
            assert.ok(
                modifiedContent.includes('new Date()'),
                'Complex expressions in block should be preserved'
            );
            assert.ok(
                modifiedContent.includes('Processing boolean value'),
                'Template literals should be preserved'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle sequential empty cases', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            // Insert new empty cases
            const modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'insert',
                'case 9',
                `
        case 10:
        case 11:
        case 12:`,
                'after'
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            // Verify the sequence
            const lines = modifiedContent.split('\n');
            const case9Index = lines.findIndex(l => l.includes('case 9'));
            const case10Index = lines.findIndex(l => l.includes('case 10'));
            const case11Index = lines.findIndex(l => l.includes('case 11'));
            const case12Index = lines.findIndex(l => l.includes('case 12'));
            
            assert.ok(case9Index < case10Index, 'case 10 should be after case 9');
            assert.ok(case10Index < case11Index, 'case 11 should be after case 10');
            assert.ok(case11Index < case12Index, 'case 12 should be after case 11');
            
            // Verify no return statements were accidentally inserted
            const contentBetweenCases = modifiedContent.substring(
                modifiedContent.indexOf('case 10'),
                modifiedContent.indexOf('case 12') + 'case 12'.length
            );
            assert.ok(
                !contentBetweenCases.includes('return'),
                'No return statements should be inserted between empty cases'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle case with escaped characters', async function(this: Mocha.Context) {
        this.timeout(10000);

        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            // Replace case with escaped characters
            const modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'replace',
                "case 'boolean'",
                `        case 'boolean':
            return 'Boolean: \\"' + input.toString() + '\\"\\n\\t' + '\\u{1F600}';`
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            assert.ok(
                modifiedContent.includes('\\"'),
                'Escaped quotes should be preserved'
            );
            assert.ok(
                modifiedContent.includes('\\n\\t'),
                'Escaped whitespace characters should be preserved'
            );
            assert.ok(
                modifiedContent.includes('\\u{1F600}'),
                'Unicode escape sequences should be preserved'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle multiple operations sequentially', async function(this: Mocha.Context) {
        this.timeout(15000);

        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            // First operation: Replace a case
            let modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'replace',
                "case 'string'",
                `        case 'string':
            return 'Modified string case';`
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            assert.ok(
                modifiedContent.includes('Modified string case'),
                'First operation should modify case content'
            );

            // Second operation: Insert a new case
            modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'insert',
                "case 'string'",
                `\n        case 'newCase':
            return 'New case added';`,
                'after'
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            assert.ok(
                modifiedContent.includes("case 'newCase'"),
                'Second operation should add new case'
            );

            // Third operation: Delete the newly added case
            modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'delete',
                "case 'newCase'"
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            assert.ok(
                !modifiedContent.includes("case 'newCase'"),
                'Third operation should delete the case'
            );
            assert.ok(
                !modifiedContent.includes('New case added'),
                'Case content should be deleted'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should verify file can be edited with symbols', async function(this: Mocha.Context) {
        this.timeout(10000);
        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            const canEdit = await canEditWithSymbols(uri.fsPath);
            assert.ok(canEdit, 'File should be editable with symbols');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should get case statements as symbols including nested cases', async function(this: Mocha.Context) {
        this.timeout(10000);
        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            const symbols = await getCodeSymbols(uri.fsPath);
            const caseSymbols = symbols.filter(s => s.kind === 'Case');
            
            assert.ok(caseSymbols.length > 0, 'Should find case statements');
            assert.ok(
                caseSymbols.some(s => s.name === "case 'user'"),
                'Should find outer case'
            );
            assert.ok(
                caseSymbols.some(s => s.name === "case 'create'"),
                'Should find nested case'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should replace nested case statement content', async function(this: Mocha.Context) {
        this.timeout(10000);
        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            const modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'replace',
                "case 'create'",
                `                case 'create':
                    return 'Modified nested case';`
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            assert.ok(
                modifiedContent.includes('Modified nested case'),
                'Nested case content should be replaced'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle default case modifications', async function(this: Mocha.Context) {
        this.timeout(10000);
        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            const modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'replace',
                'default',
                `        default:
            return 'Modified default case';`
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            assert.ok(
                modifiedContent.includes('Modified default case'),
                'Default case content should be replaced'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should insert new case statement', async function(this: Mocha.Context) {
        this.timeout(10000);
        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            const modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'insert',
                "case 'string'",
                `        case 'newCase':
            return 'New case added';`,
                'after'
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            assert.ok(
                modifiedContent.includes("case 'newCase'"),
                'New case should be inserted'
            );
            assert.ok(
                modifiedContent.includes('New case added'),
                'New case content should be inserted'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should delete a case statement', async function(this: Mocha.Context) {
        this.timeout(10000);
        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            const modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'delete',
                "case 'string'"
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            assert.ok(
                !modifiedContent.includes("case 'string'"),
                'Case should be deleted'
            );
            assert.ok(
                !modifiedContent.includes('String input'),
                'Case content should be deleted'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle invalid symbol operations', async function(this: Mocha.Context) {
        this.timeout(10000);
        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            await assert.rejects(
                () => editCodeWithSymbols(
                    uri.fsPath,
                    'replace',
                    'nonexistent',
                    'content'
                ),
                /Symbol 'nonexistent' not found/,
                'Should reject invalid symbol'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should preserve whitespace and indentation', async function(this: Mocha.Context) {
        this.timeout(10000);
        try {
            // Create in-memory document
            const uri = await createTestDocument(originalContent);
            
            const modifiedContent = await editCodeWithSymbols(
                uri.fsPath,
                'replace',
                "case 'string'",
                `        case 'string':
            return 'Properly indented';`
            );
            
            // Update in-memory document
            await updateDocument(uri, modifiedContent);
            
            const lines = modifiedContent.split('\n');
            const caseLine = lines.find(l => l.includes("case 'string'"));
            const returnLine = lines.find(l => l.includes('Properly indented'));
            
            assert.ok(
                caseLine && caseLine.startsWith('        '),
                'Case statement should preserve indentation'
            );
            assert.ok(
                returnLine && returnLine.startsWith('            '),
                'Return statement should be properly indented'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });
});
