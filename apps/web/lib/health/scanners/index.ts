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
export * from './axecore';
export * from './lighthouse';

import { ScannerType } from '@prisma/client';
import type { Scanner } from './types';
import { createSemgrepScanner } from './semgrep';
import { createESLintScanner } from './eslint';
import { createAxeCoreScanner } from './axecore';
import { createLighthouseScanner } from './lighthouse';

/**
 * Scanner registry - maps scanner types to factory functions
 */
const scannerRegistry = new Map<ScannerType, () => Scanner>([
  [ScannerType.SEMGREP, createSemgrepScanner],
  [ScannerType.ESLINT, createESLintScanner],
  [ScannerType.LIGHTHOUSE, createLighthouseScanner],
  [ScannerType.AXECORE, createAxeCoreScanner],
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
