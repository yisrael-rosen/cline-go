import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as vscode from 'vscode';

suite('Find References', () => {
    let tempDir: string;
    let testFilePath: string;
    let otherFilePath: string;

    const fileContent = `
// Simple hello world class
export class HelloWorld {
    greet(): string {
        return "Hello, World!";
    }
}

// Create an instance and use it
const hello = new HelloWorld();
console.log(hello.greet());

// Use it in another function
function useHello(h: HelloWorld) {
    console.log(h.greet());
}

useHello(hello);
`;

    const otherContent = `
// Import and use HelloWorld from main file
import { HelloWorld } from './hello';

const another = new HelloWorld();
console.log(another.greet());
`;

    suiteSetup(async () => {
        console.log('[TEST] Setting up test suite...');
        tempDir = path.join(os.tmpdir(), 'vscode-find-references-test');
        await fs.mkdir(tempDir, { recursive: true });

        // Create main test file
        testFilePath = path.join(tempDir, 'hello.ts');
        await fs.writeFile(testFilePath, fileContent);
        console.log(`[TEST] Created main file at: ${testFilePath}`);

        // Create other test file
        otherFilePath = path.join(tempDir, 'other.ts');
        await fs.writeFile(otherFilePath, otherContent);
        console.log(`[TEST] Created other file at: ${otherFilePath}`);

        // Create tsconfig.json to enable TypeScript features
        const tsconfigPath = path.join(tempDir, 'tsconfig.json');
        await fs.writeFile(tsconfigPath, JSON.stringify({
            compilerOptions: {
                target: "es2020",
                module: "commonjs",
                strict: true
            }
        }));
        console.log('[TEST] Created tsconfig.json');
    });

    suiteTeardown(async () => {
        console.log('[TEST] Cleaning up test suite...');
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    test('should find all class references', async () => {
        // Open the document in VSCode
        const document = await vscode.workspace.openTextDocument(testFilePath);
        await vscode.window.showTextDocument(document);

        // Wait for TypeScript features
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Find references to HelloWorld class
        const text = document.getText();
        const position = document.positionAt(text.indexOf('HelloWorld'));
        console.log(`[TEST] Looking for HelloWorld at position: ${position.line}:${position.character}`);

        const references = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeReferenceProvider',
            document.uri,
            position
        );

        console.log('[TEST] References found:', references);
        
        // Should find 5 references total:
        // hello.ts: class definition, new instance, parameter type
        // other.ts: import statement, new instance
        assert.strictEqual(references?.length, 5, 'Should find 5 references total');

        // Verify references in both files
        const files = new Set(references?.map(ref => path.basename(ref.uri.fsPath)));
        assert.ok(files.has('hello.ts') && files.has('other.ts'), 'Should find references in both files');

        // Log each reference for debugging
        references?.forEach((ref, i) => {
            console.log(`[TEST] Reference ${i + 1}:
                File: ${path.basename(ref.uri.fsPath)}
                Line: ${ref.range.start.line + 1}
                Character: ${ref.range.start.character + 1}`);
        });
    });

    test('should find all method references', async () => {
        const document = await vscode.workspace.openTextDocument(testFilePath);
        await vscode.window.showTextDocument(document);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Find references to greet method
        const text = document.getText();
        const position = document.positionAt(text.indexOf('greet'));
        console.log(`[TEST] Looking for greet at position: ${position.line}:${position.character}`);

        const references = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeReferenceProvider',
            document.uri,
            position
        );

        console.log('[TEST] References found:', references);
        
        // Should find 4 references total:
        // hello.ts: method definition, two calls
        // other.ts: one call
        assert.strictEqual(references?.length, 4, 'Should find 4 method references total');

        // Verify references in both files
        const files = new Set(references?.map(ref => path.basename(ref.uri.fsPath)));
        assert.ok(files.has('hello.ts') && files.has('other.ts'), 'Should find references in both files');

        // Log each reference for debugging
        references?.forEach((ref, i) => {
            console.log(`[TEST] Reference ${i + 1}:
                File: ${path.basename(ref.uri.fsPath)}
                Line: ${ref.range.start.line + 1}
                Character: ${ref.range.start.character + 1}`);
        });
    });

    test('should return empty array for non-existent symbol', async () => {
        const document = await vscode.workspace.openTextDocument(testFilePath);
        await vscode.window.showTextDocument(document);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const position = new vscode.Position(0, 0);
        const references = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeReferenceProvider',
            document.uri,
            position
        );

        assert.ok(!references?.length, 'Should return empty array for non-existent symbol');
    });
});
