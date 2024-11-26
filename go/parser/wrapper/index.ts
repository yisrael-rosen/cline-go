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
        const platform = os.platform();
        const ext = platform === 'win32' ? '.exe' : '';
        this.binaryPath = path.join(__dirname, '..', 'bin', `goparser${ext}`);
    }

    /**
     * Parse a Go file to extract symbols
     */
    async parseFile(filePath: string): Promise<ParseResult> {
        const command = {
            operation: 'parse',
            file: filePath
        };

        return this.runCommand(command) as Promise<ParseResult>;
    }

    /**
     * Modify a symbol in a Go file
     */
    async editSymbol(filePath: string, edit: EditRequest): Promise<EditResult> {
        const command = {
            operation: 'edit',
            file: filePath,
            edit
        };

        return this.runCommand(command) as Promise<EditResult>;
    }

    /**
     * Run a command through the Go parser binary
     */
    private runCommand(command: any): Promise<ParseResult | EditResult> {
        return new Promise((resolve, reject) => {
            const process = spawn(this.binaryPath, ['-input', '-']);
            let stdout = '';
            let stderr = '';

            // Send command to stdin
            process.stdin.write(JSON.stringify(command));
            process.stdin.end();

            // Collect stdout
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            // Collect stderr
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Parser failed with code ${code}: ${stderr}`));
                    return;
                }

                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (err) {
                    reject(new Error(`Failed to parse result: ${err}`));
                }
            });

            // Handle process errors
            process.on('error', (err) => {
                reject(new Error(`Failed to run parser: ${err}`));
            });
        });
    }
}

// Example usage:
/*
const parser = new GoParser();

// Parse a file
const symbols = await parser.parseFile('main.go');
console.log('Symbols:', symbols);

// Edit a symbol
const result = await parser.editSymbol('main.go', {
    symbolName: 'ProcessData',
    editType: 'replace',
    newContent: 'func ProcessData(data []byte) error { return nil }'
});
console.log('Edit result:', result);
*/
