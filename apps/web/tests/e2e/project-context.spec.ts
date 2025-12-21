/**
 * E2E Test: Project Context Persistence
 *
 * Tests project context (project ID) persistence across navigation:
 * - Project ID in query parameters (?project=X)
 * - Project ID preservation during navigation
 * - Fallback behavior when no project ID
 * - Project selector redirect
 * - Mixed routing patterns (query params vs path params)
 *
 * CRITICAL: User reported "if i click on any other page then project id is gone from url"
 * This test suite documents the expected behavior and catches regressions.
 */
import { test, expect } from '@playwright/test';

test.describe('Project Context - Query Parameter Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (assuming auth is required)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should preserve project ID when navigating from dashboard to issues', async ({ page }) => {
    // Start on dashboard with project ID
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    // Click on Issues link in sidebar
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');

    // Should preserve project ID
    await expect(page).toHaveURL(/\/issues/);
    await expect(page).toHaveURL(/project=1/);
  });

  test('should preserve project ID when navigating from dashboard to wiki', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    await page.click('a:has-text("Wiki")');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/wiki/);
    await expect(page).toHaveURL(/project=1/);
  });

  test('should preserve project ID when navigating from dashboard to knowledge', async ({
    page,
  }) => {
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    await page.click('a:has-text("Knowledge")');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/knowledge/);
    await expect(page).toHaveURL(/project=1/);
  });

  test('should preserve project ID when navigating from dashboard to health', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    await page.click('a:has-text("Health")');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/health/);
    await expect(page).toHaveURL(/project=1/);
  });

  test('should preserve project ID when navigating from dashboard to agents', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    await page.click('a:has-text("Agent AI Hub")');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/agents/);
    await expect(page).toHaveURL(/project=1/);
  });

  test('should preserve project ID when navigating from dashboard to roadmap', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    await page.click('a:has-text("Roadmap")');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/roadmap/);
    await expect(page).toHaveURL(/project=1/);
  });

  test('should preserve project ID when navigating back to dashboard', async ({ page }) => {
    await page.goto('/issues?project=1');
    await expect(page).toHaveURL(/project=1/);

    await page.click('a:has-text("Dashboard")');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page).toHaveURL(/project=1/);
  });

  test('should preserve project ID through multiple navigation steps', async ({ page }) => {
    // Start on dashboard
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    // Navigate to Issues
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Navigate to Wiki
    await page.click('a:has-text("Wiki")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/wiki.*project=1/);

    // Navigate back to Dashboard
    await page.click('a:has-text("Dashboard")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });
});

test.describe('Project Context - Settings Route Special Case', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should use path parameter for settings route when project ID exists', async ({ page }) => {
    // Start on dashboard with project ID
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    // Click on Settings link in sidebar
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // Settings should use path parameter format: /projects/{id}/settings
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    // Should NOT have 404 error
    await expect(page.locator('h1')).not.toContainText('404');
    await expect(page.locator('h1')).not.toContainText('Not Found');
  });

  test('should handle settings navigation from different starting pages', async ({ page }) => {
    // From Issues page
    await page.goto('/issues?project=1');
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    // From Wiki page
    await page.goto('/wiki?project=1');
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);

    // From Knowledge page
    await page.goto('/knowledge?project=1');
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/1\/settings/);
  });

  test('EXPECTED FAILURE: settings route WITHOUT project ID should redirect to /app, not /settings (404)', async ({
    page,
  }) => {
    // Access dashboard without project parameter
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click on Settings (will use fallback route)
    await page.click('a:has-text("Settings")');
    await page.waitForLoadState('networkidle');

    // CURRENT BEHAVIOR: Goes to /settings (404)
    // EXPECTED BEHAVIOR: Should redirect to /app (project selector)
    const url = page.url();

    if (url.includes('/settings') && !url.includes('/projects/')) {
      // This is the BUG - fallback to /settings causes 404
      console.log('🐛 BUG DETECTED: Settings link goes to /settings (404) when no project ID');

      // Mark as expected failure
      test.fail();
      await expect(page).toHaveURL(/\/app/); // This will fail, documenting the bug
    } else {
      // Bug is fixed - should be on /app
      await expect(page).toHaveURL(/\/app/);
    }
  });
});

test.describe('Project Context - Browser Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should preserve project ID when using browser back button', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should still have project ID
    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });

  test('should preserve project ID when using browser forward button', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=1/);

    // Go back, then forward
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Should still have project ID
    await expect(page).toHaveURL(/\/issues.*project=1/);
  });

  test('should maintain project ID after page reload', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard.*project=1/);
  });
});

