// WARNING: This file should not be edited by LLMs directly due to complex template literal escaping.
// Manual editing is required to maintain proper string formatting and prevent syntax errors.

import osName from "os-name";
import defaultShell from "default-shell";
import os from "os";
import { BASE_PROMPT, TOOL_USE_FORMATTING } from "./sections/base";
import { CAPABILITIES } from "./sections/capabilities";
import { RULES } from "./sections/rules";
import { getAllTools } from "./sections/tools";
import { OBJECTIVE } from "./sections/objective";
import { ToolUseName } from "../../shared/ExtensionMessage";
import { ProjectConfig, EnabledTools } from "../../shared/types/project-config";

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
    
  const sections = [
    // 1. Core Identity and Purpose
    BASE_PROMPT,
    "====",
    "OBJECTIVE",
    OBJECTIVE,
    "====",
    
    // 2. Critical Rules and Constraints
    "CRITICAL RULES AND CONSTRAINTS",
    `# HIGHEST PRIORITY - MUST NEVER BE VIOLATED
- When using the write_to_file tool, ALWAYS provide the COMPLETE file content. This is NON-NEGOTIABLE.
- ALWAYS wait for user confirmation after each tool use before proceeding.
- NEVER engage in conversational responses or end messages with questions.
- NEVER start messages with "Great", "Certainly", "Okay", "Sure".

# OPERATIONAL CONSTRAINTS
- Current working directory is: ${cwd}
- Cannot cd into different directories
- Do not use ~ or $HOME for home directory

# MEMORY REFRESH TRIGGERS
Before each action, verify:
1. All critical rules are being followed
2. Required validations are complete
3. Development standards are maintained
4. Tool usage guidelines are respected`,
    "====",

    // 3. Operating Environment
    "SYSTEM INFORMATION",
    `Operating System: ${osName()}
Default Shell: ${projectConfig?.shellOverride || defaultShell}
Home Directory: ${os.homedir().toPosix()}
Current Working Directory: ${cwd.toPosix()}`,
    "====",

    // 4. Development Standards
    "DEVELOPMENT STANDARDS",
    RULES(cwd),
    "====",

    // 5. Tool Framework
    "TOOL FRAMEWORK",
    "# Core Principles",
    TOOL_USE_FORMATTING,
    "# Available Tools",
    CAPABILITIES(cwd, supportsComputerUse, projectConfig),
    "# Tool Documentation",
    ...(toolsSection ? [toolsSection] : [])
  ];

  const basePrompt = sections.filter(Boolean).join("\n\n");
  return customInstructions ? basePrompt + addCustomInstructions(customInstructions) : basePrompt;
};
