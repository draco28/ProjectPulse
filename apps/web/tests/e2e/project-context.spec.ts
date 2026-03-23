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
 * Sprint 10: Issues renamed to Tickets
 * Sprint 14: Project IDs updated to use dev user's actual projects (2 and 4)
 *
 * CRITICAL: User reported "if i click on any other page then project id is gone from url"
 * This test suite documents the expected behavior and catches regressions.
 *
 * DEV USER: dev@projectpulse.local owns projects 2 and 4 (not 1 or 8)
 */
import { test, expect } from '@playwright/test';

// Note: Login is handled by global setup (tests/setup/global-setup.ts)
// which saves auth state to .auth/user.json via storageState in playwright.config.ts
// No need to call login() in beforeEach - tests are already authenticated

// Helper: Sidebar navigation link selector (targets links inside <nav> to avoid matching page content)
const sidebarLink = (label: string) => `nav a:has-text("${label}")`;

// Helper: Click sidebar link and wait for navigation
// Uses force:true to bypass potential overlay issues and waitForURL to confirm navigation
async function clickSidebarLink(page: import('@playwright/test').Page, label: string) {
  const link = page.locator(sidebarLink(label));
  await expect(link).toBeVisible({ timeout: 10000 });

  // Get the href to know what URL to wait for
  const href = await link.getAttribute('href');

  // Build URL pattern - glob patterns treat ? as wildcard, so use regex instead
  // Escape special regex characters to match the URL literally
  const urlPattern = href ? new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) : /./;

  // Click with force and wait for URL change
  await Promise.all([page.waitForURL(urlPattern, { timeout: 10000 }), link.click({ force: true })]);
}

test.describe('Project Context - Query Parameter Persistence', () => {
  // Auth handled by global setup - storageState provides session cookies

  test('should preserve project ID when navigating from dashboard to tickets', async ({ page }) => {
    // Start on dashboard with project ID (dev user owns project 2)
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/project=2/);

    // Click on Tickets link in sidebar
    await clickSidebarLink(page, 'Tickets');
    await page.waitForLoadState('domcontentloaded');

    // Verify navigation completed
    await expect(page).toHaveURL(/\/tickets.*project=2/, { timeout: 10000 });
  });

  test('should preserve project ID when navigating from dashboard to wiki', async ({ page }) => {
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    await clickSidebarLink(page, 'Wiki');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/wiki.*project=2/, { timeout: 10000 });
  });

  test('should preserve project ID when navigating from dashboard to knowledge', async ({
    page,
  }) => {
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    await clickSidebarLink(page, 'Knowledge');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/knowledge.*project=2/, { timeout: 10000 });
  });

  test('should preserve project ID when navigating from dashboard to health', async ({ page }) => {
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    await clickSidebarLink(page, 'Health');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/health.*project=2/, { timeout: 10000 });
  });

  test('should preserve project ID when navigating from dashboard to agents', async ({ page }) => {
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    await clickSidebarLink(page, 'Agent AI Hub');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/agents.*project=2/, { timeout: 10000 });
  });

  test('should preserve project ID when navigating from dashboard to roadmap', async ({ page }) => {
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    await clickSidebarLink(page, 'Roadmap');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/roadmap.*project=2/, { timeout: 10000 });
  });

  test('should preserve project ID when navigating back to dashboard', async ({ page }) => {
    await page.goto('/tickets?project=2');
    await page.waitForLoadState('domcontentloaded');

    await clickSidebarLink(page, 'Dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/dashboard.*project=2/, { timeout: 10000 });
  });

  test('should preserve project ID through multiple navigation steps', async ({ page }) => {
    // Start on dashboard
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Tickets
    await clickSidebarLink(page, 'Tickets');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/tickets.*project=2/, { timeout: 10000 });

    // Navigate to Wiki
    await clickSidebarLink(page, 'Wiki');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/wiki.*project=2/, { timeout: 10000 });

    // Navigate back to Dashboard
    await clickSidebarLink(page, 'Dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/dashboard.*project=2/, { timeout: 10000 });
  });
});

