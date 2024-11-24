import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as vscode from 'vscode';
import { editCodeWithSymbols, getCodeSymbols, canEditWithSymbols } from '../../services/vscode/edit-code-symbols';

suite('Edit Code Symbols Go Test Suite', () => {
    let tempDir: string;
    let testFilePath: string;
    const fileContent = `
package main

type Server struct {
    connections chan Connection
}

func (s *Server) handle() {
    for {
        conn := <-s.connections
        go s.handleConnection(conn)
    }
}

func (s *Server) handleConnection(conn Connection) {
    // Handle the connection
    defer conn.Close()
    
    for {
        msg, err := conn.Read()
        if err != nil {
            return
        }
        s.broadcast(msg)
    }
}

func (s *Server) broadcast(message string) {
    // Broadcast message to all connections
}

type Connection interface {
    Read() (string, error)
    Write(message string) error
    Close() error
}`;

    suiteSetup(async () => {
        console.log('[TEST] Setting up test suite...');
        tempDir = path.join(os.tmpdir(), 'vscode-edit-symbols-test');
        await fs.mkdir(tempDir, { recursive: true });

        testFilePath = path.join(tempDir, 'server.go');
        await fs.writeFile(testFilePath, fileContent);
        console.log(`[TEST] Created test file at: ${testFilePath}`);
        console.log(`[TEST] Test file content:\n${fileContent}`);
    });

    suiteTeardown(async () => {
        console.log('[TEST] Cleaning up test suite...');
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    test('should detect Go file can be edited with symbols', async function() {
        this.timeout(10000);

        try {
            console.log('Opening document:', testFilePath);
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);

            // Give Go language server time to initialize
            await new Promise(r => setTimeout(r, 2000));

            const canEdit = await canEditWithSymbols(testFilePath);
            assert.strictEqual(canEdit, true, 'Should be able to edit Go file');

            const readmePath = path.join(tempDir, 'README.md');
            await fs.writeFile(readmePath, '# Test');
            const canEditReadme = await canEditWithSymbols(readmePath);
            assert.strictEqual(canEditReadme, false, 'Should not be able to edit markdown file');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should get code symbols from Go file', async function() {
        this.timeout(10000);

        try {
            console.log('Opening document:', testFilePath);
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);

            // Give Go language server time to initialize
            await new Promise(r => setTimeout(r, 2000));

            console.log('Getting code symbols...');
            const symbols = await getCodeSymbols(testFilePath);
            console.log('Found symbols:', symbols);
            
            assert.ok(symbols.length > 0, 'Should find symbols');
            const symbolNames = symbols.map(s => s.name);
            assert.ok(symbolNames.includes('Server'), 'Should find Server struct');
            assert.ok(symbolNames.includes('handle'), 'Should find handle method');
            assert.ok(symbolNames.includes('Connection'), 'Should find Connection interface');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should replace method content in Go file', async function() {
        this.timeout(10000);

        try {
            console.log('Opening document:', testFilePath);
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);

            // Give Go language server time to initialize
            await new Promise(r => setTimeout(r, 2000));

            const modifiedContent = await editCodeWithSymbols(
                testFilePath,
                'replace',
                'handle',
                `func (s *Server) handle() {
    for {
        select {
        case conn := <-s.connections:
            go s.handleConnection(conn)
        }
    }
}`
            );
            
            assert.ok(
                modifiedContent.includes('select {'),
                'Method content should be replaced'
            );
            assert.ok(
                modifiedContent.includes('case conn := <-s.connections:'),
                'New method content should be present'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should insert new method after existing method in Go file', async function() {
        this.timeout(10000);

        try {
            console.log('Opening document:', testFilePath);
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);

            // Give Go language server time to initialize
            await new Promise(r => setTimeout(r, 2000));

            const modifiedContent = await editCodeWithSymbols(
                testFilePath,
                'insert',
                'handle',
                `\n\nfunc (s *Server) isConnected(conn Connection) bool {
    // Check if connection is still active
    return true
}`,
                'after'
            );
            
            assert.ok(
                modifiedContent.includes('func (s *Server) isConnected(conn Connection) bool'),
                'New method should be inserted'
            );
            assert.ok(
                modifiedContent.indexOf('handle') < modifiedContent.indexOf('isConnected'),
                'New method should be after handle'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should delete a method from Go file', async function() {
        this.timeout(10000);

        try {
            console.log('Opening document:', testFilePath);
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);

            // Give Go language server time to initialize
            await new Promise(r => setTimeout(r, 2000));

            const modifiedContent = await editCodeWithSymbols(
                testFilePath,
                'delete',
                'broadcast'
            );
            
            assert.ok(
                !modifiedContent.includes('func (s *Server) broadcast'),
                'Method should be deleted'
            );
            assert.ok(
                !modifiedContent.includes('// Broadcast message to all connections'),
                'Method content should be deleted'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle multiple operations sequentially', async function() {
        this.timeout(10000);

        try {
            console.log('Opening document:', testFilePath);
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);

            // Give Go language server time to initialize
            await new Promise(r => setTimeout(r, 2000));

            // Delete first
            let modifiedContent = await editCodeWithSymbols(
                testFilePath,
                'delete',
                'broadcast'
            );

            // Then replace
            modifiedContent = await editCodeWithSymbols(
                testFilePath,
                'replace',
                'handle',
                `func (s *Server) handle() {
    for {
        select {
        case conn := <-s.connections:
            go s.handleConnection(conn)
        }
    }
}`
            );

            // Finally insert
            modifiedContent = await editCodeWithSymbols(
                testFilePath,
                'insert',
                'handle',
                `\n\nfunc (s *Server) isConnected(conn Connection) bool {
    return true
}`,
                'after'
            );
            
            assert.ok(!modifiedContent.includes('broadcast'), 'Method should be deleted');
            assert.ok(modifiedContent.includes('select {'), 'Method should be replaced');
            assert.ok(modifiedContent.includes('isConnected'), 'New method should be inserted');
            
            // Verify order of operations
            assert.ok(
                modifiedContent.indexOf('select {') < modifiedContent.indexOf('isConnected'),
                'Replaced method should come before inserted method'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should throw error for non-existent symbol', async function() {
        this.timeout(10000);

        try {
            console.log('Opening document:', testFilePath);
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);

            // Give Go language server time to initialize
            await new Promise(r => setTimeout(r, 2000));

            await editCodeWithSymbols(
                testFilePath,
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
});
