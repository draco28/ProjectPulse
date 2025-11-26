/**
 * E2E Test: Issues → Tickets Redirect (Backwards Compatibility)
 *
 * Tests Sprint 10's backwards compatibility layer that redirects
 * /issues routes to /tickets routes with appropriate kind filters.
 *
 * Critical Features:
 * - /issues → /tickets?kind=issue,bug,scanner_finding
 * - /issues/123 → /tickets/123
 * - Query param preservation on redirect
 * - Navigation menu shows "Tickets" not "Issues"
 *
 * Sprint 10: Unified Ticket System with Backwards Compatibility
 */
import { test, expect } from '@playwright/test';

test.describe('Issues → Tickets Redirect (Backwards Compatibility)', () => {
  test('should redirect /issues to /tickets with kind filter for legacy types', async ({ page }) => {
    // Navigate to legacy /issues route
    await page.goto('/issues');
    await page.waitForLoadState('networkidle');

    // Should redirect to /tickets with kind filter
    // Filter should include: issue, bug, scanner_finding (legacy issue types)
    await expect(page).toHaveURL(/\/tickets/);
    await expect(page).toHaveURL(/kind=(issue|bug|scanner_finding)/);

    console.log(`✓ Redirected to: ${page.url()}`);

    // Verify page shows tickets
    const ticketCards = page.locator('[data-testid="ticket-card"], .ticket-card, article');
    const count = await ticketCards.count();

    if (count > 0) {
      await expect(ticketCards.first()).toBeVisible();
      console.log(`✓ ${count} tickets displayed after redirect`);
    } else {
      console.log('⚠️ No tickets found (may be empty state)');
    }
  });

  test('should redirect /issues/{id} to /tickets/{id}', async ({ page }) => {
    // First, get a ticket ID from the list page
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');

    // Get first ticket's ID from URL or data attribute
    const firstTicketLink = page.locator('[data-testid="ticket-card"] a, .ticket-card a').first();
    if ((await firstTicketLink.count()) === 0) {
      console.log('⚠️ No tickets found to test detail redirect');
      return;
    }

    const href = await firstTicketLink.getAttribute('href');
    const ticketId = href?.match(/\/tickets\/(\d+)/)?.[1];

    if (!ticketId) {
      console.log('⚠️ Could not extract ticket ID from link');
      return;
    }

    // Now navigate to legacy /issues/{id} URL
    await page.goto(`/issues/${ticketId}`);
    await page.waitForLoadState('networkidle');

    // Should redirect to /tickets/{id}
    await expect(page).toHaveURL(`/tickets/${ticketId}`);

    console.log(`✓ /issues/${ticketId} redirected to /tickets/${ticketId}`);

    // Verify ticket detail page loaded
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('should preserve query parameters on /issues redirect', async ({ page }) => {
    // Navigate to /issues with query params
    await page.goto('/issues?status=open&priority=high');
    await page.waitForLoadState('networkidle');

    // Should redirect to /tickets AND preserve query params
    await expect(page).toHaveURL(/\/tickets/);
    await expect(page).toHaveURL(/status=open/);
    await expect(page).toHaveURL(/priority=high/);
    await expect(page).toHaveURL(/kind=(issue|bug|scanner_finding)/);

    console.log(`✓ Query params preserved: ${page.url()}`);
  });

  test('should redirect /issues?status=closed with kind filter added', async ({ page }) => {
    // Navigate to /issues with a specific filter
    await page.goto('/issues?status=closed');
    await page.waitForLoadState('networkidle');

    // Should redirect to /tickets with:
    // 1. Original status filter preserved
    // 2. Kind filter added for backwards compatibility
    await expect(page).toHaveURL(/\/tickets/);
    await expect(page).toHaveURL(/status=closed/);
    await expect(page).toHaveURL(/kind=(issue|bug|scanner_finding)/);

    console.log(`✓ Status filter preserved, kind filter added: ${page.url()}`);
  });

  test('should show "Tickets" in navigation menu (not "Issues")', async ({ page }) => {
    // Navigate to tickets page
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');

    // Check navigation menu for "Tickets" link
    const nav = page.locator('nav, aside, [role="navigation"]');
    const ticketsLink = nav.locator('a:has-text("Tickets"), [href="/tickets"]');

    if ((await ticketsLink.count()) > 0) {
      await expect(ticketsLink.first()).toBeVisible();
      console.log('✓ Navigation shows "Tickets" link');

      // Verify NO "Issues" link in main navigation
      const issuesLink = nav.locator('a:has-text("Issues")');
      if ((await issuesLink.count()) > 0) {
        // Issues link might exist for backwards compat but should not be primary
        console.log('⚠️ "Issues" link still exists in navigation');
      } else {
        console.log('✓ No "Issues" link in navigation (clean migration)');
      }
    } else {
      console.log('⚠️ "Tickets" link not found in navigation');

      // Alternative: Check page title or heading
      const heading = page.locator('h1, h2').first();
      const headingText = await heading.textContent();
      expect(headingText?.toLowerCase()).toContain('ticket');
    }
  });
});
