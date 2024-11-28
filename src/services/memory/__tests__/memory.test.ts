import { MemoryService } from '..';

describe('MemoryService', () => {
    let memoryService: MemoryService;
    
    beforeEach(() => {
        memoryService = new MemoryService();
    });

    test('starts with empty memory', () => {
        const result = memoryService.readMemory();
        expect(result).toEqual([]);
    });

    test('appends and reads memory entries', () => {
        const observation = 'Test observation';
        memoryService.appendMemory(observation);

        const result = memoryService.readMemory();
        expect(result).toHaveLength(1);
        expect(result[0].observation).toBe(observation);
    });

    test('maintains multiple entries in order', () => {
        const observations = ['First', 'Second', 'Third'];
        
        observations.forEach(obs => memoryService.appendMemory(obs));
        
        const result = memoryService.readMemory();
        expect(result).toHaveLength(3);
        result.forEach((entry, index) => {
            expect(entry.observation).toBe(observations[index]);
        });
    });

    test('returns a copy of memories array', () => {
        memoryService.appendMemory('Original');
        const result = memoryService.readMemory();
        
        // Modify the returned array
        result.push({
            observation: 'Modified'
        });

        // Original memories should be unchanged
        const newResult = memoryService.readMemory();
        expect(newResult).toHaveLength(1);
        expect(newResult[0].observation).toBe('Original');
    });

    test('handles empty observation', () => {
        memoryService.appendMemory('');
        
        const result = memoryService.readMemory();
        expect(result).toHaveLength(1);
        expect(result[0].observation).toBe('');
    });
});