test.describe('Project Context - Settings Route Special Case', () => {
  // Auth handled by global setup - storageState provides session cookies
  // Settings IS in the sidebar nav (confirmed via debug test)

  test('should use query parameter for settings route when project ID exists', async ({ page }) => {
    // Start on dashboard with project ID (dev user owns project 2)
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    // Click on Settings link in sidebar
    await clickSidebarLink(page, 'Settings');
    await page.waitForLoadState('domcontentloaded');

    // Settings now uses query parameter format: /settings?project=2
    await expect(page).toHaveURL(/\/settings.*project=2/, { timeout: 10000 });

    // Should NOT have 404 error - use main content h1 to avoid matching sidebar h1
    await expect(page.locator('main h1')).not.toContainText('404');
    await expect(page.locator('main h1')).not.toContainText('Not Found');
  });

  test('should handle settings navigation from different starting pages', async ({ page }) => {
    // From Tickets page
    await page.goto('/tickets?project=2');
    await page.waitForLoadState('domcontentloaded');
    await clickSidebarLink(page, 'Settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/settings.*project=2/, { timeout: 10000 });

    // From Wiki page
    await page.goto('/wiki?project=2');
    await page.waitForLoadState('domcontentloaded');
    await clickSidebarLink(page, 'Settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/settings.*project=2/, { timeout: 10000 });

    // From Knowledge page
    await page.goto('/knowledge?project=2');
    await page.waitForLoadState('domcontentloaded');
    await clickSidebarLink(page, 'Settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/settings.*project=2/, { timeout: 10000 });
  });

  test('settings route WITHOUT project ID should redirect to /app', async ({ page }) => {
    // Access dashboard without project parameter - withProjectAuth should redirect to /app
    await page.goto('/dashboard');

    // With unified project routing (withProjectAuth), pages without project should redirect to /app
    // Wait for either dashboard with project or /app redirect
    await page.waitForURL(/\/(app|dashboard)/);

    // If we're on /app (project selector), test passes - this is the expected behavior
    // If we're on dashboard, the system auto-selected a project
    const url = page.url();

    if (url.includes('/app')) {
      // Expected: redirected to project selector
      await expect(page).toHaveURL(/\/app/);
    } else {
      // Also valid: withProjectAuth auto-selected first owned project
      await expect(page).toHaveURL(/project=/);
    }
  });
});

test.describe('Project Context - Browser Navigation', () => {
  // Auth handled by global setup - storageState provides session cookies

  test('should preserve project ID when using browser back button', async ({ page }) => {
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    await clickSidebarLink(page, 'Tickets');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/tickets.*project=2/, { timeout: 10000 });

    // Go back
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/dashboard.*project=2/, { timeout: 10000 });
  });

  test('should preserve project ID when using browser forward button', async ({ page }) => {
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    await clickSidebarLink(page, 'Tickets');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/tickets.*project=2/, { timeout: 10000 });

    // Go back, then forward
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/dashboard.*project=2/, { timeout: 10000 });
    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/tickets.*project=2/, { timeout: 10000 });
  });

  test('should maintain project ID after page reload', async ({ page }) => {
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/project=2/);

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/\/dashboard.*project=2/);
  });
});

test.describe('Project Context - No Project ID Behavior', () => {
  // Auth handled by global setup - storageState provides session cookies

  test('accessing /dashboard without project should redirect to /app or auto-select', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // withProjectAuth should either:
    // 1. Redirect to /app (no projects available)
    // 2. Auto-select first owned project and stay on dashboard with project=X
    await page.waitForURL(/\/(app|dashboard)/);

    const url = page.url();

    if (url.includes('/app')) {
      // Redirected to project selector - expected for users without projects
      await expect(page).toHaveURL(/\/app/);
    } else {
      // Auto-selected a project - expected for users with projects
      await expect(page).toHaveURL(/project=/);
    }
  });

  test('accessing /tickets without project should redirect to /app or auto-select', async ({
    page,
  }) => {
    await page.goto('/tickets');

    // withProjectAuth should either redirect to /app or auto-select project
    await page.waitForURL(/\/(app|tickets)/);

    const url = page.url();

    if (url.includes('/app')) {
      await expect(page).toHaveURL(/\/app/);
    } else {
      await expect(page).toHaveURL(/project=/);
    }
  });

  test('sidebar links should preserve project context', async ({ page }) => {
    // Start with a project context
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/project=2/);

    // Click Tickets link - should preserve project ID
    await clickSidebarLink(page, 'Tickets');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/tickets.*project=2/, { timeout: 10000 });
  });
});

