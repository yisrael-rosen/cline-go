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
      ? `\n\nConsider using these available tools instead:\n${editingTools.join('\n')}`
      : '';
  
      return {
        isOverThreshold: true,
        lineCount,
        message: `File length (${lineCount} lines) exceeds recommended maximum of ${FILE_LENGTH_THRESHOLD} lines.
    
    ${toolMessage}
    
    Instead of writing directly to the file, please:
    1. Review your changes and ensure they are necessary
    2. Consider if any code can be simplified
    3. Remove any redundant or unused code
    4. If the changes are still needed, provide them in your response and I will help review them
    
    Please provide your changes in the response and I will help ensure they are properly formatted and necessary.`
      };
  }