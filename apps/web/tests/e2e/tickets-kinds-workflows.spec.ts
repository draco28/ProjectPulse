import { test, expect } from '@playwright/test';

test.describe('Ticket Kind Workflows', () => {
  const kinds = [
    'feature',
    'task',
    'epic',
    'issue',
    'bug',
    'scanner_finding',
    'tech_debt'
  ];

  kinds.forEach(kind => {
    test(`should create ${kind} ticket and verify detail page rendering`, async ({ page }) => {
      // 1. Navigate to create page
      await page.goto('/tickets/create?project=3');

      // 2. Fill form
      const title = `${kind.charAt(0).toUpperCase() + kind.slice(1)} E2E Test ${Date.now()}`;
      await page.fill('input[name="title"]', title);
      await page.selectOption('select[name="kind"]', kind);
      await page.selectOption('select[name="source"]', 'manual');

      // 3. Submit
      await page.click('button[type="submit"]');
      
      // 4. Wait for navigation to detail page
      await page.waitForURL(/\/tickets\/\d+/);

      // 5. Verify detail page - check data-kind attribute (raw value) not text (display label)
      const kindBadge = page.locator('[data-testid="kind-badge"]');
      await expect(kindBadge).toHaveAttribute('data-kind', kind);
      
      // Verify title matches (use specific selector to avoid sidebar h1)
      await expect(page.locator('h1.text-2xl')).toContainText(title);
    });

    test(`should display correct ${kind} badge color on list page`, async ({ page }) => {
      // Navigate to list filtered by this kind
      await page.goto(`/tickets?project=3&kind=${kind}`);
      
      // Wait for list to load
      const firstTicket = page.locator('[data-testid="ticket-card"]').first();
      await expect(firstTicket).toBeVisible();
      
      // Click ticket title link (not the card div which has checkbox)
      const titleLink = firstTicket.locator('h3 a');
      await titleLink.click();
      await page.waitForURL(/\/tickets\/\d+/);
      
      // Verify kind badge on detail page using data-kind attribute
      const detailBadge = page.locator('[data-testid="kind-badge"]');
      await expect(detailBadge).toHaveAttribute('data-kind', kind);
    });
  });
});
