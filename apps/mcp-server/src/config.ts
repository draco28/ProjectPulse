import { z } from 'zod';

const envSchema = z.object({
  apiBaseUrl: z
    .string()
    .url()
    .default('http://localhost:3000')
    .transform((value) => value.replace(/\/$/, '')), // normalize trailing slash
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type AppConfig = z.infer<typeof envSchema>;

type LoadConfigInput = {
  apiBaseUrl?: string;
  logLevel?: string;
};

export const loadConfig = (input: LoadConfigInput = {}): AppConfig =>
  envSchema.parse({
    apiBaseUrl:
      input.apiBaseUrl ??
      process.env.PROJECTPULSE_API_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000',
    logLevel: (input.logLevel ?? process.env.MCP_LOG_LEVEL ?? 'info').toLowerCase(),
  });

export const config = loadConfig();
