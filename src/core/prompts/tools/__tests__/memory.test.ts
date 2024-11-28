// Create mock functions before imports
const mockAppendMemory = jest.fn();
const mockReadMemory = jest.fn();

// Mock the MemoryService implementation before imports
jest.mock('../../../../services/memory', () => ({
    MemoryService: jest.fn().mockImplementation(() => ({
        appendMemory: mockAppendMemory,
        readMemory: mockReadMemory
    }))
}));

// Import after mocks are set up
import { memoryTool } from '../memory';
import { MemoryService } from '../../../../services/memory';

describe('memoryTool', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test('stores new observation when observation parameter is provided', async () => {
        const observation = 'Test observation';
        const result = await memoryTool.execute({ observation });

        expect(mockAppendMemory).toHaveBeenCalledWith(observation);
        expect(result).toBe(`Stored new observation: ${observation}`);
    });

    test('reads and formats all observations when no parameter is provided', async () => {
        const mockMemories = [
            { observation: 'Memory 1' },
            { observation: 'Memory 2' }
        ];
        mockReadMemory.mockReturnValue(mockMemories);

        const result = await memoryTool.execute({});

        expect(mockReadMemory).toHaveBeenCalled();
        expect(result).toBe('Memory 1\nMemory 2');
    });

    test('returns appropriate message when no memories exist', async () => {
        mockReadMemory.mockReturnValue([]);

        const result = await memoryTool.execute({});

        expect(mockReadMemory).toHaveBeenCalled();
        expect(result).toBe('No stored observations yet.');
    });

    test('treats empty observation as no observation', async () => {
        mockReadMemory.mockReturnValue([]);
        
        const result = await memoryTool.execute({ observation: '' });

        expect(mockAppendMemory).not.toHaveBeenCalled();
        expect(mockReadMemory).toHaveBeenCalled();
        expect(result).toBe('No stored observations yet.');
    });

    test('handles undefined parameters gracefully', async () => {
        mockReadMemory.mockReturnValue([]);
        
        const result = await memoryTool.execute({});

        expect(mockReadMemory).toHaveBeenCalled();
        expect(result).toBe('No stored observations yet.');
    });
});
