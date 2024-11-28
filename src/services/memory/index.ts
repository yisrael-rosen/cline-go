export interface MemoryEntry {
    observation: string;
}

export class MemoryService {
    private memories: MemoryEntry[] = [];

    public readMemory(): MemoryEntry[] {
        return [...this.memories];
    }

    public appendMemory(observation: string): void {
        const newEntry: MemoryEntry = {
            observation
        };
        this.memories.push(newEntry);
    }
}

// Export a singleton instance
export const memoryService = new MemoryService();
