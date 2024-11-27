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
}
