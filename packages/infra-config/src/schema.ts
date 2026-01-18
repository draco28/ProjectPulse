import { z } from 'zod';

/**
 * Environment types supported by ProjectPulse infrastructure
 */
export const EnvironmentEnum = z.enum(['dev', 'prod-local', 'prod-public', 'test', 'ci']);
export type Environment = z.infer<typeof EnvironmentEnum>;

/**
 * Infrastructure configuration schema with validation
 *
 * - webUrl/mcpUrl: Trailing slashes are automatically stripped
 * - Ports default to standard values but can be overridden
 * - databaseUrl must be a valid Prisma DSN
 */
export const InfraConfigSchema = z.object({
  env: EnvironmentEnum,
  webUrl: z.string().url().transform(v => v.replace(/\/$/, '')),
  webPort: z.number().int().positive().default(3000),
  mcpUrl: z.string().url().transform(v => v.replace(/\/$/, '')),
  mcpPort: z.number().int().positive().default(3001),
  databaseUrl: z.string().min(1),
  isProduction: z.boolean().default(false),
  isCI: z.boolean().default(false),
});

export type InfraConfig = z.infer<typeof InfraConfigSchema>;
