/// <reference types="jest" />

import { getGoSymbols, GoSymbol } from '../get-go-symbols';
import { GoParser } from '../../../../go/parser/wrapper';

// Mock the GoParser module
jest.mock('../../../../go/parser/wrapper', () => ({
    GoParser: jest.fn().mockImplementation(() => ({
        parseFile: jest.fn()
    }))
}));

describe('getGoSymbols', () => {
    let mockParser: jest.Mocked<GoParser>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockParser = new GoParser() as jest.Mocked<GoParser>;
    });

    it('should successfully return symbols when parser succeeds', async () => {
        const mockSymbols: GoSymbol[] = [
            {
                name: 'TestFunc',
                kind: 'function',
                start: 0,
                end: 20,
                doc: 'Test function documentation'
            },
            {
                name: 'TestStruct',
                kind: 'struct',
                start: 30,
                end: 50,
                children: [
                    {
                        name: 'Field1',
                        kind: 'field',
                        start: 35,
                        end: 45
                    }
                ]
            }
        ];

        (mockParser.parseFile as jest.Mock).mockResolvedValue({
            success: true,
            symbols: mockSymbols
        });

        const result = await getGoSymbols('test.go');

        expect(result.success).toBe(true);
        expect(result.symbols).toEqual(mockSymbols);
        expect(result.error).toBeUndefined();
    });

    it('should return error when parser fails', async () => {
        const errorMessage = 'Failed to parse file';
        (mockParser.parseFile as jest.Mock).mockResolvedValue({
            success: false,
            error: errorMessage
        });

        const result = await getGoSymbols('test.go');

        expect(result.success).toBe(false);
        expect(result.symbols).toBeUndefined();
        expect(result.error).toBe(errorMessage);
    });

    it('should handle thrown errors', async () => {
        (mockParser.parseFile as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

        const result = await getGoSymbols('test.go');

        expect(result.success).toBe(false);
        expect(result.symbols).toBeUndefined();
        expect(result.error).toBe('Unexpected error');
    });

    it('should handle non-Error thrown values', async () => {
        (mockParser.parseFile as jest.Mock).mockRejectedValue('Some string error');

        const result = await getGoSymbols('test.go');

        expect(result.success).toBe(false);
        expect(result.symbols).toBeUndefined();
        expect(result.error).toBe('Failed to parse Go file');
    });
});
