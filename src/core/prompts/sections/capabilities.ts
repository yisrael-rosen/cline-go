import { ProjectConfig } from '../../../shared/types/project-config';
import { generateCapabilities } from './tool-capabilities';
import { ToolUseName } from '../../../shared/ExtensionMessage';

export const CAPABILITIES = (cwd: string, supportsComputerUse: boolean, config?: ProjectConfig): string => {
  // Get enabled tools from config
  const enabledTools = config?.enabledTools
    ? Object.entries(config.enabledTools)
        .filter(([_, enabled]) => enabled)
        .map(([tool]) => tool as ToolUseName)
    : [];

  // Generate capabilities based on enabled tools
  return generateCapabilities(cwd, enabledTools, config?.toolCapabilities || {});
};
