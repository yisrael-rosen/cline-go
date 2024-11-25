import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { editCodeWithSymbols, getCodeSymbols, canEditWithSymbols } from '../../services/vscode/edit-code-symbols';

suite('Switch Case Edit Test Suite', () => {
    const projectRoot = path.resolve(__dirname, '..', '..', '..', 'src', 'test', 'suite');
    const projectPath = path.join(projectRoot, 'test-project');
    const switchCaseTestPath = path.join(projectPath, 'switch-case-test.ts');

    async function initializeTypeScript(filePath: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        await new Promise(r => setTimeout(r, 3000)); // Wait for TypeScript initialization
    }

    test('should get case statements as symbols', async function() {
        this.timeout(10000);

        try {
            await initializeTypeScript(switchCaseTestPath);
            const symbols = await getCodeSymbols(switchCaseTestPath);
            
            // Verify case statements are found
            const symbolNames = symbols.map(s => s.name);
            assert.ok(symbolNames.includes("case 'create'"), 'Should find create case');
            assert.ok(symbolNames.includes("case 'update'"), 'Should find update case');
            assert.ok(symbolNames.includes("case 'delete'"), 'Should find delete case');
            assert.ok(symbolNames.includes('case 200'), 'Should find 200 case');
            assert.ok(symbolNames.includes('case 404'), 'Should find 404 case');
            assert.ok(symbolNames.includes('case 500'), 'Should find 500 case');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should replace case statement content', async function() {
        this.timeout(10000);

        try {
            await initializeTypeScript(switchCaseTestPath);

            const modifiedContent = await editCodeWithSymbols(
                switchCaseTestPath,
                'replace',
                "case 'create'",
                "        case 'create':\n            return 'Creating new resource';"
            );
            
            assert.ok(
                modifiedContent.includes("return 'Creating new resource'"),
                'Case content should be replaced'
            );
            assert.ok(
                !modifiedContent.includes("return 'Creating new item'"),
                'Old case content should be removed'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should insert new case statement', async function() {
        this.timeout(10000);

        try {
            await initializeTypeScript(switchCaseTestPath);

            const modifiedContent = await editCodeWithSymbols(
                switchCaseTestPath,
                'insert',
                "case 'delete'",
                "\n        case 'archive':\n            return 'Archiving item';",
                'after'
            );
            
            assert.ok(
                modifiedContent.includes("case 'archive'"),
                'New case should be inserted'
            );
            assert.ok(
                modifiedContent.indexOf("case 'delete'") < modifiedContent.indexOf("case 'archive'"),
                'New case should be after delete case'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should delete a case statement', async function() {
        this.timeout(10000);

        try {
            await initializeTypeScript(switchCaseTestPath);

            const modifiedContent = await editCodeWithSymbols(
                switchCaseTestPath,
                'delete',
                "case 'update'"
            );
            
            assert.ok(
                !modifiedContent.includes("case 'update'"),
                'Case should be deleted'
            );
            assert.ok(
                !modifiedContent.includes("return 'Updating existing item'"),
                'Case content should be deleted'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });
});
