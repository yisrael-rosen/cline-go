import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export type JsonEditOperation = {
  path: string; // JSON path like "foo.bar[0].baz"
  operation: 'set' | 'delete' | 'append'; // Type of operation
  value?: any; // New value to set - optional for delete operations
};

export async function editJson(filePath: string, operations: JsonEditOperation[]): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    let json = JSON.parse(content);

    for (const op of operations) {
      if ((op.operation === 'set' || op.operation === 'append') && op.value === undefined) {
        throw new Error(`Value is required for ${op.operation} operations`);
      }

      const pathParts = op.path.split(/[\.\[\]]+/).filter(Boolean);
      
      if (op.operation === 'delete') {
        deleteJsonPath(json, pathParts);
      } else if (op.operation === 'set') {
        setJsonPath(json, pathParts, op.value);
      } else if (op.operation === 'append') {
        appendToJsonPath(json, pathParts, op.value);
      }
    }

    const formatted = JSON.stringify(json, null, 2);
    fs.writeFileSync(absolutePath, formatted);

  } catch (error) {
    throw new Error(`Failed to edit JSON file: ${error.message}`);
  }
}

function setJsonPath(obj: any, path: string[], value: any): void {
  let current = obj;
  
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[path[path.length - 1]] = value;
}

function deleteJsonPath(obj: any, path: string[]): void {
  let current = obj;
  
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current)) {
      return;
    }
    current = current[key];
  }
  
  delete current[path[path.length - 1]];
}

function appendToJsonPath(obj: any, path: string[], value: any): void {
  let current = obj;
  
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = path[path.length - 1];
  if (!current[lastKey]) {
    current[lastKey] = [];
  }
  
  if (Array.isArray(current[lastKey])) {
    current[lastKey].push(value);
  } else {
    throw new Error(`Cannot append to non-array path: ${path.join('.')}`);
  }
}
