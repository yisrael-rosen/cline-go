import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { 
    Uri,
    Position,
    Range,
    Location,
    TextDocument,
    workspace,
    window,
    commands,
    setMockExecuteCommand,
    setMockOpenTextDocument
} from '../core/__mocks__/vscode';

suite('Find References in Go', () => {
    let tempDir: string;
    let testFilePath: string;
    const fileContent = `
// Simple Go function
package main

func greet(name string) string {
    return "Hello, " + name
}

// Use the function
func main() {
    message := greet("World")
    println(message)
    
    // Use it again
    anotherMessage := greet("Go")
    println(anotherMessage)
}`;

    suiteSetup(async () => {
        console.log('[TEST] Setting up test suite...');
        tempDir = path.join(os.tmpdir(), 'vscode-find-references-test');
        await fs.mkdir(tempDir, { recursive: true });

        testFilePath = path.join(tempDir, 'main.go');
        await fs.writeFile(testFilePath, fileContent);
        console.log(`[TEST] Created test file at: ${testFilePath}`);
        console.log(`[TEST] Test file content:\n${fileContent}`);
    });

    suiteTeardown(async () => {
        console.log('[TEST] Cleaning up test suite...');
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    setup(() => {
        console.log('[TEST] Setting up test case...');
        setMockOpenTextDocument(async (uri: Uri | string) => {
            console.log(`[TEST] Mock openTextDocument called with URI: ${typeof uri === 'string' ? uri : uri.fsPath}`);
            return new TextDocument(
                fileContent,
                typeof uri === 'string' ? Uri.file(uri) : uri
            );
        });

        // Set up mock command executor
        setMockExecuteCommand(async <T>(command: string, ...args: any[]): Promise<T> => {
            console.log(`[TEST] Mock executeCommand called with:
                Command: ${command}
                URI: ${args[0]?.fsPath}
                Position: ${args[1]?.line}:${args[1]?.character}`);

            if (command === 'vscode.executeReferenceProvider') {
                const position = args[1] as Position;
                
                // Return empty array for position (0,0) to simulate no references found
                if (position.line === 0 && position.character === 0) {
                    console.log('[TEST] Returning empty array for non-existent symbol');
                    return [] as T;
                }

                // Return references for greet function
                if (position.line === 4 && position.character === 5) {
                    console.log('[TEST] Returning references for greet function');
                    return [
                        new Location(Uri.file(testFilePath), new Range(new Position(3, 5), new Position(3, 10))),   // function definition
                        new Location(Uri.file(testFilePath), new Range(new Position(9, 13), new Position(9, 18))),  // first call
                        new Location(Uri.file(testFilePath), new Range(new Position(13, 19), new Position(13, 24))) // second call
                    ] as T;
                }
            }
            return [] as T;
        });
    });

    test('should find all references to function', async () => {
        // Open the document in VSCode
        const document = await workspace.openTextDocument(testFilePath);
        await window.showTextDocument(document.uri);

        // Get position of greet function
        const text = document.getText();
        const position = document.positionAt(text.indexOf('greet'));
        console.log(`[TEST] Looking for references at position: ${position.line}:${position.character}`);

        const references = await commands.executeCommand<Location[]>(
            'vscode.executeReferenceProvider',
            document.uri,
            position
        );

        console.log('[TEST] References found:', references);
        
        // Should find 3 references:
        // - Function definition
        // - First function call
        // - Second function call
        assert.strictEqual(references?.length, 3, 'Should find 3 references to greet function');

        // Log each reference for debugging
        references?.forEach((ref, i) => {
            console.log(`[TEST] Reference ${i + 1}:
                File: ${path.basename(ref.uri.fsPath)}
                Line: ${ref.range.start.line + 1}
                Character: ${ref.range.start.character + 1}`);
        });
    });

    test('should return empty array for non-existent symbol', async () => {
        const document = await workspace.openTextDocument(testFilePath);
        await window.showTextDocument(document.uri);

        const position = new Position(0, 0);
        const references = await commands.executeCommand<Location[]>(
            'vscode.executeReferenceProvider',
            document.uri,
            position
        );

        console.log('[TEST] References for non-existent symbol:', references);
        assert.strictEqual(references?.length, 0, 'Should return empty array for non-existent symbol');
    });
});
