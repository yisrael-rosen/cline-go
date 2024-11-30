export const WRITE_TO_FILE_TOOL = (cwd: string) => `## write_to_file
Description: Request to write content to a file. This tool creates or updates files with the specified content. If the file doesn't exist, it will be created along with any necessary directories.
Parameters:
- path: (required) The path of the file to write to (relative to the current working directory ${cwd})
- content: (required) The content to write to the file
Usage:
<write_to_file>
<path>File path here</path>
<content>
Your file content here
</content>
</write_to_file>`
