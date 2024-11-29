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
  'find_references',
  'edit_json'
];

// Optional tools that can be enabled/disabled
const OPTIONAL_TOOLS: ToolUseName[] = [
  'browser_action',
  'edit_code_symbols',
  'edit_go_symbols',
  'get_go_symbols',
  'get_code_symbols'
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
    BASE_PROMPT,
    "====",
    "TOOL USE",
    TOOL_USE_FORMATTING,
    ...(toolsSection ? [toolsSection] : []), // Only include if not empty
    "====",
    "CAPABILITIES",
    CAPABILITIES(cwd, supportsComputerUse, projectConfig),
    "====",
    "RULES",
    RULES(cwd),
    "====",
    "SYSTEM INFORMATION",
    `Operating System: ${osName()}
Default Shell: ${projectConfig?.shellOverride || defaultShell}
Home Directory: ${os.homedir().toPosix()}
Current Working Directory: ${cwd.toPosix()}`,
    "====",
    "OBJECTIVE",
    OBJECTIVE
  ];

  const basePrompt = sections.filter(Boolean).join("\n\n");
  return customInstructions ? basePrompt + addCustomInstructions(customInstructions) : basePrompt;
};
