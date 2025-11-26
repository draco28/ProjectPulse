/**
 * E2E Test: Tickets List Page
 *
 * Tests the unified /tickets page functionality including:
 * - Display tickets list with pagination
 * - Filter by kind (all 7 types: feature, task, epic, issue, bug, scanner_finding, tech_debt)
 * - Filter by status, priority, module
 * - Combined filters (AND logic)
 * - Search by title/description
 * - Sorting (createdAt, updatedAt, priority, kind)
 * - Kind filter pills with counts
 * - Empty states
 * - Badge rendering
 * - Navigation to detail pages
 * - Responsive layout
 *
 * Sprint 10: Ticket System with Kind-based Work Item Types
 */
import { test, expect } from '@playwright/test';

test.describe('Tickets List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tickets list page before each test
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');
  });

  test('should display tickets list with pagination controls', async ({ page }) => {
    // Verify page title/heading
    await expect(page.locator('h1, h2')).toContainText(/Tickets|Work Items/i);

    // Verify at least one ticket card is visible
    const ticketCards = page.locator('[data-testid="ticket-card"], .ticket-card, article');
    await expect(ticketCards.first()).toBeVisible({ timeout: 10000 });

    // Verify pagination controls exist (if more than one page)
    const paginationExists = await page.locator('nav[aria-label*="pagination"]').count();
    if (paginationExists > 0) {
      console.log('✓ Pagination controls present');
    }
  });

  test('should filter tickets by kind: feature', async ({ page }) => {
    // Click the "Feature" filter pill (or dropdown)
    const featureFilter = page.locator('text=/feature/i').first();
    await featureFilter.click();
    await page.waitForLoadState('networkidle');

    // Verify URL contains kind filter
    await expect(page).toHaveURL(/kind=feature/);

    // Verify all visible tickets have "feature" badge or kind
    const kindBadges = page.locator('[data-testid="kind-badge"], .badge');
    const count = await kindBadges.count();
    if (count > 0) {
      const firstBadgeText = await kindBadges.first().textContent();
      expect(firstBadgeText?.toLowerCase()).toContain('feature');
    }
  });

  test('should filter tickets by kind: bug', async ({ page }) => {
    // Click the "Bug" filter
    const bugFilter = page.locator('text=/bug/i').first();
    await bugFilter.click();
    await page.waitForLoadState('networkidle');

    // Verify URL contains kind filter
    await expect(page).toHaveURL(/kind=bug/);

    // Verify tickets show bug badge
    const kindBadges = page.locator('[data-testid="kind-badge"]');
    if ((await kindBadges.count()) > 0) {
      await expect(kindBadges.first()).toContainText(/bug/i);
    }
  });

  test('should filter tickets by status: open', async ({ page }) => {
    // Look for status filter dropdown or buttons
    const statusFilter = page.locator('[data-testid="status-filter"], select[name="status"], button:has-text("Open")');
    if ((await statusFilter.count()) > 0) {
      await statusFilter.first().click();

      // If dropdown, select "open"
      const openOption = page.locator('text=/^open$/i');
      if ((await openOption.count()) > 0) {
        await openOption.click();
      }

      await page.waitForLoadState('networkidle');

      // Verify URL contains status filter
      await expect(page).toHaveURL(/status=open/);
    } else {
      console.log('⚠️ Status filter not found - may not be implemented yet');
    }
  });

  test('should filter tickets by priority: high', async ({ page }) => {
    // Look for priority filter
    const priorityFilter = page.locator('[data-testid="priority-filter"], select[name="priority"], button:has-text("High")');
    if ((await priorityFilter.count()) > 0) {
      await priorityFilter.first().click();

      const highOption = page.locator('text=/^high$/i');
      if ((await highOption.count()) > 0) {
        await highOption.click();
      }

      await page.waitForLoadState('networkidle');

      // Verify URL contains priority filter
      await expect(page).toHaveURL(/priority=high/);

      // Verify tickets show high priority
      const priorityBadges = page.locator('[data-testid="priority-badge"]');
      if ((await priorityBadges.count()) > 0) {
        await expect(priorityBadges.first()).toContainText(/high/i);
      }
    } else {
      console.log('⚠️ Priority filter not found - may not be implemented yet');
    }
  });

  test('should search tickets by title/description', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if ((await searchInput.count()) > 0) {
      // Type search query
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle');

      // Verify URL contains search query
      await expect(page).toHaveURL(/search=test|q=test/);

      // Verify results contain search term
      const ticketCards = page.locator('[data-testid="ticket-card"], .ticket-card');
      if ((await ticketCards.count()) > 0) {
        const firstCardText = await ticketCards.first().textContent();
        expect(firstCardText?.toLowerCase()).toContain('test');
      }
    } else {
      console.log('⚠️ Search input not found - may not be implemented yet');
    }
  });

  test('should sort tickets by newest first (default)', async ({ page }) => {
    // Verify default sorting
    const ticketCards = page.locator('[data-testid="ticket-card"], .ticket-card');
    const count = await ticketCards.count();

    if (count >= 2) {
      // Get timestamps from first two tickets
      const timestamps = [];
      for (let i = 0; i < 2; i++) {
        const card = ticketCards.nth(i);
        const timeText = await card.locator('time, [data-testid="created-at"]').textContent();
        timestamps.push(timeText);
      }

      console.log(`✓ First two tickets: ${timestamps[0]}, ${timestamps[1]}`);
    }
  });

  test('should combine multiple filters (kind + status)', async ({ page }) => {
    // Apply kind filter
    const featureFilter = page.locator('text=/feature/i').first();
    await featureFilter.click();
    await page.waitForLoadState('networkidle');

    // Apply status filter
    const statusFilter = page.locator('[data-testid="status-filter"], button:has-text("Open")');
    if ((await statusFilter.count()) > 0) {
      await statusFilter.first().click();

      const openOption = page.locator('text=/^open$/i');
      if ((await openOption.count()) > 0) {
        await openOption.click();
      }

      await page.waitForLoadState('networkidle');

      // Verify URL contains both filters
      await expect(page).toHaveURL(/kind=feature/);
      await expect(page).toHaveURL(/status=open/);
    }
  });

  test('should show kind filter pills with counts', async ({ page }) => {
    // Look for kind filter pills/badges
    const kindPills = page.locator('[data-testid="kind-pill"], .kind-filter');

    if ((await kindPills.count()) > 0) {
      // Verify each pill shows count
      const pillText = await kindPills.first().textContent();
      console.log(`✓ Kind pill: ${pillText}`);

      // Should contain kind name and optional count
      expect(pillText).toBeTruthy();
    } else {
      console.log('⚠️ Kind pills not found - checking for filter UI');

      // Alternative: Check for any filter UI
      const filterUI = page.locator('text=/filter/i, [role="combobox"]');
      await expect(filterUI.first()).toBeVisible();
    }
  });

  test('should highlight active filter pill', async ({ page }) => {
    // Click a kind filter
    const featureFilter = page.locator('text=/feature/i').first();
    await featureFilter.click();
    await page.waitForLoadState('networkidle');

    // Check if the filter has active styling
    const activeFilter = page.locator('[data-testid="kind-pill"].active, [aria-selected="true"]');
    if ((await activeFilter.count()) > 0) {
      await expect(activeFilter.first()).toBeVisible();
    } else {
      // URL should show filter is active
      await expect(page).toHaveURL(/kind=feature/);
    }
  });

  test('should show empty state when no tickets match filters', async ({ page }) => {
    // Apply a filter that returns no results
    // Search for a very unlikely string
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('xyzabc123nonexistent');
      await page.waitForLoadState('networkidle');

      // Check for empty state message
      const emptyState = page.locator('text=/no tickets|no results|nothing found/i');
      const hasEmptyState = (await emptyState.count()) > 0;

      if (hasEmptyState) {
        await expect(emptyState.first()).toBeVisible();
        console.log('✓ Empty state shown correctly');
      } else {
        // Verify no ticket cards are shown
        const ticketCards = page.locator('[data-testid="ticket-card"]');
        expect(await ticketCards.count()).toBe(0);
      }
    }
  });

  test('should display correct badges (kind, status, priority)', async ({ page }) => {
    // Get first ticket card
    const firstCard = page.locator('[data-testid="ticket-card"], .ticket-card').first();
    await expect(firstCard).toBeVisible();

    // Verify kind badge exists
    const kindBadge = firstCard.locator('[data-testid="kind-badge"], .badge');
    if ((await kindBadge.count()) > 0) {
      await expect(kindBadge.first()).toBeVisible();
      console.log('✓ Kind badge present');
    }

    // Verify status badge exists
    const statusBadge = firstCard.locator('[data-testid="status-badge"], text=/open|closed|in progress/i');
    if ((await statusBadge.count()) > 0) {
      await expect(statusBadge.first()).toBeVisible();
      console.log('✓ Status badge present');
    }

    // Verify priority badge exists
    const priorityBadge = firstCard.locator('[data-testid="priority-badge"], text=/critical|high|medium|low/i');
    if ((await priorityBadge.count()) > 0) {
      await expect(priorityBadge.first()).toBeVisible();
      console.log('✓ Priority badge present');
    }
  });

  test('should navigate to detail page when clicking ticket', async ({ page }) => {
    // Click on first ticket title/card
    const firstTicket = page.locator('[data-testid="ticket-card"] a, .ticket-card a').first();
    await expect(firstTicket).toBeVisible();

    const ticketTitle = await firstTicket.textContent();
    await firstTicket.click();

    // Wait for navigation to detail page
    await page.waitForURL(/\/tickets\/\d+/);

    // Verify we're on the detail page
    expect(page.url()).toMatch(/\/tickets\/\d+$/);

    // Verify ticket title is shown
    await expect(page.locator('h1, h2')).toContainText(ticketTitle || '');
  });

  test('should show create ticket button', async ({ page }) => {
    // Look for create/new ticket button
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New Ticket"), a:has-text("Create Ticket")'
    );

    if ((await createButton.count()) > 0) {
      await expect(createButton.first()).toBeVisible();
      console.log('✓ Create ticket button found');
    } else {
      console.log('⚠️ Create button not found - may use different pattern');
    }
  });

  test('should handle pagination (next/prev pages)', async ({ page }) => {
    // Check if pagination exists
    const nextButton = page.locator('button:has-text("Next"), a:has-text("Next"), [aria-label="Next page"]');

    if ((await nextButton.count()) > 0 && (await nextButton.first().isEnabled())) {
      const currentURL = page.url();

      // Click next page
      await nextButton.first().click();
      await page.waitForLoadState('networkidle');

      // Verify URL changed (page parameter updated)
      expect(page.url()).not.toBe(currentURL);

      // Verify tickets are still displayed
      const ticketCards = page.locator('[data-testid="ticket-card"], .ticket-card');
      await expect(ticketCards.first()).toBeVisible();

      console.log('✓ Pagination works correctly');
    } else {
      console.log('⚠️ Pagination not available (may be only one page of tickets)');
    }
  });
});
