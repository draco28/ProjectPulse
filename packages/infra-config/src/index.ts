/**
 * @projectpulse/infra-config
 *
 * Centralized infrastructure configuration for ProjectPulse
 *
 * @example
 * ```typescript
 * import { config } from '@projectpulse/infra-config';
 *
 * console.log(config.webUrl);  // 'http://localhost:3000'
 * console.log(config.mcpUrl);  // 'http://localhost:3001'
 * console.log(config.env);     // 'dev'
 * ```
 *
 * @example Override environment
 * ```typescript
 * import { getConfig } from '@projectpulse/infra-config';
 *
 * const testConfig = getConfig('test');
 * console.log(testConfig.databaseUrl);  // '...projectpulse_test'
 * ```
 */
export { getConfig, config } from './config.js';
export { ENVIRONMENT_PRESETS } from './environments.js';
export { InfraConfigSchema, EnvironmentEnum, type InfraConfig, type Environment } from './schema.js';
export { stripTrailingSlash, joinUrl, getPortFromUrl } from './helpers.js';
