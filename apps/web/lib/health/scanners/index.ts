/**
 * Health monitoring scanners - Central exports
 * Sprint 7 Day 8-9 - Health Scanner Foundation
 *
 * This module provides a unified interface for all scanner implementations.
 */

export * from './types';
export * from './semgrep';
export * from './eslint';

import { ScannerType } from '@prisma/client';
import type { Scanner } from './types';
import { createSemgrepScanner } from './semgrep';
import { createESLintScanner } from './eslint';

/**
 * Scanner registry - maps scanner types to factory functions
 */
const scannerRegistry = new Map<ScannerType, () => Scanner>([
  [ScannerType.SEMGREP, createSemgrepScanner],
  [ScannerType.ESLINT, createESLintScanner],
  // Future scanners:
  // [ScannerType.LIGHTHOUSE, createLighthouseScanner],
  // [ScannerType.AXECORE, createAxeCoreScanner],
]);

/**
 * Get scanner instance by type
 *
 * @param type - Scanner type enum
 * @returns Scanner instance
 * @throws Error if scanner type is not registered
 */
export function getScanner(type: ScannerType): Scanner {
  const factory = scannerRegistry.get(type);

  if (!factory) {
    throw new Error(`Scanner type ${type} is not registered`);
  }

  return factory();
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
