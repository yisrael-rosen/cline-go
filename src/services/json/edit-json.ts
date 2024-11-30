import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export type JsonEditOperation = {
  operation: 'set' | 'delete' | 'append'; // Type of operation
  symbol: string; // JSON path like "foo.bar[0].baz"
  value?: any; // New value to set - optional for delete operations
};

export async function editJson(filePath: string, operation: JsonEditOperation): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    let json = JSON.parse(content);

    if ((operation.operation === 'set' || operation.operation === 'append') && operation.value === undefined) {
      throw new Error(`Value is required for ${operation.operation} operations`);
    }

    const pathParts = operation.symbol.split(/[\.\[\]]+/).filter(Boolean);
    
    if (operation.operation === 'delete') {
      deleteJsonPath(json, pathParts);
    } else if (operation.operation === 'set') {
      setJsonPath(json, pathParts, operation.value);
    } else if (operation.operation === 'append') {
      appendToJsonPath(json, pathParts, operation.value);
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
