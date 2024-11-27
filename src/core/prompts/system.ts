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

export interface ProjectConfig {
  // Project-specific configurations
  name: string;
  customInstructions?: string;
  enabledTools?: ToolUseName[];
  projectSpecificPrompts?: Record<string, string>;
}

export const addCustomInstructions = (customInstructions: string): string => {
  return `
====

USER'S CUSTOM INSTRUCTIONS

The following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.

${customInstructions.trim()}`;
};

export const SYSTEM_PROMPT = async (
  cwd: string,
  supportsComputerUse: boolean,
  projectConfig?: ProjectConfig
): Promise<string> => {
  // Get all tools and filter based on enabled tools
  const allTools = getAllTools(cwd, supportsComputerUse);
  const toolsSection = projectConfig?.enabledTools 
    ? allTools
        .split("\n\n")
        .filter(section => {
          const toolMatch = section.match(/^## ([a-z_]+)/);
          return !toolMatch || projectConfig.enabledTools?.includes(toolMatch[1] as ToolUseName);
        })
        .join("\n\n")
    : allTools;

  const sections = [
    BASE_PROMPT,
    "====",
    "TOOL USE",
    TOOL_USE_FORMATTING,
    toolsSection,
    "====",
    "CAPABILITIES",
    CAPABILITIES(cwd, supportsComputerUse),
    "====",
    "RULES",
    RULES(cwd),
    "====",
    "SYSTEM INFORMATION",
    `Operating System: ${osName()}
Default Shell: ${defaultShell}
Home Directory: ${os.homedir().toPosix()}
Current Working Directory: ${cwd.toPosix()}`,
    "====",
    "OBJECTIVE",
    OBJECTIVE
  ];

  // Add project-specific sections if configured
  if (projectConfig?.customInstructions) {
    sections.push(
      "====",
      "USER'S CUSTOM INSTRUCTIONS",
      projectConfig.customInstructions
    );
  }

  return sections.filter(Boolean).join("\n\n");
};
