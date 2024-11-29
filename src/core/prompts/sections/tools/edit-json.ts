// WARNING: This file contains template literals. Edit with caution.
export const EDIT_JSON_TOOL = (cwd: string): string => {
  const description = `
## edit_json
Description: Request to edit JSON files using path-based modifications. This tool allows for precise edits to JSON data using dot notation paths (e.g. "settings.theme.color"). It supports setting values, deleting fields, and appending to arrays.
Parameters:
- path: (required) The path of the JSON file to edit (relative to the current working directory ${cwd})
- operations: (required) Array of operations to perform on the JSON file. Each operation has:
  * path: (required) JSON path using dot notation (e.g. "foo.bar[0].baz")
  * operation: (required) Type of operation ('set' | 'delete' | 'append')
  * value: (required for set/append) New value to set or append
Usage:
<edit_json>
<path>File path here</path>
<operations>
[
  {
    "path": "settings.theme.color",
    "operation": "set",
    "value": "#FF0000"
  },
  {
    "path": "items",
    "operation": "append", 
    "value": "new item"
  },
  {
    "path": "oldField",
    "operation": "delete"
  }
]
</operations>
</edit_json>`;

  return description;
};
