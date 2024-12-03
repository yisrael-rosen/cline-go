// WARNING: This file should not be edited by LLMs directly due to complex template literal escaping.
// Manual editing is required to maintain proper string formatting and prevent syntax errors.

import path from 'path';
import fs from 'fs';
import osName from "os-name";
import defaultShell from "default-shell";
import os from "os";
import { TOOL_USE_FORMATTING } from "./sections/base";
import { CAPABILITIES } from "./sections/capabilities";
import { getAllTools } from "./sections/tools";
import { ToolUseName } from "../../shared/ExtensionMessage";
import { ProjectConfig, EnabledTools } from "../../shared/types/project-config";
import { getVSCodeUserDir } from '../../utils/path';

// These tools are always available regardless of user settings
const ALWAYS_ENABLED_TOOLS: ToolUseName[] = [
  'execute_command',
  'read_file',
  'write_to_file',
  'search_files',
  'list_files',
  'list_code_definition_names',
  'ask_followup_question',
  'attempt_completion',
  'find_references'
];

// Optional tools that can be enabled/disabled
const OPTIONAL_TOOLS: ToolUseName[] = [
  'browser_action',
  'edit_code_symbols',
  'edit_go_symbols',
  'get_go_symbols',
  'get_code_symbols',
  'edit_json'
];

export interface SystemConfig extends ProjectConfig {
  shellOverride?: string;
}

// Template interpolation function
function interpolateTemplate(template: string, context: any): string {
  return template.replace(/\$\{([^}]+)\}/g, (match, expr) => {
    try {
      // First check if the value exists directly in context
      if (expr in context) {
        return String(context[expr]);
      }
      // If not, try evaluating as an expression
      const result = evaluateExpression(expr.trim(), context)
      return String(result)
    } catch (error) {
      console.warn(`Failed to evaluate: ${expr}`)
      return match
    }
  })
}

// Safe expression evaluation
function evaluateExpression(expr: string, context: any): any {
  const safeContext = {
    ...context,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Math,
    Date,
    JSON
  }
  
  const fn = new Function(...Object.keys(safeContext), `return ${expr}`)
  return fn(...Object.values(safeContext))
}

// Get files from directory
async function getFilesFromDir(dir: string): Promise<string[]> {
  if (!fs.existsSync(dir)) {
    return [];
  }

  try {
    const files = await fs.promises.readdir(dir);
    return files.filter(file => {
      const filePath = path.join(dir, file);
      return fs.statSync(filePath).isFile();
    });
  } catch (error) {
    console.warn(`Failed to read directory: ${dir}`);
    return [];
  }
}

// Load and process instruction files
async function loadInstructionFiles(cwd: string, context: any): Promise<string[]> {
  // Define instruction directories in priority order
  const projectInstructionsDir = path.join(cwd, ".cline", "system-instructions.d")
  const globalInstructionsDir = path.join(getVSCodeUserDir(), "cline", "system-instructions.d") 
  const packageInstructionsDir = path.join("assets", "system-instructions.d")

  // Get list of files from all directories
  const projectFiles = await getFilesFromDir(projectInstructionsDir);
  const globalFiles = await getFilesFromDir(globalInstructionsDir);
  const packageFiles = await getFilesFromDir(packageInstructionsDir);

  // Combine unique filenames, maintaining priority order
  const allFiles = [...new Set([...projectFiles, ...globalFiles, ...packageFiles])].sort()

  // Process each file
  const sections = await Promise.all(allFiles.map(async (file) => {
    let content: string
    let sourcePath = ""

    // Try loading from each location in priority order
    try {
      const projectPath = path.join(projectInstructionsDir, file)
      const globalPath = path.join(globalInstructionsDir, file)
      const packagePath = path.join(packageInstructionsDir, file)

      if (fs.existsSync(projectPath)) {
        content = await fs.promises.readFile(projectPath, "utf8")
        sourcePath = projectPath
      } else if (fs.existsSync(globalPath)) {
        content = await fs.promises.readFile(globalPath, "utf8")
        sourcePath = globalPath
      } else if (fs.existsSync(packagePath)) {
        content = await fs.promises.readFile(packagePath, "utf8")
        sourcePath = packagePath
      } else {
        console.warn(`Failed to find instruction file: ${file}`)
        return ""
      }
    } catch (error) {
      console.warn(`Failed to read instruction file: ${sourcePath}`)
      return ""
    }

    // Process content with interpolateTemplate
    return interpolateTemplate(content, context)
  }))

  return sections.filter(Boolean)
}

export function addCustomInstructions(instructions: string): string {
  if (!instructions || !instructions.trim()) {
    return '';
  }
  return `\n\nCUSTOM INSTRUCTIONS\n\n${instructions}`;
}

export const SYSTEM_PROMPT = async (
  cwd: string,
  supportsComputerUse: boolean,
  projectConfig?: SystemConfig,
  customInstructions?: string
): Promise<string> => {
  // Get enabled optional tools
  const enabledOptionalTools = projectConfig?.enabledTools
    ? OPTIONAL_TOOLS.filter(tool => {
        const key = tool as keyof EnabledTools;
        return projectConfig.enabledTools && projectConfig.enabledTools[key];
      })
    : OPTIONAL_TOOLS;

  // Combine always enabled tools with enabled optional tools
  const enabledTools = [...ALWAYS_ENABLED_TOOLS, ...enabledOptionalTools] as ToolUseName[];

  // Get all tools and filter based on enabled tools
  const toolsSection = supportsComputerUse 
    ? getAllTools(cwd, true, enabledTools)
    : "";

  // Create context for template interpolation
  const context = {
    cwd,
    operatingSystem: osName(),
    shell: projectConfig?.shellOverride || defaultShell,
    homeDir: os.homedir().toPosix(),
    TOOL_USE_FORMATTING,
    CAPABILITIES: CAPABILITIES(cwd, supportsComputerUse, projectConfig)
  };

  // Load template sections
  const templateSections = await loadInstructionFiles(cwd, context);
    
  const sections = [
    // Load template sections
    ...templateSections,
    "====",

    // Tool Framework (kept in code)
    "TOOL FRAMEWORK",
    "# Core Principles",
    TOOL_USE_FORMATTING,
    "# Available Tools",
    CAPABILITIES(cwd, supportsComputerUse, projectConfig),
    "# Tool Documentation",
    ...(toolsSection ? [toolsSection] : [])
  ];

  const finalPrompt = sections.filter(Boolean).join("\n\n");
  return customInstructions ? finalPrompt + addCustomInstructions(customInstructions) : finalPrompt;
};
