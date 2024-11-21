import * as path from 'path';
import { glob } from 'glob';
const Mocha = require('mocha');

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 10000
    });

    const testsRoot = path.resolve(__dirname, '..');
    console.log('Tests root:', testsRoot);

    try {
        // Find all test files
        const pattern = '**/**.test.js';
        console.log('Looking for test files with pattern:', pattern);
        const files = await glob(pattern, { cwd: testsRoot });
        console.log('Found test files:', files);

        // Add files to the test suite
        files.forEach((f: string) => {
            const testFile = path.resolve(testsRoot, f);
            console.log('Adding test file:', testFile);
            mocha.addFile(testFile);
        });

        // Run the mocha tests
        return new Promise<void>((resolve, reject) => {
            try {
                mocha.run((failures: number) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                console.error('Error running tests:', err);
                reject(err);
            }
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        throw err;
    }
}
