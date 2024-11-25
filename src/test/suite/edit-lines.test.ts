import * as assert from 'assert';
import { editText, LineEditOptions } from '../../services/vscode/edit-lines';

/**
 * Edit Lines Test Suite
 * 
 * Why test with in-memory content?
 * 
 * 1. Test Reliability:
 *    - No file system flakiness
 *    - No race conditions
 *    - Predictable results
 *    - Fast execution
 * 
 * 2. Edge Cases:
 *    - Easy to test empty files
 *    - Can test various line endings
 *    - Can test mixed indentation
 *    - No need to create actual files
 * 
 * 3. Debugging:
 *    - Clear input/output logging
 *    - Visible line endings
 *    - Easy to inspect state
 *    - No file system inspection needed
 */
suite('Edit Lines Test Suite', () => {
    test('[edit-lines] should replace a single line', () => {
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
    });

    test('[edit-lines] should insert content after a line', () => {
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
    });

    test('[edit-lines] should delete a line', () => {
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
    });

    test('[edit-lines] should preserve indentation when specified', () => {
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
    });

    test('[edit-lines] should trim whitespace when specified', () => {
        const initialContent = 
`Line 1
    Line 2    
Line 3`;

        console.log('\n=== Testing whitespace trimming ===');
        console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

        const modifiedContent = editText(
            initialContent,
            'replace',
            2,
            '    New Line 2    ',
            { trimWhitespace: true }
        );

        console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

        assert.ok(modifiedContent.includes('\nNew Line 2\n'), 'Whitespace should be trimmed');
    });

    test('[edit-lines] should handle invalid line numbers', () => {
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
    });

    test('[edit-lines] should handle empty files', () => {
        console.log('\n=== Testing empty file handling ===');

        const modifiedContent = editText(
            '',
            'insert',
            1,
            'New Content'
        );

        console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

        assert.strictEqual(modifiedContent, 'New Content', 'Should insert content into empty file');
    });

    test('[edit-lines] should handle end of file operations', () => {
        const initialContent = 'Line 1\nLine 2';

        console.log('\n=== Testing end of file operations ===');
        console.log('Initial content:', initialContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

        const modifiedContent = editText(
            initialContent,
            'insert',
            2,
            'Line 3'
        );

        console.log('Modified content:', modifiedContent.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));

        const lines = modifiedContent.split('\n');
        console.log('Line count:', lines.length);
        console.log('Lines:', lines);

        assert.strictEqual(lines.length, 3, 'Should have correct number of lines');
        assert.strictEqual(lines[2], 'Line 3', 'Should append content at end of file');
    });

    test('[edit-lines] should handle mixed line endings', () => {
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
    });

    test('[edit-lines] should handle mixed indentation', () => {
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
    });
});
