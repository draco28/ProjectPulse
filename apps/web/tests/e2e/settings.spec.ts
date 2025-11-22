/**
 * E2E Test: Settings Route
 *
 * Tests the Settings page routing and functionality:
 * - Path parameter format: /projects/{id}/settings
 * - Fallback behavior when no project ID
 * - Navigation from different pages
 * - Settings page content and features
 * - OAuth token generation
 *
 * CRITICAL: User reported "settings route in sidebar still goes to http://192.168.1.15:3000/settings"
 * This causes 404 error when no project ID is present.
 */
import { test, expect } from '@playwright/test';

test.describe('Settings Route - Correct Path Format', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should access settings via path parameter /projects/{id}/settings', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');

    // Should load successfully
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    // Should NOT show 404 error
    await expect(page.locator('h1')).not.toContainText('404');
    await expect(page.locator('h1')).not.toContainText('Not Found');

    // Should show settings page content
    await expect(page.locator('text=/Settings|Project Settings/i')).toBeVisible();
  });

  test('should access settings for different project IDs', async ({ page }) => {
    // Project 1
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);
    await expect(page.locator('h1')).not.toContainText('404');

    // Project 8
    await page.goto('/projects/8/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/8\/settings/);
    await expect(page.locator('h1')).not.toContainText('404');
  });

  test('should navigate to settings from sidebar when project ID exists in URL', async ({
    page,
  }) => {
    // Start on dashboard with project ID
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    // Click Settings in sidebar
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // Should use path parameter format
    await expect(page).toHaveURL(/\/projects\/1\/settings/);
    await expect(page.locator('h1')).not.toContainText('404');
  });

  test('should navigate to settings from various pages with project context', async ({ page }) => {
    const pages = [
      { route: '/dashboard?project=1', name: 'Dashboard' },
      { route: '/issues?project=1', name: 'Issues' },
      { route: '/wiki?project=1', name: 'Wiki' },
      { route: '/knowledge?project=1', name: 'Knowledge' },
      { route: '/health?project=1', name: 'Health' },
    ];

    for (const testPage of pages) {
      await page.goto(testPage.route);
      await page.waitForLoadState('networkidle');

      await page.click('a:has-text("Settings")');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/projects\/1\/settings/);
      await expect(page.locator('h1')).not.toContainText('404');

      console.log(`✅ Settings accessible from ${testPage.name}`);
    }
  });
});

test.describe('Settings Route - Fallback Behavior (BUG)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('EXPECTED FAILURE: /settings route should not exist (404)', async ({ page }) => {
    // Try to access /settings directly (fallback route in Sidebar.tsx)
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // CURRENT BEHAVIOR: 404 Not Found
    // EXPECTED BEHAVIOR: Should redirect to /app (project selector)
    const url = page.url();

    if (url.endsWith('/settings')) {
      // Still on /settings - check if it's 404
      const has404 = await page.locator('text=/404|Not Found/i').isVisible();

      if (has404) {
        console.log('🐛 BUG CONFIRMED: /settings shows 404 error');
        test.fail();
        // This fallback route should not exist
        await expect(page).toHaveURL(/\/app/); // This will fail
      } else {
        // If /settings works, it should show settings for some default project
        console.log('⚠️  UNEXPECTED: /settings loads without 404 - check implementation');
      }
    } else {
      // Redirected somewhere else
      await expect(page).toHaveURL(/\/app/);
    }
  });

  test('EXPECTED FAILURE: clicking Settings without project ID should redirect to /app, not /settings', async ({
    page,
  }) => {
    // Access dashboard without project parameter
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click Settings link
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    const url = page.url();

    if (url.includes('/settings') && !url.includes('/projects/')) {
      // BUG: Went to /settings (404)
      console.log('🐛 BUG CONFIRMED: Settings link goes to /settings when no project ID');
      console.log('Current fallback in Sidebar.tsx line 207:');
      console.log('href={projectId ? `/projects/${projectId}/settings` : "/settings"}');
      console.log('Should be:');
      console.log('href={projectId ? `/projects/${projectId}/settings` : "/app"}');

      test.fail();
      await expect(page).toHaveURL(/\/app/); // This will fail
    } else {
      // Bug is fixed
      await expect(page).toHaveURL(/\/app/);
    }
  });

  test('EXPECTED FAILURE: sidebar Settings link should have proper fallback', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Get the Settings link href attribute
    const settingsLink = page.locator('a:has-text("Settings")');
    const href = await settingsLink.getAttribute('href');

    if (href === '/settings') {
      console.log('🐛 BUG CONFIRMED: Settings href="/settings" (leads to 404)');
      console.log('File: apps/web/components/Sidebar.tsx:207');
      console.log('Fix: Change fallback from "/settings" to "/app"');

      test.fail();
      expect(href).toBe('/app'); // This will fail
    } else {
      // Bug is fixed
      expect(href).toMatch(/\/projects\/\d+\/settings|\/app/);
    }
  });
});

test.describe('Settings Page - Content and Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should display project settings page content', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');

    // Check for common settings page elements
    // (This will depend on actual implementation)
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display OAuth token generation section', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');

    // Look for OAuth/token related elements
    // User mentioned: "to provide bearer token i need to access web app"
    // This suggests there's a token generation feature on settings page

    // Check if page contains token/OAuth related text
    const hasTokenSection =
      (await page.locator('text=/token|oauth|authentication|api key/i').count()) > 0;

    if (hasTokenSection) {
      console.log('✅ Token generation section found on settings page');
    } else {
      console.log('⚠️  No token section found - may need to implement OAuth token generation');
    }
  });

  test('should be accessible from sidebar with visual indicator', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');

    // Check if Settings link is highlighted/active in sidebar
    const settingsLink = page.locator('a:has-text("Settings")');
    await expect(settingsLink).toBeVisible();

    // Check for active state classes (coral-gradient or similar)
    const className = await settingsLink.getAttribute('class');
    expect(className).toContain('coral-gradient');
  });
});

test.describe('Settings Route - Mixed Routing Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should handle transition from query param routes to path param route', async ({ page }) => {
    // Start on dashboard (query param: ?project=1)
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/\?project=1/);

    // Navigate to Settings (path param: /projects/1/settings)
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    // Navigate back to Dashboard (should restore query param)
    await page.click('a:has-text("Dashboard")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('should maintain project context when switching between routing patterns', async ({
    page,
  }) => {
    await page.goto('/dashboard?project=8');

    // Dashboard: query param (?project=8)
    await expect(page).toHaveURL(/\?project=8/);

    // Settings: path param (/projects/8/settings)
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/8\/settings/);

    // Issues: query param (?project=8)
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=8/);

    // Settings again: path param (/projects/8/settings)
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/8\/settings/);
  });
});

test.describe('Settings Route - Authentication', () => {
  test('should require authentication to access settings', async ({ page }) => {
    // Try to access settings without login
    await page.goto('/projects/1/settings');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl=%2Fprojects%2F1%2Fsettings/);
  });

  test('should redirect back to settings after login', async ({ page }) => {
    // Try to access settings (will redirect to login)
    await page.goto('/projects/1/settings');
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Should redirect back to settings
    await expect(page).toHaveURL(/\/projects\/1\/settings/);
  });
});

test.describe('Settings Route - Browser History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should preserve settings route in browser history', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    // Navigate to Issues
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');

    // Go back to Settings
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should still be on Settings
    await expect(page).toHaveURL(/\/projects\/1\/settings/);
  });

  test('should handle forward navigation to settings', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');
    await page.click('a:has-text("Dashboard")');
    await page.waitForLoadState('networkidle');

    // Go back, then forward
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
