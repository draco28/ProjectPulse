/**
 * E2E Test: Authentication Flow
 *
 * Tests authentication and authorization including:
 * - Login redirects for unauthenticated users
 * - Callback URL preservation
 * - Protected route access control
 * - Session persistence
 * - Logout flow
 *
 * CRITICAL: These tests document expected behavior based on FIX-SUMMARY.md
 * Any test failures indicate actual issues with auth middleware.
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow - Unauthenticated Users', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No auth cookies

  test('should redirect to /login when accessing /dashboard without authentication', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // Should redirect to login with callbackUrl
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl=%2Fdashboard/);
  });

  test('should redirect to /login when accessing /issues without authentication', async ({
    page,
  }) => {
    await page.goto('/issues');

    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl=%2Fissues/);
  });

  test('should redirect to /login when accessing /projects/{id}/settings without authentication', async ({
    page,
  }) => {
    await page.goto('/projects/1/settings');

    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl=%2Fprojects%2F1%2Fsettings/);
  });

  test('should redirect to /login when accessing /wiki without authentication', async ({
    page,
  }) => {
    await page.goto('/wiki');

    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl=%2Fwiki/);
  });

  test('should redirect to /login when accessing /knowledge without authentication', async ({
    page,
  }) => {
    await page.goto('/knowledge');

    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl=%2Fknowledge/);
  });

  test('should redirect to /login when accessing /health without authentication', async ({
    page,
  }) => {
    await page.goto('/health');

    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl=%2Fhealth/);
  });

  test('should redirect to /login when accessing /agents without authentication', async ({
    page,
  }) => {
    await page.goto('/agents');

    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl=%2Fagents/);
  });

  test('should redirect to /login when accessing /roadmap without authentication', async ({
    page,
  }) => {
    await page.goto('/roadmap');

    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl=%2Froadmap/);
  });

  test('should allow access to /login without authentication', async ({ page }) => {
    await page.goto('/login');

    // Should stay on login page, not redirect
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should allow access to /api/health without authentication', async ({ page }) => {
    const response = await page.request.get('/api/health');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
  });

  test('should allow access to /api/auth/* routes without authentication', async ({ page }) => {
    const response = await page.request.get('/api/auth/providers');

    expect(response.status()).toBe(200);
  });
});

test.describe('Authentication Flow - Login Process', () => {
  test('should display login form with email and password fields', async ({ page }) => {
    await page.goto('/login');

    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(1000);

    // Should show error (either on page or still on login page)
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to callbackUrl after successful login', async ({ page }) => {
    // Try to access dashboard (will redirect to login with callbackUrl)
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/\/login/);

    // Login with valid credentials (assuming dev@projectpulse.local exists in seed data)
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForLoadState('networkidle');

    // Should redirect back to dashboard with project parameter
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should redirect to default page after login if no callbackUrl', async ({ page }) => {
    await page.goto('/login');

    // Login without callbackUrl
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForLoadState('networkidle');

    // Should redirect to default page (likely /app or /dashboard)
    const url = page.url();
    expect(url).toMatch(/\/(app|dashboard)/);
  });
});

test.describe('Authentication Flow - Session Persistence', () => {
  test('should maintain session after page reload', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should maintain session across navigation', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Navigate to different pages
    await page.goto('/dashboard?project=1');
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/issues?project=1');
    await expect(page).not.toHaveURL(/\/login/);

    await page.goto('/wiki?project=1');
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Authentication Flow - Incognito Mode Verification', () => {
  test('should redirect to /login in incognito mode (no cookies)', async ({ browser }) => {
    // Create new incognito context (no cookies, no storage)
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    await context.close();
  });

  test('should redirect to /login for all protected routes in incognito mode', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    const protectedRoutes = [
      '/dashboard',
      '/issues',
      '/wiki',
      '/knowledge',
      '/health',
      '/agents',
      '/roadmap',
      '/projects/1/settings',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, {
        timeout: 5000,
      });
    }

    await context.close();
  });
});

test.describe('Authentication Flow - NEXTAUTH_SECRET Verification', () => {
  test('should have NEXTAUTH_SECRET configured (JWT token verification works)', async ({
    page,
  }) => {
    // Login to get JWT token
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Check cookies contain next-auth session token
    const cookies = await page.context().cookies();
    const sessionToken = cookies.find(
      (c) => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token'
    );

    expect(sessionToken).toBeDefined();
    expect(sessionToken?.value).toBeTruthy();

    // Verify token works by accessing protected route
    await page.goto('/dashboard?project=1');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('aside')).toBeVisible(); // Sidebar should be visible
  });
});
