import { ToolUseName } from "../shared/ExtensionMessage";

// Configurable threshold
export const FILE_LENGTH_THRESHOLD = 350;

/**
 * Checks if file content exceeds length threshold
 */
export interface FileLengthCheckResult {
    isOverThreshold: boolean;
    lineCount: number;
    message?: string;
  }
  
  // Add new parameter for available tools
  export function checkFileLength(
    filePath: string, 
    content: string,
    availableTools: ToolUseName[] = []  // Default to empty array if undefined
): FileLengthCheckResult {
    const lines = content.split('\n');
    const lineCount = lines.length;
  
    if (lineCount <= FILE_LENGTH_THRESHOLD) {
      return {
        isOverThreshold: false,
        lineCount
      };
    }
  
    // Build list of available editing tools
    const editingTools = [];
    if (availableTools.includes('get_code_symbols')) editingTools.push('get_code_symbols');
    if (availableTools.includes('edit_code_symbols')) editingTools.push('edit_code_symbols');
    if (filePath.endsWith('.go')) {
      if (availableTools.includes('get_go_symbols')) editingTools.push('get_go_symbols');
      if (availableTools.includes('edit_go_symbols')) editingTools.push('edit_go_symbols');
    }
    if (availableTools.includes('find_references')) editingTools.push('find_references');
  
    const toolMessage = editingTools.length > 0 
      ? `\n\nConsider using these available tools instead:\n${editingTools.join('\n')} \n 
If the tools aren't suitable for the task, then:
Instead of writing directly to the file, please:`
      : 'Instead of writing directly to the file, please:';
  
      return {
        isOverThreshold: true,
        lineCount,
        message: `File length (${lineCount} lines) exceeds recommended maximum of ${FILE_LENGTH_THRESHOLD} lines.
    
    ${toolMessage}
    
    
1. Show the code changes
2. Specify which functions/sections need to be modified
3. Provide clear integration instructions
4. List any available tools that could help`
      };
  }