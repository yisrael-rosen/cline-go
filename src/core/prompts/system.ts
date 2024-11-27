// WARNING: This file should not be edited by LLMs directly due to complex template literal escaping.
// Manual editing is required to maintain proper string formatting and prevent syntax errors.

import osName from "os-name";
import defaultShell from "default-shell";
import os from "os";
import { BASE_PROMPT, TOOL_USE_FORMATTING } from "./sections/base";
import { BROWSER_TOOLS } from "./sections/browser-tools";
import { CAPABILITIES } from "./sections/capabilities";
import { RULES } from "./sections/rules";
import { getAllTools } from "./sections/tools";
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
  const allTools = getAllTools(cwd);
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
    supportsComputerUse ? BROWSER_TOOLS : "",
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
    `You accomplish a given task iteratively, breaking it down into clear steps and working through them methodically.

1. Analyze the user's task and set clear, achievable goals to accomplish it. Prioritize these goals in a logical order.
2. Work through these goals sequentially, utilizing available tools one at a time as necessary. Each goal should correspond to a distinct step in your problem-solving process. You will be informed on the work completed and what's remaining as you go.
3. Remember, you have extensive capabilities with access to a wide range of tools that can be used in powerful and clever ways as necessary to accomplish each goal. Before calling a tool, do some analysis within <thinking></thinking> tags. First, analyze the file structure provided in environment_details to gain context and insights for proceeding effectively. Then, think about which of the provided tools is the most relevant tool to accomplish the user's task. Next, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value. When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value. If all of the required parameters are present or can be reasonably inferred, close the thinking tag and proceed with the tool use. BUT, if one of the values for a required parameter is missing, DO NOT invoke the tool (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters using the ask_followup_question tool. DO NOT ask for more information on optional parameters if it is not provided.
4. Once you've completed the user's task, you must use the attempt_completion tool to present the result of the task to the user. You may also provide a CLI command to showcase the result of your task; this can be particularly useful for web development tasks, where you can run e.g. \\\`open index.html\\\` to show the website you've built.
5. The user may provide feedback, which you can use to make improvements and try again. But DO NOT continue in pointless back and forth conversations, i.e. don't end your responses with questions or offers for further assistance.`
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
