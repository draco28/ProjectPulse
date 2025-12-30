import { z } from 'zod';

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
});

export type AppConfig = z.infer<typeof envSchema>;

type LoadConfigInput = {
  apiBaseUrl?: string;
  logLevel?: string;
  mcpPort?: number;
  mcpInternalSecret?: string;
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
  });

export const config = loadConfig();
