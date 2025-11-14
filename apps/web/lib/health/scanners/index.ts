/**
 * Health monitoring scanners - Central exports
 * Sprint 7 Day 8-9 - Health Scanner Foundation
 * Updated Day 10 - Added accessibility scanners
 *
 * This module provides a unified interface for all scanner implementations.
 */

export * from './types';
export * from './semgrep';
export * from './eslint';
// Note: axecore and lighthouse are NOT exported here to avoid importing
// browser dependencies (Playwright, Chrome) in Next.js server environment.
// They are loaded dynamically in getScanner() when needed.

import { ScannerType } from '@prisma/client';
import type { Scanner } from './types';
import { createSemgrepScanner } from './semgrep';
import { createESLintScanner } from './eslint';

/**
 * Scanner registry - maps scanner types to lazy-loaded factory functions
 * Browser-based scanners (AXECORE, LIGHTHOUSE) use dynamic imports to avoid
 * loading Playwright/Chrome dependencies in Next.js server environment.
 */
const scannerRegistry = new Map<ScannerType, () => Scanner | Promise<Scanner>>([
  [ScannerType.SEMGREP, createSemgrepScanner],
  [ScannerType.ESLINT, createESLintScanner],
  [
    ScannerType.LIGHTHOUSE,
    async () => {
      const { createLighthouseScanner } = await import('./lighthouse');
      return createLighthouseScanner();
    },
  ],
  [
    ScannerType.AXECORE,
    async () => {
      const { createAxeCoreScanner } = await import('./axecore');
      return createAxeCoreScanner();
    },
  ],
]);

/**
 * Get scanner instance by type
 *
 * @param type - Scanner type enum
 * @returns Scanner instance (or Promise for browser-based scanners)
 * @throws Error if scanner type is not registered
 */
export async function getScanner(type: ScannerType): Promise<Scanner> {
  const factory = scannerRegistry.get(type);

  if (!factory) {
    throw new Error(`Scanner type ${type} is not registered`);
  }

  const result = factory();
  return result instanceof Promise ? await result : result;
}

/**
 * Get all available scanner types
 */
export function getAvailableScanners(): ScannerType[] {
  return Array.from(scannerRegistry.keys());
}

/**
 * Check if scanner type is registered
 */
export function isScannerAvailable(type: ScannerType): boolean {
  return scannerRegistry.has(type);
}
