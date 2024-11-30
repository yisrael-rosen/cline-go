import { editJson } from '../edit-json';
import * as fs from 'fs';
import * as path from 'path';

describe('editJson', () => {
  const testFile = path.join(__dirname, 'test.json');
  
  beforeEach(() => {
    const initialJson = {
      name: "test",
      settings: {
        enabled: true,
        count: 1
      },
      items: ["a", "b", "c"]
    };
    fs.writeFileSync(testFile, JSON.stringify(initialJson, null, 2));
  });

  afterEach(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  test('should set a value at path', async () => {
    await editJson(testFile, {
      symbol: 'settings.enabled',
      value: false,
      operation: 'set'
    });

    const result = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    expect(result.settings.enabled).toBe(false);
  });

  test('should delete a value at path', async () => {
    await editJson(testFile, {
      symbol: 'settings.count',
      operation: 'delete'
    });

    const result = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    expect(result.settings.count).toBeUndefined();
  });

  test('should append to array at path', async () => {
    await editJson(testFile, {
      symbol: 'items',
      value: "d",
      operation: 'append'
    });

    const result = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    expect(result.items).toEqual(["a", "b", "c", "d"]);
  });

  test('should throw error when appending to non-array', async () => {
    await expect(editJson(testFile, {
      symbol: 'name',
      value: 'test',
      operation: 'append'
    })).rejects.toThrow('Cannot append to non-array path');
  });

  test('should throw error when setting without value', async () => {
    await expect(editJson(testFile, {
      symbol: 'name',
      operation: 'set'
    } as any)).rejects.toThrow('Value is required for set operations');
  });

  test('should throw error when appending without value', async () => {
    await expect(editJson(testFile, {
      symbol: 'items',
      operation: 'append'
    } as any)).rejects.toThrow('Value is required for append operations');
  });

  test('should handle nested paths', async () => {
    await editJson(testFile, {
      symbol: 'settings.nested.deep.value',
      value: 42,
      operation: 'set'
    });

    const result = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    expect(result.settings.nested.deep.value).toBe(42);
  });
});
