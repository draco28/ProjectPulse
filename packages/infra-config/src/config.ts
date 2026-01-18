import { InfraConfigSchema, EnvironmentEnum, type InfraConfig, type Environment } from './schema.js';
import { ENVIRONMENT_PRESETS } from './environments.js';

/**
 * Auto-detect environment based on available signals
 *
 * Priority order:
 * 1. Explicit PROJECTPULSE_ENV
 * 2. CI detection (GITHUB_ACTIONS, CI=true)
 * 3. Test detection (NODE_ENV=test, VITEST, JEST_WORKER_ID)
 * 4. Production detection (NODE_ENV=production)
 * 5. Default to 'dev'
 */
function detectEnvironment(): Environment {
  // 1. Explicit environment
  if (process.env.PROJECTPULSE_ENV) {
    const result = EnvironmentEnum.safeParse(process.env.PROJECTPULSE_ENV);
    if (result.success) return result.data;
  }

  // 2. CI detection
  if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
    return 'ci';
  }

  // 3. Test detection
  if (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.JEST_WORKER_ID) {
    return 'test';
  }

  // 4. Production detection
  if (process.env.NODE_ENV === 'production') {
    // Distinguish between local Docker prod and public prod
    return process.env.PROJECTPULSE_WEB_DOMAIN ? 'prod-public' : 'prod-local';
  }

  // 5. Default
  return 'dev';
}

/**
 * Get configuration for the specified (or detected) environment
 *
 * Environment variable overrides:
 * - PROJECTPULSE_WEB_URL / BASE_URL (legacy)
 * - PROJECTPULSE_MCP_URL / MCP_URL (legacy)
 * - PROJECTPULSE_DATABASE_URL / DATABASE_URL (legacy)
 *
 * @param envOverride - Force a specific environment instead of auto-detecting
 * @returns Validated infrastructure configuration
 * @throws ZodError if configuration is invalid
 */
export function getConfig(envOverride?: Environment): InfraConfig {
  const env = envOverride || detectEnvironment();
  const preset = ENVIRONMENT_PRESETS[env];

  // Prod safety check - warn about potential destructive operations
  if (env === 'prod-public' && !process.env.PROJECTPULSE_ALLOW_PROD_DB) {
    // Only check if there's explicit indication of database usage
    // This prevents accidental prod database modifications
    const stack = new Error().stack || '';
    const hasPrismaUsage = stack.includes('PrismaClient') || stack.includes('@prisma');
    if (hasPrismaUsage) {
      throw new Error(
        'Destructive database operations blocked in prod-public environment. ' +
        'Set PROJECTPULSE_ALLOW_PROD_DB=true to override.'
      );
    }
  }

  return InfraConfigSchema.parse({
    env,
    // Web URL: PROJECTPULSE_WEB_URL > BASE_URL (legacy) > preset
    webUrl: process.env.PROJECTPULSE_WEB_URL || process.env.BASE_URL || preset.webUrl,
    webPort: parseInt(process.env.PROJECTPULSE_WEB_PORT || String(preset.webPort), 10),
    // MCP URL: PROJECTPULSE_MCP_URL > MCP_URL (legacy) > preset
    mcpUrl: process.env.PROJECTPULSE_MCP_URL || process.env.MCP_URL || preset.mcpUrl,
    mcpPort: parseInt(process.env.PROJECTPULSE_MCP_PORT || String(preset.mcpPort), 10),
    // Database URL: PROJECTPULSE_DATABASE_URL > DATABASE_URL (legacy) > preset
    databaseUrl: process.env.PROJECTPULSE_DATABASE_URL || process.env.DATABASE_URL || preset.databaseUrl,
    isProduction: preset.isProduction,
    isCI: preset.isCI,
  });
}

/**
 * Pre-resolved configuration singleton
 * Use this for most cases; use getConfig() when you need to override the environment
 */
export const config = getConfig();
