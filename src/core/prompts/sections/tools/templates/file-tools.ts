export const READ_FILE_TEMPLATE = (cwd: string) => [
  '## read_file',
  'Description: Request to read the contents of a file. This tool provides access to file contents for analysis or processing.',
  'Parameters:',
  `- path: (required) The path of the file to read (relative to the current working directory ${cwd})`,
  'Usage:',
  '<read_file>',
  '<path>File path here</path>',
  '</read_file>'
].join('\n');

export const WRITE_TO_FILE_TEMPLATE = (cwd: string) => [
  '## write_to_file',
  'Description: Request to write content to a file. This tool creates or updates files with the specified content. If the file doesn\'t exist, it will be created along with any necessary directories.',
  'Parameters:',
  `- path: (required) The path of the file to write to (relative to the current working directory ${cwd})`,
  '- content: (required) The content to write to the file',
  'Usage:',
  '<write_to_file>',
  '<path>File path here</path>',
  '<content>',
  'Your file content here',
  '</content>',
  '</write_to_file>'
].join('\n');
