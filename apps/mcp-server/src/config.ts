import { z } from 'zod';

/**
 * Parse comma-separated origins from environment variable
 * @param value - Comma-separated list of origins (e.g., "https://example.com,http://localhost:3000")
 * @returns Array of trimmed, non-empty origin strings
 */
function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value || value.trim() === '') return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

const envSchema = z.object({
  apiBaseUrl: z
    .string()
    .url()
    .default('http://localhost:3000')
    .transform((value) => value.replace(/\/$/, '')), // normalize trailing slash
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  mcpPort: z.number().int().positive().default(3001),
  // Sprint 17 / Phase 1: HMAC secret for internal service auth (Ticket #129)
  mcpInternalSecret: z.string().min(32).optional(),
  // Ticket #125: CORS restriction - allowed origins in production
  allowedOrigins: z.array(z.string()).default([]),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
});

export type AppConfig = z.infer<typeof envSchema>;

type LoadConfigInput = {
  apiBaseUrl?: string;
  logLevel?: string;
  mcpPort?: number;
  mcpInternalSecret?: string;
  allowedOrigins?: string[];
  nodeEnv?: string;
};

export const loadConfig = (input: LoadConfigInput = {}): AppConfig =>
  envSchema.parse({
    apiBaseUrl:
      input.apiBaseUrl ??
      process.env.PROJECTPULSE_API_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000',
    logLevel: (input.logLevel ?? process.env.MCP_LOG_LEVEL ?? 'info').toLowerCase(),
    mcpPort: input.mcpPort ?? parseInt(process.env.MCP_PORT || '3001', 10),
    mcpInternalSecret: input.mcpInternalSecret ?? process.env.MCP_INTERNAL_SECRET,
    // Ticket #125: CORS restriction
    allowedOrigins: input.allowedOrigins ?? parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
    nodeEnv: input.nodeEnv ?? process.env.NODE_ENV ?? 'development',
  });

export const config = loadConfig();