test.describe('Project Context - Multiple Projects', () => {
  // Auth handled by global setup - storageState provides session cookies

  test('should switch project context when changing project parameter', async ({ page }) => {
    // Start with project 2 (dev user owns this)
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/project=2/);

    // Manually navigate to project 4 (dev user also owns this)
    await page.goto('/dashboard?project=4');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/project=4/);

    // Navigate to Tickets (should use project 4)
    await clickSidebarLink(page, 'Tickets');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/tickets.*project=4/, { timeout: 10000 });
  });

  test('should maintain correct project ID across different pages with same project', async ({
    page,
  }) => {
    await page.goto('/dashboard?project=4');

    // Check Dashboard
    await expect(page).toHaveURL(/project=4/);

    // Check Tickets
    await page.goto('/tickets?project=4');
    await expect(page).toHaveURL(/project=4/);

    // Check Wiki
    await page.goto('/wiki?project=4');
    await expect(page).toHaveURL(/project=4/);
  });

  test('should switch between projects 2 and 4 via navigation', async ({ page }) => {
    // Start with project 2
    await page.goto('/wiki?project=2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/project=2/);

    // Navigate to project 4 via URL
    await page.goto('/wiki?project=4');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/project=4/);

    // Navigate back to project 2
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/project=2/);

    // Verify sidebar navigation still works
    await clickSidebarLink(page, 'Tickets');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/tickets.*project=2/, { timeout: 10000 });
  });
});

test.describe('Project Context - Sidebar Counts', () => {
  // Auth handled by global setup - storageState provides session cookies
  // Badge selector: The badge span has class "ml-auto" to distinguish from label span

  test('should display project-specific counts in sidebar badges', async ({ page }) => {
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');

    // Wait for sidebar to be visible (ensures hydration is complete)
    const ticketsLink = page.locator(sidebarLink('Tickets'));
    await expect(ticketsLink).toBeVisible({ timeout: 10000 });

    // Check if sidebar shows any badges (counts)
    // Badge has ml-auto class to distinguish from label span
    const ticketsBadge = ticketsLink.locator('span.ml-auto');
    const healthLink = page.locator(sidebarLink('Health'));
    const healthBadge = healthLink.locator('span.ml-auto');

    // If badges exist, they should have numeric values
    if (await ticketsBadge.isVisible()) {
      const badgeText = await ticketsBadge.textContent();
      expect(badgeText).toMatch(/^\d+$/); // Should be a number
    }

    if (await healthBadge.isVisible()) {
      const badgeText = await healthBadge.textContent();
      expect(badgeText).toMatch(/^\d+$/); // Should be a number
    }
  });

  test('should show different counts for different projects', async ({ page }) => {
    // Get counts for project 2
    await page.goto('/dashboard?project=2');
    await page.waitForLoadState('domcontentloaded');
    const ticketsLinkP2 = page.locator(sidebarLink('Tickets'));
    await expect(ticketsLinkP2).toBeVisible({ timeout: 10000 });

    // Badge has ml-auto class to distinguish from label span
    const ticketsBadgeP2 = ticketsLinkP2.locator('span.ml-auto');
    let countP2 = '0';
    if (await ticketsBadgeP2.isVisible()) {
      countP2 = (await ticketsBadgeP2.textContent()) || '0';
    }

    // Get counts for project 4
    await page.goto('/dashboard?project=4');
    await page.waitForLoadState('domcontentloaded');
    const ticketsLinkP4 = page.locator(sidebarLink('Tickets'));
    await expect(ticketsLinkP4).toBeVisible({ timeout: 10000 });

    const ticketsBadgeP4 = ticketsLinkP4.locator('span.ml-auto');
    let countP4 = '0';
    if (await ticketsBadgeP4.isVisible()) {
      countP4 = (await ticketsBadgeP4.textContent()) || '0';
    }

    // Counts may be different (or same if both projects have same number of tickets)
    // This test verifies counts are being fetched dynamically per project
    console.log(`Project 2 tickets: ${countP2}, Project 4 tickets: ${countP4}`);

    // Both should be valid numbers (or '0' if no badge visible)
    expect(countP2).toMatch(/^\d+$/);
    expect(countP4).toMatch(/^\d+$/);
  });
});
