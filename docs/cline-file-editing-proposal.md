# Proposal: Smart File Editing for Cline.ts

## Current Implementation Analysis

The current Cline.ts file (1800+ lines) uses a DiffViewProvider for file editing, which requires Claude to output the entire file content. This approach faces several challenges:

1. Token Limitations
   - File is too large for Claude's 8192 token output limit
   - Often results in truncated code with "// rest of code here" comments
   - Requires multiple attempts to get complete edits

## Proposed Solution: Smart Section Editor

### 1. AST-Based Section Splitting

```typescript
// src/services/editor/SmartSectionEditor.ts
interface CodeSection {
    type: 'class' | 'method' | 'interface' | 'type';
    name: string;
    startLine: number;
    endLine: number;
    content: string;
    dependencies: string[];
}

class SmartSectionEditor {
    async splitFileIntoSections(filePath: string): Promise<CodeSection[]> {
        // Use tree-sitter to parse file into logical sections
        // Each section includes its dependencies
        return sections;
    }

    async editSection(section: CodeSection, edit: string): Promise<void> {
        // Apply edits to specific section while maintaining context
    }

    async validateSectionEdit(section: CodeSection, newContent: string): Promise<boolean> {
        // Verify edit maintains code integrity
        // Check imports, dependencies, etc.
    }
}
```

### 2. Context-Aware Editing Command

Add a new VSCode command that allows Claude to edit specific sections:

```typescript
// In extension.ts
vscode.commands.registerCommand('claude.editSection', async () => {
    const editor = new SmartSectionEditor();
    const sections = await editor.splitFileIntoSections(activeFile);
    
    // Let Claude choose which section to edit
    const targetSection = sections.find(s => s.name === requestedEdit.section);
    
    // Provide focused context to Claude
    const editContext = {
        section: targetSection,
        imports: getRelevantImports(targetSection),
        dependencies: targetSection.dependencies,
        surroundingContext: getSurroundingCode(targetSection)
    };
    
    // Let Claude edit with full context but limited scope
    await editor.editSection(targetSection, newContent);
});
```

### 3. Progressive Edit Strategy

For Cline.ts specifically:

1. **Initial Analysis**
```typescript
const mainSections = [
    {
        type: 'class',
        name: 'Cline',
        subsections: [
            'constructor',
            'task lifecycle methods',
            'tool handling methods',
            'file operations',
            'API request handling'
        ]
    }
];
```

2. **Edit Workflow**
   - Split Cline.ts into logical sections using tree-sitter
   - Present section overview to Claude
   - Allow editing one section at a time
   - Maintain section relationships and dependencies

3. **Section-Specific Prompts**
```typescript
const sectionPrompts = {
    constructor: "Edit the constructor while maintaining all parameter types and initialization order",
    taskLifecycle: "Modify task lifecycle methods while preserving event sequencing",
    toolHandling: "Update tool handling with focus on maintaining tool schema compatibility"
};
```

### 4. Implementation Steps

1. Create SmartSectionEditor:
```typescript
// src/services/editor/index.ts
export class SmartSectionEditor {
    private treeSitter: TreeSitter;
    private diffProvider: DiffViewProvider;

    async editFile(filePath: string, editRequest: EditRequest): Promise<void> {
        const sections = await this.splitFileIntoSections(filePath);
        const targetSection = this.findTargetSection(sections, editRequest);
        
        // Provide Claude with focused context
        const context = await this.buildEditContext(targetSection);
        
        // Let Claude edit with full context but limited scope
        const newContent = await this.getClaudeEdit(context);
        
        // Validate and apply the edit
        if (await this.validateEdit(targetSection, newContent)) {
            await this.applyEdit(targetSection, newContent);
        }
    }
}
```

2. Add Section-Aware Commands:
```typescript
// In package.json
{
    "contributes": {
        "commands": [
            {
                "command": "claude.editSection",
                "title": "Edit Code Section"
            },
            {
                "command": "claude.analyzeSection",
                "title": "Analyze Code Section"
            }
        ]
    }
}
```

3. Update Claude's System Prompt:
```typescript
const SECTION_EDIT_PROMPT = `
When editing file sections:
1. Focus on the provided section's scope
2. Maintain all imports and dependencies
3. Preserve type signatures and interfaces
4. Consider surrounding context
5. Validate edits against section constraints
`;
```

### 5. Benefits

1. **Token Efficiency**
   - Only sends relevant sections to Claude
   - Maintains necessary context without full file
   - Reduces likelihood of truncation

2. **Better Edit Quality**
   - More focused context for Claude
   - Easier to validate changes
   - Maintains code relationships

3. **Improved UX**
   - Clearer feedback on what's being edited
   - Progressive updates visible to user
   - Better error handling

### 6. Example Usage

```typescript
// Example of editing a specific method in Cline.ts
const editRequest = {
    file: 'src/core/Cline.ts',
    section: 'executeCommandTool',
    type: 'method',
    intent: 'Add error handling for command execution'
};

await smartEditor.editSection(editRequest);
```

## Next Steps

1. Implement SmartSectionEditor
2. Add section analysis capabilities
3. Update Claude's prompts for section-aware editing
4. Add validation and testing for sectioned edits
5. Create user commands for section-based operations

This approach would make editing Cline.ts more manageable by:
- Breaking it into logical sections
- Providing focused context to Claude
- Maintaining code integrity
- Working within token limits
- Improving edit reliability
