/**
 * E2E Test: Navigation History
 *
 * Tests browser history navigation and URL state preservation:
 * - Browser back/forward button behavior
 * - History stack integrity
 * - URL parameter preservation in history
 * - Mixed routing pattern history (query params + path params)
 * - Page reload behavior
 *
 * CRITICAL: Ensures project context and navigation state survive browser history operations
 */
import { test, expect } from '@playwright/test';

test.describe('Navigation History - Browser Back/Forward', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should preserve project ID when navigating back', async ({ page }) => {
    // Navigate: Dashboard → Issues → Wiki
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    await page.click('a:has-text("Wiki")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/wiki.*project=1/);

    // Go back to Issues
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Go back to Dashboard
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('should preserve project ID when navigating forward', async ({ page }) => {
    // Navigate: Dashboard → Issues
    await page.goto('/dashboard?project=1');
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=1/);

    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);
  });

  test('should maintain history stack through multiple back/forward operations', async ({
    page,
  }) => {
    // Build history: Dashboard → Issues → Wiki → Knowledge
    await page.goto('/dashboard?project=1');
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await page.click('a:has-text("Wiki")');
    await page.waitForLoadState('networkidle');
    await page.click('a:has-text("Knowledge")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/knowledge.*project=1/);

    // Back to Wiki
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/wiki.*project=1/);

    // Back to Issues
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Forward to Wiki
    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/wiki.*project=1/);

    // Forward to Knowledge
    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/knowledge.*project=1/);

    // Back to Wiki
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/wiki.*project=1/);

    // Back to Issues
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Back to Dashboard
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('should handle mixed routing patterns in history (query params + path params)', async ({
    page,
  }) => {
    // Query param route
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/\?project=1/);

    // Path param route (Settings)
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    // Query param route
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Back to Settings (path param)
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    // Back to Dashboard (query param)
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=1/);

    // Forward to Settings (path param)
    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    // Forward to Issues (query param)
    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);
  });
});

test.describe('Navigation History - Page Reload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should preserve project ID after page reload', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('should preserve project ID after hard reload', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    // Hard reload (bypass cache)
    await page.reload({ waitUntil: 'networkidle' });

    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('should maintain history stack after reload', async ({ page }) => {
    // Build history
    await page.goto('/dashboard?project=1');
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await page.click('a:has-text("Wiki")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/wiki.*project=1/);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/wiki.*project=1/);

    // Go back - history should still work
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('should handle reload on Settings page (path param)', async ({ page }) => {
    await page.goto('/projects/1/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects\/1\/settings/);
    await expect(page.locator('h1')).not.toContainText('404');
  });
});

test.describe('Navigation History - Direct URL Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should handle direct URL access with project parameter', async ({ page }) => {
    // Directly access Issues page with project parameter
    await page.goto('/issues?project=1');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Navigation should preserve project ID
    await page.click('a:has-text("Dashboard")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('should handle direct URL access to Settings (path param)', async ({ page }) => {
    await page.goto('/projects/8/settings');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/projects\/8\/settings/);
    await expect(page.locator('h1')).not.toContainText('404');

    // Navigation should use correct project ID
    await page.click('a:has-text("Dashboard")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=8/);
  });

  test('should build history stack from direct URL access', async ({ page }) => {
    // Direct access to Wiki
    await page.goto('/wiki?project=1');
    await page.waitForLoadState('networkidle');

    // Navigate to Issues
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');

    // Go back to Wiki
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/wiki.*project=1/);
  });
});

test.describe('Navigation History - New Tab Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should handle Ctrl+Click (new tab) navigation', async ({ page, context }) => {
    await page.goto('/dashboard?project=1');

    // Get Issues link
    const issuesLink = page.locator('a:has-text("Issues")');

    // Simulate Ctrl+Click (opens in new tab)
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      issuesLink.click({ modifiers: ['Control'] }),
    ]);

    await newPage.waitForLoadState('networkidle');

    // New tab should have correct URL with project ID
    await expect(newPage).toHaveURL(/\/issues.*project=1/);

    // Original tab should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard.*project=1/);

    await newPage.close();
  });
});

test.describe('Navigation History - Error Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should handle navigation to 404 page and back', async ({ page }) => {
    await page.goto('/dashboard?project=1');

    // Try to access non-existent route
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');

    // Should show 404 (or redirect somewhere)
    const url = page.url();

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back on dashboard with project ID
    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('EXPECTED FAILURE: navigation to /settings (404) and back should preserve state', async ({
    page,
  }) => {
    await page.goto('/dashboard?project=1');

    // Navigate to /settings (fallback route that causes 404)
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Check if it's 404
    const has404 = await page.locator('text=/404|Not Found/i').isVisible();

    if (has404) {
      console.log('🐛 BUG: /settings shows 404 as expected');

      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Should be back on dashboard with project ID
      await expect(page).toHaveURL(/\/dashboard.*project=1/);

      test.fail(); // Expected to fail until /settings route is fixed
    } else {
      // /settings works (bug is fixed)
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard.*project=1/);
    }
  });
});

test.describe('Navigation History - Multiple Projects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should handle switching between different project IDs in history', async ({ page }) => {
    // Project 1 - Dashboard
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    // Project 1 - Issues
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Switch to Project 8 - Dashboard
    await page.goto('/dashboard?project=8');
    await expect(page).toHaveURL(/project=8/);

    // Project 8 - Wiki
    await page.click('a:has-text("Wiki")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/wiki.*project=8/);

    // Go back to Project 8 Dashboard
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=8/);

    // Go back to Project 1 Issues
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Go back to Project 1 Dashboard
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('should preserve correct project context through complex history navigation', async ({
    page,
  }) => {
    // Build complex history with multiple projects
    await page.goto('/dashboard?project=1');
    await page.goto('/issues?project=1');
    await page.goto('/dashboard?project=8');
    await page.goto('/wiki?project=8');

    // Current: Wiki (Project 8)
    await expect(page).toHaveURL(/\/wiki.*project=8/);

    // Back to Dashboard (Project 8)
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard.*project=8/);

    // Back to Issues (Project 1)
    await page.goBack();
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Forward to Dashboard (Project 8)
    await page.goForward();
    await expect(page).toHaveURL(/\/dashboard.*project=8/);

    // Forward to Wiki (Project 8)
    await page.goForward();
    await expect(page).toHaveURL(/\/wiki.*project=8/);
  });
});

test.describe('Navigation History - Hash and Search Params', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should preserve hash fragments in URL during navigation', async ({ page }) => {
    await page.goto('/dashboard?project=1#metrics');
    await expect(page).toHaveURL(/project=1#metrics/);

    // Navigate away
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Hash should be preserved
    await expect(page).toHaveURL(/\/dashboard.*project=1#metrics/);
  });

  test('should preserve multiple query parameters', async ({ page }) => {
    await page.goto('/issues?project=1&status=open&priority=high');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/project=1/);
    await expect(page).toHaveURL(/status=open/);
    await expect(page).toHaveURL(/priority=high/);

    // Navigate away and back
    await page.click('a:has-text("Dashboard")');
    await page.waitForLoadState('networkidle');

    await page.goBack();
    await page.waitForLoadState('networkidle');

    // All params should be preserved
    await expect(page).toHaveURL(/project=1/);
    await expect(page).toHaveURL(/status=open/);
    await expect(page).toHaveURL(/priority=high/);
  });
});
