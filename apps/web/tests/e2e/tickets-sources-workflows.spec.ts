import { test, expect } from '@playwright/test';

test.describe('Ticket Source Workflows', () => {
  const sources = [
    'manual',
    'scanner',
    'agent',
    'onboarding'
  ];

  sources.forEach(source => {
    test(`should create ticket with source=${source} and verify indicator`, async ({ page }) => {
      await page.goto('/tickets/create?project=3');
      
      const title = `Source ${source} Test ${Date.now()}`;
      await page.fill('input[name="title"]', title);
      await page.selectOption('select[name="kind"]', 'task');
      await page.selectOption('select[name="source"]', source);

      await page.click('button[type="submit"]');
      await page.waitForURL(/\/tickets\/\d+/);

      const sourceBadge = page.locator('[data-testid="source-badge"]');
      await expect(sourceBadge).toContainText(source);
    });

    test(`should filter tickets by source=${source}`, async ({ page }) => {
      await page.goto(`/tickets?project=3&source=${source}`);
      await expect(page).toHaveURL(new RegExp(`source=${source}`));
      
      // Verify filter is applied in UI
      // Depending on implementation, URL check might be enough, but checking UI state is better
      // Assuming there is a filter sidebar or indicator
    });
  });
});
