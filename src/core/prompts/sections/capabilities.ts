import { ProjectConfig } from '../../../shared/types/project-config';
import { generateCapabilities } from './tool-capabilities';

export const CAPABILITIES = (cwd: string, _supportsComputerUse: boolean, config?: ProjectConfig): string => {
  const enabledTools = config?.enabledTools || [];
  return generateCapabilities(cwd, enabledTools, config?.toolCapabilities || {});
};
