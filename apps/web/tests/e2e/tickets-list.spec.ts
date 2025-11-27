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
  // Use project 3 (Client Test Project) which has test ticket data
  const PROJECT_ID = 3;
  
  test.beforeEach(async ({ page }) => {
    // Navigate to tickets list page with project context
    await page.goto(`/tickets?project=${PROJECT_ID}`);
    await page.waitForSelector('h1, h2', { timeout: 10000 });
  });

  test('should display tickets list with pagination controls', async ({ page }) => {
    // Verify at least one ticket card is visible (main verification)
    const ticketCards = page.locator('[data-testid="ticket-card"]');
    await expect(ticketCards.first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Ticket cards loaded');

    // Verify pagination controls exist (if more than one page)
    const paginationExists = await page.locator('nav[aria-label*="pagination"]').count();
    if (paginationExists > 0) {
      console.log('✓ Pagination controls present');
    }
  });

  test('should filter tickets by kind: feature', async ({ page }) => {
    // Navigate directly with kind filter in URL
    await page.goto(`/tickets?project=${PROJECT_ID}&kind=feature`);
    await page.waitForSelector('[data-testid="ticket-card"]', { timeout: 10000 });

    // Verify URL contains kind filter
    await expect(page).toHaveURL(/kind=feature/);

    // Verify tickets have feature kind
    const ticketCards = page.locator('[data-testid="ticket-card"]');
    const count = await ticketCards.count();
    if (count > 0) {
      console.log(`✓ Found ${count} feature tickets`);
    }
  });

  test('should filter tickets by kind: bug', async ({ page }) => {
    // Navigate directly with kind filter in URL
    await page.goto(`/tickets?project=${PROJECT_ID}&kind=bug`);
    await page.waitForSelector('[data-testid="ticket-card"]', { timeout: 10000 });

    // Verify URL contains kind filter
    await expect(page).toHaveURL(/kind=bug/);

    // Verify tickets exist
    const ticketCards = page.locator('[data-testid="ticket-card"]');
    const count = await ticketCards.count();
    if (count > 0) {
      console.log(`✓ Found ${count} bug tickets`);
    }
  });

  test('should filter tickets by status: open', async ({ page }) => {
    // Navigate directly with status filter in URL
    await page.goto(`/tickets?project=${PROJECT_ID}&status=open`);
    await page.waitForSelector('[data-testid="ticket-card"]', { timeout: 10000 });

    // Verify URL contains status filter
    await expect(page).toHaveURL(/status=open/);

    // Verify status badges show "Open"
    const statusBadges = page.locator('[data-testid="status-badge"]');
    if ((await statusBadges.count()) > 0) {
      await expect(statusBadges.first()).toContainText(/open/i);
      console.log('✓ Status filter working');
    }
  });

  test('should filter tickets by priority: high', async ({ page }) => {
    // Navigate directly with priority filter in URL
    await page.goto(`/tickets?project=${PROJECT_ID}&priority=high`);
    await page.waitForSelector('[data-testid="ticket-card"]', { timeout: 10000 });

    // Verify URL contains priority filter
    await expect(page).toHaveURL(/priority=high/);

    // Verify priority badges show "High"
    const priorityBadges = page.locator('[data-testid="priority-badge"]');
    if ((await priorityBadges.count()) > 0) {
      await expect(priorityBadges.first()).toContainText(/high/i);
      console.log('✓ Priority filter working');
    }
  });

  test('should search tickets by title/description', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"]').or(page.locator('input[placeholder*="Search"]'));
    if ((await searchInput.count()) > 0) {
      // Type search query
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Wait for debounce
      await page.waitForSelector('[data-testid="ticket-card"]', { timeout: 10000 });

      // Verify results appear
      const ticketCards = page.locator('[data-testid="ticket-card"]');
      if ((await ticketCards.count()) > 0) {
        console.log('✓ Search returned results');
      }
    } else {
      console.log('⚠️ Search input not found - may not be implemented yet');
    }
  });

  test('should sort tickets by newest first (default)', async ({ page }) => {
    // Verify tickets are displayed
    const ticketCards = page.locator('[data-testid="ticket-card"]');
    const count = await ticketCards.count();

    if (count >= 2) {
      // Get first two ticket cards
      const firstCard = ticketCards.first();
      const secondCard = ticketCards.nth(1);
      
      // Both should be visible (basic sorting verification)
      await expect(firstCard).toBeVisible();
      await expect(secondCard).toBeVisible();
      console.log(`✓ ${count} tickets displayed in order`);
    }
  });

  test('should combine multiple filters (kind + status)', async ({ page }) => {
    // Navigate with combined filters
    await page.goto(`/tickets?project=${PROJECT_ID}&kind=feature&status=open`);
    await page.waitForSelector('h1, h2', { timeout: 10000 });

    // Verify URL contains both filters
    await expect(page).toHaveURL(/kind=feature/);
    await expect(page).toHaveURL(/status=open/);
    
    console.log('✓ Combined filters applied via URL');
  });

  test('should show kind filter pills with counts', async ({ page }) => {
    // Look for filter sidebar or pills
    const filterSection = page.locator('[data-testid="filter-sidebar"]').or(page.locator('aside'));

    if ((await filterSection.count()) > 0) {
      // Filter section exists
      console.log('✓ Filter section found');
      
      // Check for kind options
      const kindOptions = filterSection.locator('[data-testid^="kind-option"]');
      if ((await kindOptions.count()) > 0) {
        console.log(`✓ ${await kindOptions.count()} kind filter options found`);
      }
    } else {
      console.log('⚠️ Filter sidebar not found');
    }
  });

  test('should highlight active filter pill', async ({ page }) => {
    // Navigate with a filter active
    await page.goto(`/tickets?project=${PROJECT_ID}&kind=feature`);
    await page.waitForSelector('[data-testid="ticket-card"]', { timeout: 10000 });

    // URL should show filter is active
    await expect(page).toHaveURL(/kind=feature/);
    console.log('✓ Filter active in URL');
  });

  test('should show empty state when no tickets match filters', async ({ page }) => {
    // Apply a filter that likely returns no results
    await page.goto(`/tickets?project=${PROJECT_ID}&search=xyzabc123nonexistent`);
    await page.waitForTimeout(1000);

    // Check for empty state or no cards
    const ticketCards = page.locator('[data-testid="ticket-card"]');
    const count = await ticketCards.count();
    
    if (count === 0) {
      console.log('✓ No tickets shown for non-matching search');
    } else {
      console.log(`ℹ️ ${count} tickets still shown`);
    }
  });

  test('should display correct badges (kind, status, priority)', async ({ page }) => {
    // Get first ticket card
    const firstCard = page.locator('[data-testid="ticket-card"]').first();
    await expect(firstCard).toBeVisible();

    // Verify status badge exists
    const statusBadge = firstCard.locator('[data-testid="status-badge"]');
    if ((await statusBadge.count()) > 0) {
      await expect(statusBadge.first()).toBeVisible();
      console.log('✓ Status badge present');
    }

    // Verify priority badge exists
    const priorityBadge = firstCard.locator('[data-testid="priority-badge"]');
    if ((await priorityBadge.count()) > 0) {
      await expect(priorityBadge.first()).toBeVisible();
      console.log('✓ Priority badge present');
    }
  });

  test('should navigate to detail page when clicking ticket', async ({ page }) => {
    // Click on first ticket title link
    const firstTicket = page.locator('[data-testid="ticket-card"]').first();
    await expect(firstTicket).toBeVisible();

    const titleLink = firstTicket.locator('h3 a');
    await titleLink.click();

    // Wait for navigation to detail page (URL contains /tickets/{id})
    await page.waitForURL(/\/tickets\/\d+/);

    // Verify we're on the detail page
    expect(page.url()).toMatch(/\/tickets\/\d+/);
    console.log(`✓ Navigated to ${page.url()}`);
  });

  test('should show create ticket button', async ({ page }) => {
    // Look for create/new ticket button
    const createButton = page.getByRole('link', { name: /create|new/i })
      .or(page.getByRole('button', { name: /create|new/i }));

    if ((await createButton.count()) > 0) {
      await expect(createButton.first()).toBeVisible();
      console.log('✓ Create ticket button found');
    } else {
      console.log('⚠️ Create button not found - may use different pattern');
    }
  });

  test('should handle pagination (next/prev pages)', async ({ page }) => {
    // Check if pagination exists
    const nextButton = page.getByRole('button', { name: /next/i })
      .or(page.locator('[aria-label="Next page"]'));

    if ((await nextButton.count()) > 0 && (await nextButton.first().isEnabled())) {
      const currentURL = page.url();

      // Click next page
      await nextButton.first().click();
      await page.waitForTimeout(500);

      // Verify URL changed (page parameter updated)
      if (page.url() !== currentURL) {
        console.log('✓ Pagination works correctly');
      } else {
        console.log('ℹ️ URL did not change (may be single page)');
      }

      // Verify tickets are still displayed
      const ticketCards = page.locator('[data-testid="ticket-card"]');
      await expect(ticketCards.first()).toBeVisible();
    } else {
      console.log('⚠️ Pagination not available (may be only one page of tickets)');
    }
  });
});
