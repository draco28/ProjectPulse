/**
 * Test Helper Utilities
 *
 * Shared utilities for MCP E2E tests including logging, assertions,
 * and common test operations.
 */

/**
 * Pretty print test progress with emoji status indicators
 */
export function logTestStep(step: string, status: 'start' | 'success' | 'error' = 'start'): void {
  const icons = {
    start: '▶️',
    success: '✅',
    error: '❌',
  };

  const colors = {
    start: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
  };

  const reset = '\x1b[0m';

  console.log(`${colors[status]}${icons[status]} ${step}${reset}`);
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Assert that two values are equal (deep equality for objects)
 */
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);

  if (actualStr !== expectedStr) {
    throw new Error(
      message ||
        `Assertion failed:\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`
    );
  }
}

/**
 * Assert that a value is greater than or equal to a minimum
 */
export function assertGreaterThanOrEqual(
  actual: number,
  min: number,
  message?: string
): void {
  if (actual < min) {
    throw new Error(
      message || `Expected ${actual} to be >= ${min}`
    );
  }
}

/**
 * Assert that a value is within a range (inclusive)
 */
export function assertInRange(
  actual: number,
  min: number,
  max: number,
  message?: string
): void {
  if (actual < min || actual > max) {
    throw new Error(
      message || `Expected ${actual} to be between ${min} and ${max}`
    );
  }
}

/**
 * Assert that a string contains a substring
 */
export function assertContains(
  haystack: string,
  needle: string,
  message?: string
): void {
  if (!haystack.includes(needle)) {
    throw new Error(
      message || `Expected string to contain "${needle}":\n${haystack}`
    );
  }
}

/**
 * Wait for a specified duration (for rate limiting or delays)
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(
          `Attempt ${attempt} failed, retrying in ${delayMs}ms...`
        );
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Count words in a string
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Validate that all required keys exist in an object
 */
export function assertHasKeys<T extends Record<string, any>>(
  obj: T,
  requiredKeys: string[],
  message?: string
): void {
  const missingKeys = requiredKeys.filter((key) => !(key in obj));

  if (missingKeys.length > 0) {
    throw new Error(
      message ||
        `Missing required keys: ${missingKeys.join(', ')}\nAvailable keys: ${Object.keys(obj).join(', ')}`
    );
  }
}

/**
 * Test execution timer
 */
export class TestTimer {
  private startTime: number;
  private endTime?: number;

  constructor() {
    this.startTime = Date.now();
  }

  stop(): void {
    this.endTime = Date.now();
  }

  getDuration(): number {
    const end = this.endTime || Date.now();
    return end - this.startTime;
  }

  format(): string {
    return formatDuration(this.getDuration());
  }
}

/**
 * Test result tracker
 */
export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: Error;
}

export class TestResults {
  private results: TestResult[] = [];

  add(result: TestResult): void {
    this.results.push(result);
  }

  getAll(): TestResult[] {
    return [...this.results];
  }

  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    totalDuration: number;
  } {
    return {
      total: this.results.length,
      passed: this.results.filter((r) => r.status === 'passed').length,
      failed: this.results.filter((r) => r.status === 'failed').length,
      skipped: this.results.filter((r) => r.status === 'skipped').length,
      totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
    };
  }

  print(): void {
    console.log('\n=== Test Results ===\n');

    for (const result of this.results) {
      const icon =
        result.status === 'passed'
          ? '✅'
          : result.status === 'failed'
          ? '❌'
          : '⏭️';
      console.log(
        `${icon} ${result.testName} (${formatDuration(result.duration)})`
      );

      if (result.error) {
        console.log(`   Error: ${result.error.message}`);
      }
    }

    const summary = this.getSummary();
    console.log('\n=== Summary ===');
    console.log(`Total: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Skipped: ${summary.skipped}`);
    console.log(`Duration: ${formatDuration(summary.totalDuration)}`);
  }
}
