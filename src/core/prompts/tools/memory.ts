import { MemoryService, MemoryEntry } from '../../../services/memory';

const memoryService = new MemoryService();

export interface MemoryToolParams {
    observation?: string;
}

export const memoryTool = {
    name: 'memory',
    description: `A tool for managing project observations and insights. When called without parameters, it reads all stored observations. When called with an observation parameter, it stores that new observation.

Examples:
1. Store a new observation:
<memory>
<observation>Project uses a custom Go parser for code analysis</observation>
</memory>

2. Read all stored observations:
<memory></memory>`,
    parameters: {
        observation: {
            type: 'string',
            description: 'A new observation to store',
            required: false
        }
    },
    execute: async ({ observation }: MemoryToolParams) => {
        if (observation) {
            memoryService.appendMemory(observation);
            return `Stored new observation: ${observation}`;
        } else {
            const memories = memoryService.readMemory();
            if (memories.length === 0) {
                return 'No stored observations yet.';
            }
            return memories.map((entry: MemoryEntry) => entry.observation).join('\n');
        }
    }
};
