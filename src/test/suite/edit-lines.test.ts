import * as assert from 'assert';
import { editText } from '../../services/vscode/edit-lines';

suite('Edit Lines @edit-lines', () => {
    test('should replace a single line', async function(this: Mocha.Context) {
        this.timeout(5000);
        try {
            const initialContent = 
`Line 1
Line 2
Line 3
Line 4
Line 5`;

            console.log('\n=== Testing single line replacement ===');
            console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            const modifiedContent = editText(
                initialContent,
                'replace',
                3,
                'Modified Line 3'
            );

            console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            assert.ok(modifiedContent.includes('Modified Line 3'), 'Line should be replaced');
            assert.ok(modifiedContent.includes('Line 2'), 'Previous line should remain');
            assert.ok(modifiedContent.includes('Line 4'), 'Next line should remain');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should reject multi-line content', async function(this: Mocha.Context) {
        this.timeout(5000);
        try {
            const initialContent = 
`Line 1
Line 2
Line 3`;

            console.log('\n=== Testing multi-line content rejection ===');
            console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            assert.throws(
                () => editText(
                    initialContent,
                    'replace',
                    2,
                    'New Line\nSecond Line'
                ),
                /Content must be a single line/,
                'Should reject multi-line content'
            );

            assert.throws(
                () => editText(
                    initialContent,
                    'insert',
                    2,
                    'New Line\r\nSecond Line'
                ),
                /Content must be a single line/,
                'Should reject multi-line content with CRLF'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should insert content after a line', async function(this: Mocha.Context) {
        this.timeout(5000);
        try {
            const initialContent = 
`Line 1
Line 2
Line 3`;

            console.log('\n=== Testing line insertion ===');
            console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            const modifiedContent = editText(
                initialContent,
                'insert',
                2,
                'New Line'
            );

            console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            const lines = modifiedContent.split('\n');
            console.log('Line count:', lines.length);
            console.log('Lines:', lines);

            assert.strictEqual(lines[0], 'Line 1', 'First line should remain unchanged');
            assert.strictEqual(lines[1], 'Line 2', 'Target line should remain unchanged');
            assert.strictEqual(lines[2], 'New Line', 'Inserted line should be correct');
            assert.strictEqual(lines[3], 'Line 3', 'Last line should remain unchanged');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should delete a line', async function(this: Mocha.Context) {
        this.timeout(5000);
        try {
            const initialContent = 
`Line 1
Line 2
Line 3
Line 4
Line 5`;

            console.log('\n=== Testing line deletion ===');
            console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            const modifiedContent = editText(
                initialContent,
                'delete',
                3
            );

            console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            const lines = modifiedContent.split('\n');
            console.log('Line count:', lines.length);
            console.log('Lines:', lines);

            assert.strictEqual(lines.length, 4, 'Should have correct number of lines after deletion');
            assert.strictEqual(lines[0], 'Line 1', 'First line should remain');
            assert.strictEqual(lines[1], 'Line 2', 'Second line should remain');
            assert.strictEqual(lines[2], 'Line 4', 'Fourth line should move up');
            assert.strictEqual(lines[3], 'Line 5', 'Last line should remain');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should preserve indentation when specified', async function(this: Mocha.Context) {
        this.timeout(5000);
        try {
            const initialContent = 
`function test() {
    const x = 1;
    const y = 2;
    return x + y;
}`;

            console.log('\n=== Testing indentation preservation ===');
            console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            const modifiedContent = editText(
                initialContent,
                'replace',
                3,
                'const y = 5;',
                { preserveIndentation: true }
            );

            console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
            console.log('Line 3:', modifiedContent.split('\n')[2]);
            console.log('Line 3 indentation:', modifiedContent.split('\n')[2].match(/^[\s\t]*/)?.[0]);

            assert.ok(modifiedContent.includes('    const y = 5;'), 'Indentation should be preserved');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle invalid line numbers', async function(this: Mocha.Context) {
        this.timeout(5000);
        try {
            const initialContent = 'Line 1\nLine 2\nLine 3';

            console.log('\n=== Testing invalid line numbers ===');
            console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            assert.throws(
                () => editText(initialContent, 'replace', 0, 'Invalid'),
                /Invalid line number/,
                'Should reject invalid line number'
            );

            assert.throws(
                () => editText(initialContent, 'replace', 5, 'Invalid'),
                /Invalid line number/,
                'Should reject line number exceeding file length'
            );
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle empty files', async function(this: Mocha.Context) {
        this.timeout(5000);
        try {
            console.log('\n=== Testing empty file handling ===');

            const modifiedContent = editText(
                '',
                'insert',
                1,
                'New Content'
            );

            console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            assert.strictEqual(modifiedContent, 'New Content', 'Should insert content into empty file');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle mixed line endings', async function(this: Mocha.Context) {
        this.timeout(5000);
        try {
            const initialContent = 'Line 1\r\nLine 2\nLine 3\r\nLine 4';

            console.log('\n=== Testing mixed line endings ===');
            console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            const modifiedContent = editText(
                initialContent,
                'replace',
                2,
                'New Line 2'
            );

            console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
            console.log('Has CRLF:', modifiedContent.includes('\r\n'));
            console.log('Has LF:', modifiedContent.includes('\n'));

            assert.ok(modifiedContent.includes('Line 1\r\n'), 'Should preserve CRLF');
            assert.ok(modifiedContent.includes('\nLine 3'), 'Should preserve LF');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });

    test('should handle mixed indentation', async function(this: Mocha.Context) {
        this.timeout(5000);
        try {
            const initialContent = 
`function test() {
	const x = 1;
    const y = 2;
	    return x + y;
}`;

            console.log('\n=== Testing mixed indentation ===');
            console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

            const modifiedContent = editText(
                initialContent,
                'replace',
                3,
                'const y = 5;',
                { preserveIndentation: true }
            );

            console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
            console.log('Line 3:', modifiedContent.split('\n')[2]);
            console.log('Line 3 indentation:', modifiedContent.split('\n')[2].match(/^[\s\t]*/)?.[0]);

            assert.ok(modifiedContent.includes('    const y = 5;'), 'Should handle mixed tabs/spaces indentation');
        } catch (err) {
            console.error('Test failed:', err);
            throw err;
        }
    });
});
