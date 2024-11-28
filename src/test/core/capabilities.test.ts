import * as assert from 'assert';
import { CAPABILITIES } from '../../core/prompts/sections/capabilities';

suite('Capabilities', () => {
    test('should return capabilities string', () => {
        const cwd = process.cwd();
        const result = CAPABILITIES(cwd, true);
        assert.ok(result.length > 0);
        assert.ok(result.includes('You have access to tools'));
    });
});
