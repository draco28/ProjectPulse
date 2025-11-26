/**
 * Playwright Global Teardown
 *
 * Runs once after all tests complete to clean up authentication artifacts.
 * Removes the .auth/user.json file to ensure clean state for next run.
 *
 * Usage:
 * Configure in playwright.config.ts:
 *   globalTeardown: require.resolve('./tests/setup/global-teardown.ts')
 */

import fs from 'fs';
import path from 'path';

async function globalTeardown() {
  console.log('🧹 Global Teardown: Cleaning up authentication state...');

  const storageStatePath = path.join(process.cwd(), '.auth', 'user.json');

  try {
    if (fs.existsSync(storageStatePath)) {
      fs.unlinkSync(storageStatePath);
      console.log(`🗑️  Removed auth state file: ${storageStatePath}`);
    } else {
      console.log('ℹ️  No auth state file to remove');
    }
  } catch (error) {
    console.error('⚠️  Failed to remove auth state file:', error);
    // Don't throw - this is cleanup, not critical
  }

  console.log('✅ Global teardown complete!\n');
}

export default globalTeardown;
