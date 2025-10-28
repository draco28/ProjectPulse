/**
 * E2E Test: Security Page
 *
 * Covers:
 * - Security score meter and breakdown
 * - Vulnerability list rendering
 * - Filter by severity and status
 *
 * Seeded data (apps/web/prisma/seed.ts):
 * - 2 open findings (1 ERROR, 1 WARNING)
 * - 1 false_positive (ERROR)
 */
import { test, expect } from '@playwright/test';

test.describe('Security Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/security');
    await page.waitForLoadState('networkidle');
  });

  test('should render security score meter and breakdown', async ({ page }) => {
    // Page header
    await expect(page.getByRole('heading', { name: 'Security Dashboard' })).toBeVisible();

    // Security score should be visible (calculated from open findings)
    // With 2 open findings (1 ERROR=10, 1 WARNING=4), score = 100 - 14 = 86
    await expect(page.getByText(/Security Score/i)).toBeVisible();
    await expect(page.getByText('86', { exact: true })).toBeVisible();

    // Breakdown counts (Critical=1 ERROR, Medium=1 WARNING)
    await expect(page.getByText(/Critical/i)).toBeVisible();
    await expect(page.getByText(/Medium/i)).toBeVisible();
  });

  test('should display vulnerability list with seeded findings', async ({ page }) => {
    // Expect seeded vulnerability messages to appear
    await expect(page.getByText(/Detected usage of dangerouslySetInnerHTML/i)).toBeVisible();

    await expect(page.getByText(/method-override middleware before CSRF/i)).toBeVisible();

    // Severity badges
    await expect(page.getByText('ERROR', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('WARNING', { exact: true }).first()).toBeVisible();
  });

  test('should filter vulnerabilities by severity', async ({ page }) => {
    // Click ERROR severity filter
    const errorFilter = page.getByRole('button', { name: /ERROR/i });
    await errorFilter.click();

    // URL should include severity param
    await expect(page).toHaveURL(/\bseverity=ERROR\b/);

    // Only ERROR findings should be visible
    await expect(page.getByText(/Detected usage of dangerouslySetInnerHTML/i)).toBeVisible();

    // WARNING finding should not be visible
    await expect(page.getByText(/method-override middleware before CSRF/i)).not.toBeVisible();
  });

  test('should filter vulnerabilities by status', async ({ page }) => {
    // Click false_positive status filter
    const falsePositiveFilter = page.getByRole('button', { name: /False Positive/i });
    await falsePositiveFilter.click();

    // URL should include status param
    await expect(page).toHaveURL(/\bstatus=false_positive\b/);

    // Only false_positive finding should be visible
    await expect(page.getByText(/Detected possible SQL injection/i)).toBeVisible();

    // Open findings should not be visible
    await expect(page.getByText(/Detected usage of dangerouslySetInnerHTML/i)).not.toBeVisible();
  });
});