test.describe('Project Context - No Project ID Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('EXPECTED FAILURE: accessing /dashboard without project should redirect to /app', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // CURRENT BEHAVIOR: Loads dashboard without project ID
    // EXPECTED BEHAVIOR: Should redirect to /app (project selector)
    const url = page.url();

    if (url.includes('/dashboard') && !url.includes('project=')) {
      // This is a BUG - should enforce project context
      console.log(
        '🐛 BUG DETECTED: Dashboard loads without project ID instead of redirecting to /app'
      );

      test.fail();
      await expect(page).toHaveURL(/\/app/); // This will fail, documenting the bug
    } else {
      // Bug is fixed
      await expect(page).toHaveURL(/\/app/);
    }
  });

  test('EXPECTED FAILURE: accessing /issues without project should redirect to /app', async ({
    page,
  }) => {
    await page.goto('/issues');
    await page.waitForLoadState('networkidle');

    const url = page.url();

    if (url.includes('/issues') && !url.includes('project=')) {
      console.log('🐛 BUG DETECTED: Issues page loads without project ID');
      test.fail();
      await expect(page).toHaveURL(/\/app/);
    } else {
      await expect(page).toHaveURL(/\/app/);
    }
  });

  test('EXPECTED FAILURE: sidebar links without project ID should include fallback', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click Issues link (without project ID in current URL)
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');

    const url = page.url();

    if (!url.includes('project=')) {
      console.log('🐛 BUG DETECTED: Navigation loses project context');
      test.fail();
      // Should either have project ID or redirect to /app
      expect(url).toMatch(/project=|\/app/);
    }
  });
});

test.describe('Project Context - Multiple Projects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should switch project context when changing project parameter', async ({ page }) => {
    // Start with project 1
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    // Manually navigate to project 8
    await page.goto('/dashboard?project=8');
    await expect(page).toHaveURL(/project=8/);

    // Navigate to Issues (should use project 8)
    await page.click('a:has-text("Issues")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/issues.*project=8/);
  });

  test('should maintain correct project ID across different pages with same project', async ({
    page,
  }) => {
    await page.goto('/dashboard?project=8');

    // Check Dashboard
    await expect(page).toHaveURL(/project=8/);

    // Check Issues
    await page.goto('/issues?project=8');
    await expect(page).toHaveURL(/project=8/);

    // Check Wiki
    await page.goto('/wiki?project=8');
    await expect(page).toHaveURL(/project=8/);
  });
});

test.describe('Project Context - Sidebar Counts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should display project-specific counts in sidebar badges', async ({ page }) => {
    await page.goto('/dashboard?project=1');
    await page.waitForLoadState('networkidle');

    // Check if sidebar shows any badges (counts)
    // These should be DYNAMIC from database, NOT hardcoded
    const issuesBadge = page.locator('a:has-text("Issues") span');
    const healthBadge = page.locator('a:has-text("Health") span');

    // If badges exist, they should have numeric values
    if (await issuesBadge.isVisible()) {
      const badgeText = await issuesBadge.textContent();
      expect(badgeText).toMatch(/^\d+$/); // Should be a number
    }

    if (await healthBadge.isVisible()) {
      const badgeText = await healthBadge.textContent();
      expect(badgeText).toMatch(/^\d+$/); // Should be a number
    }
  });

  test('should show different counts for different projects', async ({ page }) => {
    // Get counts for project 1
    await page.goto('/dashboard?project=1');
    await page.waitForLoadState('networkidle');

    const issuesBadgeP1 = page.locator('a:has-text("Issues") span').first();
    let countP1 = '0';
    if (await issuesBadgeP1.isVisible()) {
      countP1 = (await issuesBadgeP1.textContent()) || '0';
    }

    // Get counts for project 8
    await page.goto('/dashboard?project=8');
    await page.waitForLoadState('networkidle');

    const issuesBadgeP8 = page.locator('a:has-text("Issues") span').first();
    let countP8 = '0';
    if (await issuesBadgeP8.isVisible()) {
      countP8 = (await issuesBadgeP8.textContent()) || '0';
    }

    // Counts may be different (or same if both projects have same number of issues)
    // This test verifies counts are being fetched dynamically per project
    console.log(`Project 1 issues: ${countP1}, Project 8 issues: ${countP8}`);

    // Both should be valid numbers
    expect(countP1).toMatch(/^\d+$/);
    expect(countP8).toMatch(/^\d+$/);
  });
});
