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
import { TemplateConfig, TemplateManager } from "./templates";

export interface ProjectConfig {
  // Project-specific configurations
  name: string;
  customInstructions?: string;
  enabledTools?: ToolUseName[];
  projectSpecificPrompts?: Record<string, string>;
  templateConfig?: TemplateConfig;
  shellOverride?: string; // New option to override detected shell
}

export const addCustomInstructions = (customInstructions: string): string => {
  return `
====

CUSTOM INSTRUCTIONS

${customInstructions.trim()}`;
};

export const SYSTEM_PROMPT = async (
  cwd: string,
  supportsComputerUse: boolean,
  projectConfig?: ProjectConfig
): Promise<string> => {
  // Get all tools and filter based on enabled tools
  const allTools = getAllTools(cwd, supportsComputerUse);
  const toolsSection = projectConfig?.enabledTools !== undefined
  ? allTools
      .split("\n\n")
      .filter(section => {
        const toolMatch = section.match(/^## ([a-z_]+)/);
        return !toolMatch || projectConfig.enabledTools?.includes(toolMatch[1] as ToolUseName);
      })
      .join("\n\n")
  : "";
    
  const sections = [
    BASE_PROMPT,
    "====",
    "TOOL USE",
    TOOL_USE_FORMATTING,
    ...(toolsSection ? [toolsSection] : []), // Only include if not empty
    "====",
    "CAPABILITIES",
    CAPABILITIES(cwd, supportsComputerUse),
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

  /* // Initialize template manager if template config exists
  const templateManager = projectConfig?.templateConfig 
    ? new TemplateManager(projectConfig.templateConfig)
    : undefined;

  // Add active template content if available
  const activeTemplate = templateManager?.getActiveTemplate();
  if (activeTemplate?.content) {
    sections.push(
      "====",
      `TEMPLATE: ${activeTemplate.name}`,
      activeTemplate.content
    );
  } */

/*   // Add project-specific custom instructions if configured
  // This is kept separate from templates to maintain backward compatibility
  if (projectConfig?.customInstructions) {
    sections.push(
      "====",
      "CUSTOM INSTRUCTIONS",
      projectConfig.customInstructions
    );
  } */

/*   // Add project-specific prompts if configured
  if (projectConfig?.projectSpecificPrompts) {
    Object.entries(projectConfig.projectSpecificPrompts).forEach(([key, value]) => {
      sections.push(
        "====",
        key.toUpperCase(),
        value
      );
    });
  }
 */
  return sections.filter(Boolean).join("\n\n");
};
