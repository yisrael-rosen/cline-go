import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as vscode from 'vscode';
import { findDocumentSymbols } from '../../services/vscode/find-document-symbols';

suite('Find Document Symbols Go Test Suite', () => {
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
        tempDir = path.join(os.tmpdir(), 'vscode-find-symbols-test');
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

    test('should find document symbols in Go file', async function() {
        this.timeout(10000);

        try {
            console.log('Opening document:', testFilePath);
            const document = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(document);

            // Give Go language server time to initialize
            console.log('Waiting for Go language server initialization...');
            await new Promise(r => setTimeout(r, 3000));

            console.log('Finding document symbols...');
            const symbols = await findDocumentSymbols(testFilePath);
            console.log('Found symbols:', symbols);

            assert.ok(symbols.length > 0, 'Should find at least one symbol');
            
            // Check for specific symbols
            const symbolNames = symbols.map(s => s.split(':')[1]);
            assert.ok(symbolNames.includes('Server'), 'Should find Server struct');
            assert.ok(symbolNames.includes('handle'), 'Should find handle method');
            assert.ok(symbolNames.includes('handleConnection'), 'Should find handleConnection method');
            assert.ok(symbolNames.includes('broadcast'), 'Should find broadcast method');
            assert.ok(symbolNames.includes('Connection'), 'Should find Connection interface');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle Go files with no symbols', async function() {
        this.timeout(5000);
        const emptyFilePath = path.join(tempDir, 'empty.go');
        await fs.writeFile(emptyFilePath, 'package main\n');

        try {
            console.log('Opening document:', emptyFilePath);
            const document = await vscode.workspace.openTextDocument(emptyFilePath);
            await vscode.window.showTextDocument(document);

            console.log('Finding document symbols...');
            const symbols = await findDocumentSymbols(emptyFilePath);
            console.log('Found symbols:', symbols);

            assert.strictEqual(symbols.length, 0, 'Should return an empty array for files with no symbols');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });
});
