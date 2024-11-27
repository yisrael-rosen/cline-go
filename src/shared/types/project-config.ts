/**
 * Configuration for a Cline project
 */
export interface ProjectConfig {
  /**
   * List of enabled tool names
   */
  enabledTools?: string[];

  /**
   * Custom instructions to be added to the system prompt
   */
  customInstructions?: string;

  /**
   * Custom tool capabilities descriptions
   */
  toolCapabilities?: {
    [toolName: string]: {
      description?: string;
      examples?: string[];
      notes?: string[];
    };
  };
}

/**
 * Base structure for tool capabilities
 */
export interface ToolCapability {
  description: string;
  examples?: string[];
  notes?: string[];
}

/**
 * Map of default tool capabilities
 */
export interface ToolCapabilitiesMap {
  [toolName: string]: ToolCapability;
}
