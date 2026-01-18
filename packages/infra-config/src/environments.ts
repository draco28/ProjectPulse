import type { Environment } from './schema.js';

/**
 * Environment presets with sensible defaults for each deployment target
 *
 * dev: Local development (most common)
 * prod-local: Production running locally via Docker (Mac mini)
 * prod-public: Public-facing production with custom domains
 * test: Test runner environment
 * ci: Continuous integration environment
 */
export const ENVIRONMENT_PRESETS: Record<Environment, {
  webUrl: string;
  webPort: number;
  mcpUrl: string;
  mcpPort: number;
  databaseUrl: string;
  isProduction: boolean;
  isCI: boolean;
}> = {
  dev: {
    webUrl: 'http://localhost:3000',
    webPort: 3000,
    mcpUrl: 'http://localhost:3001',
    mcpPort: 3001,
    databaseUrl: 'postgresql://postgres:postgres123@localhost:5432/projectpulse_dev',
    isProduction: false,
    isCI: false,
  },
  'prod-local': {
    webUrl: 'http://localhost:8080',
    webPort: 8080,
    mcpUrl: 'http://localhost:8081',
    mcpPort: 8081,
    databaseUrl: 'postgresql://projectpulse:changeme@localhost:5433/projectpulse_prod',
    isProduction: true,
    isCI: false,
  },
  'prod-public': {
    webUrl: 'https://projectpulse.dracodev.dev',
    webPort: 443,
    mcpUrl: 'https://projectpulsemcp.dracodev.dev',
    mcpPort: 443,
    databaseUrl: '', // Must be provided via env var
    isProduction: true,
    isCI: false,
  },
  test: {
    webUrl: 'http://localhost:3000',
    webPort: 3000,
    mcpUrl: 'http://localhost:3001',
    mcpPort: 3001,
    databaseUrl: 'postgresql://postgres:postgres123@localhost:5432/projectpulse_test',
    isProduction: false,
    isCI: false,
  },
  ci: {
    webUrl: 'http://localhost:3000',
    webPort: 3000,
    mcpUrl: 'http://localhost:3001',
    mcpPort: 3001,
    databaseUrl: 'postgresql://postgres:postgres123@localhost:5432/projectpulse_test',
    isProduction: false,
    isCI: true,
  },
};
