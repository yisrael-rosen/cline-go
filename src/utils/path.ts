import path from 'path';
import os from 'os';

/**
 * Convert Windows-style paths to POSIX format
 */
declare global {
  interface String {
    toPosix(): string;
  }
}

if (!String.prototype.toPosix) {
  String.prototype.toPosix = function() {
    return this.replace(/\\/g, '/');
  };
}

/**
 * Get the VSCode user directory path
 * On Windows: %APPDATA%/Code/User
 * On macOS: ~/Library/Application Support/Code/User
 * On Linux: ~/.config/Code/User
 */
export function getVSCodeUserDir(): string {
  const platform = process.platform;
  const homeDir = os.homedir();

  switch (platform) {
    case 'win32':
      return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'Code', 'User');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User');
    default: // linux and others
      return path.join(homeDir, '.config', 'Code', 'User');
  }
}

/**
 * Compare two paths for equality, normalizing path separators and case sensitivity
 */
export function arePathsEqual(path1: string, path2: string): boolean {
  // Normalize path separators to forward slashes
  const normalized1 = path1.toPosix();
  const normalized2 = path2.toPosix();

  // On Windows, paths are case-insensitive
  if (process.platform === 'win32') {
    return normalized1.toLowerCase() === normalized2.toLowerCase();
  }

  // On Unix-like systems, paths are case-sensitive
  return normalized1 === normalized2;
}

/**
 * Convert a path to a human-readable format
 * - Converts absolute paths to relative when possible
 * - Normalizes path separators
 * - Handles home directory expansion
 */
export function getReadablePath(filePath: string, relativeTo?: string): string {
  // Normalize path separators
  let normalized = filePath.toPosix();

  // If relativeTo is provided, try to make the path relative
  if (relativeTo) {
    try {
      const relative = path.relative(relativeTo, normalized);
      if (!relative.startsWith('..')) {
        return relative.toPosix();
      }
    } catch (error) {
      // Fall back to absolute path if relative path calculation fails
    }
  }

  // Replace home directory with ~
  const home = os.homedir().toPosix();
  if (normalized.startsWith(home)) {
    normalized = '~' + normalized.slice(home.length);
  }

  return normalized;
}
