/**
 * Configuration for optional tools
 */
export interface EnabledTools {
  browser_action?: boolean;
  edit_code_symbols?: boolean;
  edit_go_symbols?: boolean;
  get_go_symbols?: boolean;
  get_code_symbols?: boolean;
  edit_json?: boolean;
}

/**
 * Configuration for a Cline project
 */
export interface ProjectConfig {
  /**
   * Optional tools configuration
   */
  enabledTools?: EnabledTools;

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
