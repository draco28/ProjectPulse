/**
 * Playwright Global Setup
 *
 * Runs once before all tests to establish authentication.
 * Logs in and saves session state to .auth/user.json for all tests to reuse.
 *
 * Benefits:
 * - 40x faster than logging in for each test
 * - Industry best practice for Playwright authentication
 * - Single source of truth for test authentication
 *
 * Usage:
 * Configure in playwright.config.ts:
 *   globalSetup: require.resolve('./tests/setup/global-setup.ts')
 */

import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🔐 Global Setup: Logging in and saving authentication state...');

  const baseURL =
    (config.projects?.[0]?.use as { baseURL?: string })?.baseURL || 'http://192.168.1.15:3000';
  const storageStatePath = path.join(process.cwd(), '.auth', 'user.json');

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    console.log('📍 Navigated to login page');

    // Wait for page to be fully loaded (client-side React)
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#email', { timeout: 10000 });

    // Fill in credentials (from seed data)
    await page.fill('#email', 'dev@projectpulse.local');
    await page.fill('#password', 'dev123456');
    console.log('📝 Filled in credentials');

    // Click submit button and wait for navigation
    // NextAuth client-side signIn() will redirect to /app on success
    await page.click('button[type="submit"]');
    console.log('🚀 Submitted login form');

    // Wait for either /app (success) or error message (failure)
    try {
      await page.waitForURL(`${baseURL}/app`, { timeout: 15000 });
      console.log('✅ Login successful, redirected to /app');
    } catch (navError) {
      // Check if there's an error message on the page
      const errorText = await page.textContent('body');
      throw new Error(
        `❌ Login failed! Current URL: ${page.url()}\nPage content: ${errorText?.substring(0, 200)}`
      );
    }

    // Save authentication state to file
    await context.storageState({ path: storageStatePath });
    console.log(`💾 Saved auth state to ${storageStatePath}`);

    // Verify session cookie exists
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token'
    );

    if (!sessionCookie) {
      throw new Error('❌ Session cookie not found after login!');
    }

    console.log('✅ Session cookie verified');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('✅ Global setup complete! All tests will use saved session.\n');
}

export default globalSetup;
