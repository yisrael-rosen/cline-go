export const READ_FILE_TOOL = (cwd: string) => `## read_file
Description: Request to read the contents of a file. This tool provides access to file contents for analysis or processing.
Parameters:
- path: (required) The path of the file to read (relative to the current working directory ${cwd})
Usage:
<read_file>
<path>File path here</path>
</read_file>`;
