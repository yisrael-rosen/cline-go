# Claude-Specific File Editing Solutions

## Current Challenges with Claude

Claude has specific limitations when editing files:
- Maximum output token limit (8192 tokens with Anthropic)
- Tendency to truncate large files with "// rest of code here"
- Better quality when working with complete files vs. partial changes

## Proposed Extension Tools

### 1. Smart File Splitter

A new tool that automatically splits large files into manageable chunks based on code structure:

```typescript
interface FileSplitter {
    splitFile(content: string): {
        chunks: CodeChunk[];
        metadata: ChunkMetadata;
    }
}

interface CodeChunk {
    id: string;
    content: string;
    startLine: number;
    endLine: number;
    type: 'class' | 'function' | 'block';
    context: string; // imports and other necessary context
}

// Example implementation
class SmartFileSplitter implements FileSplitter {
    splitFile(content: string) {
        // Use AST parsing to identify natural break points
        // Ensure each chunk is under Claude's token limit
        // Maintain context between chunks
        return {
            chunks: [],
            metadata: {
                totalChunks: 0,
                dependencies: [],
                imports: []
            }
        };
    }
}
```

This tool would:
1. Parse the file's AST to find natural boundaries
2. Split at class/function boundaries
3. Include necessary imports/context with each chunk
4. Track relationships between chunks

### 2. Context-Aware Editor

A new command that provides Claude with focused context:

```typescript
interface EditContext {
    targetFile: string;
    editScope: {
        startLine: number;
        endLine: number;
        context: string[];
    };
    relatedCode: {
        imports: string[];
        references: string[];
    };
}

class ContextualEditor {
    async editWithContext(file: string, edit: string, context: EditContext) {
        // 1. Extract minimal required context
        // 2. Send to Claude with specific instructions
        // 3. Reintegrate changes into full file
    }
}
```

Usage example for Claude:
```typescript
// Tool use example
<edit_with_context>
<file>src/components/Button.tsx</file>
<edit_scope>
<start_line>10</start_line>
<end_line>25</end_line>
<context>
import React from 'react';
interface ButtonProps {
    // ... relevant type definitions
}
</context>
</edit_scope>
</edit_with_context>
```

### 3. Progressive File Editor

A tool that handles large files by progressively editing sections:

```typescript
interface ProgressiveEdit {
    stage: 'analyze' | 'plan' | 'edit';
    edits: Array<{
        section: string;
        changes: string;
        dependencies: string[];
    }>;
}

class ProgressiveEditor {
    async editLargeFile(file: string) {
        // 1. First pass: Analyze file structure
        const analysis = await this.analyzeFile(file);
        
        // 2. Second pass: Plan edits
        const editPlan = await this.planEdits(analysis);
        
        // 3. Third pass: Execute edits progressively
        for (const edit of editPlan.edits) {
            await this.applyEdit(edit);
        }
    }
}
```

Example prompt for Claude:
```
Analyze this file section by section:
1. First identify the main components/functions
2. Plan necessary changes for each section
3. Execute changes one section at a time
4. Maintain a list of completed changes
```

### 4. Specialized Edit Commands

New VSCode commands tailored for specific edit types:

```typescript
interface EditCommand {
    type: 'refactor' | 'add-feature' | 'fix-bug' | 'update-types';
    scope: 'function' | 'class' | 'file';
    context: string[];
}

// Example commands:
vscode.commands.registerCommand('claude.refactorFunction', async () => {
    // Focus Claude on single function refactoring
});

vscode.commands.registerCommand('claude.addFeature', async () => {
    // Guide Claude through feature addition
});
```

## Implementation Strategy

1. **Add New Tools to Extension**
```typescript
// In extension.ts
export function activate(context: vscode.ExtensionContext) {
    // Register new editing tools
    context.subscriptions.push(
        vscode.commands.registerCommand('claude.smartEdit', async () => {
            const editor = new SmartEditor();
            await editor.handleEdit();
        }),
        vscode.commands.registerCommand('claude.progressiveEdit', async () => {
            const editor = new ProgressiveEditor();
            await editor.handleLargeFile();
        })
    );
}
```

2. **Update Claude's System Prompt**
```typescript
const EDIT_SYSTEM_PROMPT = `
When editing files:
1. Always analyze the full context provided
2. Work with one section at a time
3. Maintain relationships between sections
4. Never truncate code with comments
5. Request additional context if needed
`;
```

3. **Add User Commands**
```json
{
    "contributes": {
        "commands": [
            {
                "command": "claude.smartEdit",
                "title": "Edit with Smart Context"
            },
            {
                "command": "claude.progressiveEdit",
                "title": "Progressive File Edit"
            }
        ]
    }
}
```

## Benefits

1. **Better Token Management**
   - Work with manageable chunks
   - Maintain context between edits
   - Avoid truncation issues

2. **Improved Accuracy**
   - Focus Claude on specific sections
   - Provide relevant context
   - Track dependencies

3. **Better User Experience**
   - More reliable edits
   - Clearer feedback
   - Progressive updates

## Next Steps

1. Implement the SmartFileSplitter tool first
2. Add ContextualEditor for focused edits
3. Integrate ProgressiveEditor for large files
4. Add specialized commands for common tasks

This approach provides alternatives to diff-based editing while working within Claude's capabilities and constraints.
