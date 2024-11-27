import { getGoSymbols, GoSymbol } from '../../../src/services/go/get-go-symbols';
import { GoParser } from '../wrapper';

// Mock the GoParser module
jest.mock('../wrapper', () => {
    const mockParseFile = jest.fn();
    return {
        GoParser: jest.fn().mockImplementation(() => ({
            parseFile: mockParseFile
        }))
    };
});

describe('getGoSymbols', () => {
    let mockParser: jest.Mocked<GoParser>;
    let mockParseFile: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockParser = new GoParser() as jest.Mocked<GoParser>;
        mockParseFile = (mockParser.parseFile as jest.Mock);
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

        mockParseFile.mockResolvedValue({
            success: true,
            symbols: mockSymbols
        });

        const result = await getGoSymbols('test.go');

        expect(result.success).toBe(true);
        expect(result.symbols).toEqual(mockSymbols);
        expect(result.error).toBeUndefined();
        expect(mockParseFile).toHaveBeenCalledWith('test.go');
    });

    it('should return error when parser fails', async () => {
        const errorMessage = 'Failed to parse file';
        mockParseFile.mockResolvedValue({
            success: false,
            error: errorMessage
        });

        const result = await getGoSymbols('test.go');

        expect(result.success).toBe(false);
        expect(result.symbols).toBeUndefined();
        expect(result.error).toBe(errorMessage);
        expect(mockParseFile).toHaveBeenCalledWith('test.go');
    });

    it('should handle thrown errors', async () => {
        mockParseFile.mockRejectedValue(new Error('Unexpected error'));

        const result = await getGoSymbols('test.go');

        expect(result.success).toBe(false);
        expect(result.symbols).toBeUndefined();
        expect(result.error).toBe('Unexpected error');
        expect(mockParseFile).toHaveBeenCalledWith('test.go');
    });

    it('should handle non-Error thrown values', async () => {
        mockParseFile.mockRejectedValue('Some string error');

        const result = await getGoSymbols('test.go');

        expect(result.success).toBe(false);
        expect(result.symbols).toBeUndefined();
        expect(result.error).toBe('Failed to parse Go file');
        expect(mockParseFile).toHaveBeenCalledWith('test.go');
    });
});
