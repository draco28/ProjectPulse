import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',

  /* Global setup: Login once before all tests */
  globalSetup: require.resolve('./tests/setup/global-setup.ts'),

  /* Global teardown: Clean up auth state after all tests */
  globalTeardown: require.resolve('./tests/setup/global-teardown.ts'),

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`.
     * Default: Docker container on Mac mini (http://192.168.1.15:3000)
     * Override: Set BASE_URL environment variable for CI/CD or other environments
     */
    baseURL: process.env.BASE_URL || 'http://192.168.1.15:3000',

    /* Use saved authentication state for all tests */
    storageState: '.auth/user.json',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Docker-first architecture: Tests always run against Docker container
   * No local dev server needed - Docker container is always available
   * CI/CD: Override BASE_URL for GitHub Actions or other CI environments
   */
  // webServer: undefined (Docker container always running, no local dev server needed)
});
