// WARNING: This file contains template literals. Edit with caution.
export const EDIT_JSON_TOOL = (cwd: string): string => {
  const description = `
## edit_json
Description: Request to edit JSON files using path-based modifications. This tool allows for precise edits to JSON data using dot notation paths (e.g. "settings.theme.color"). It supports setting values, deleting fields, and appending to arrays.
Parameters:
- path: (required) The path of the JSON file to edit (relative to the current working directory ${cwd})
- operation: (required) Type of operation ('set' | 'delete' | 'append')
- symbol: (required) JSON path using dot notation (e.g. "foo.bar[0].baz")
- value: (required for set/append) New value to set or append
Usage:
<edit_json>
<path>File path here</path>
<operation>set</operation>
<symbol>settings.theme.color</symbol>
<value>#FF0000</value>
</edit_json>

Examples:
1. Set a value:
<edit_json>
<path>config.json</path>
<operation>set</operation>
<symbol>settings.theme.color</symbol>
<value>#FF0000</value>
</edit_json>

2. Append to array:
<edit_json>
<path>config.json</path>
<operation>append</operation>
<symbol>items</symbol>
<value>"new item"</value>
</edit_json>

3. Delete a field:
<edit_json>
<path>config.json</path>
<operation>delete</operation>
<symbol>oldField</symbol>
</edit_json>`;

  return description;
};
