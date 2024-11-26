import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';

interface Symbol {
    name: string;
    kind: string;
    start: number;
    end: number;
    doc?: string;
    children?: Symbol[];
}

interface EditRequest {
    symbolName: string;
    editType: 'replace' | 'insert' | 'delete';
    newContent?: string;
}

interface ParseResult {
    success: boolean;
    symbols?: Symbol[];
    error?: string;
}

interface EditResult {
    success: boolean;
    content?: string;
    error?: string;
}

export class GoParser {
    private binaryPath: string;

    constructor() {
        // Use absolute path to the binary
        const platform = os.platform();
        const ext = platform === 'win32' ? '.exe' : '';
        this.binaryPath = path.resolve(process.cwd(), 'dist', 'bin', 'goparser' + ext);
        console.log('Initialized GoParser with binary path:', this.binaryPath);
    }

    /**
     * Parse a Go file to extract symbols
     */
    async parseFile(filePath: string): Promise<ParseResult> {
        const absolutePath = path.resolve(process.cwd(), filePath);
        console.log('Parsing file:', absolutePath);
        
        const command = {
            operation: 'parse',
            file: absolutePath
        };

        console.log('Sending command:', JSON.stringify(command, null, 2));
        return this.runCommand(command) as Promise<ParseResult>;
    }

    /**
     * Modify a symbol in a Go file
     */
    async editSymbol(filePath: string, edit: EditRequest): Promise<EditResult> {
        const absolutePath = path.resolve(process.cwd(), filePath);
        console.log('Editing file:', absolutePath);
        console.log('Edit request:', JSON.stringify(edit, null, 2));
        
        const command = {
            operation: 'edit',
            file: absolutePath,
            edit: {
                Path: absolutePath,
                Symbol: edit.symbolName,
                Content: edit.newContent,
                Position: edit.editType === 'insert' ? 'after' : undefined
            }
        };

        console.log('Sending command:', JSON.stringify(command, null, 2));
        return this.runCommand(command) as Promise<EditResult>;
    }

    /**
     * Run a command through the Go parser binary
     */
    private runCommand(command: any): Promise<ParseResult | EditResult> {
        return new Promise((resolve, reject) => {
            console.log('Running command with binary:', this.binaryPath);
            console.log('Current working directory:', process.cwd());
            
            const childProcess = spawn(this.binaryPath, ['-input', '-']);
            let stdout = '';
            let stderr = '';

            // Send command to stdin
            const input = JSON.stringify(command);
            console.log('Writing to stdin:', input);
            childProcess.stdin.write(input);
            childProcess.stdin.end();

            // Collect stdout
            childProcess.stdout.on('data', (data) => {
                const chunk = data.toString();
                console.log('Received stdout chunk:', chunk);
                stdout += chunk;
            });

            // Collect stderr
            childProcess.stderr.on('data', (data) => {
                const chunk = data.toString();
                console.log('Received stderr chunk:', chunk);
                stderr += chunk;
            });

            // Handle process completion
            childProcess.on('close', (code) => {
                console.log('Process exited with code:', code);
                if (code !== 0) {
                    reject(new Error(`Parser failed with code ${code}: ${stderr}`));
                    return;
                }

                try {
                    console.log('Parsing JSON result:', stdout);
                    const result = JSON.parse(stdout.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'));
                    console.log('Parsed result:', JSON.stringify(result, null, 2));
                    resolve(result);
                } catch (err) {
                    reject(new Error(`Failed to parse result: ${err}`));
                }
            });

            // Handle process errors
            childProcess.on('error', (err) => {
                console.error('Process error:', err);
                reject(new Error(`Failed to run parser: ${err}`));
            });
        });
    }
}
