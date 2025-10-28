/**
 * E2E Test: Wiki Page
 *
 * Covers:
 * - Page render with TOC and content
 * - TOC scroll spy (highlights active section)
 * - Related pages navigation
 *
 * Seeded data (apps/web/prisma/seed.ts):
 * - Getting Started page (/getting-started) with headings: Introduction, Installation, Usage
 * - Configuration page (/configuration) linked from Getting Started
 */
import { test, expect } from '@playwright/test';

test.describe('Wiki Page', () => {
  test('should render wiki page with TOC and content', async ({ page }) => {
    await page.goto('/wiki/getting-started');
    await page.waitForLoadState('networkidle');

    // Page title
    await expect(page.getByRole('heading', { name: 'Getting Started', level: 1 })).toBeVisible();

    // TOC sidebar
    await expect(page.getByText('Table of Contents')).toBeVisible();

    // TOC items (from markdown headings)
    await expect(page.getByRole('link', { name: 'Introduction' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Installation' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Usage' })).toBeVisible();
  });

  test('should highlight active TOC item on scroll', async ({ page }) => {
    await page.goto('/wiki/getting-started');
    await page.waitForLoadState('networkidle');

    // Scroll to "Installation" section
    await page.locator('#installation').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300); // Allow scroll spy to update

    // TOC link for Installation should have active state (coral color or specific class)
    const installationLink = page.getByRole('link', { name: 'Installation' });
    await expect(installationLink).toHaveClass(/text-coral|bg-coral/);
  });

  test('should navigate to related pages', async ({ page }) => {
    await page.goto('/wiki/getting-started');
    await page.waitForLoadState('networkidle');

    // Related pages section
    await expect(page.getByText('Related Pages')).toBeVisible();

    // Click the Configuration related page link
    const configLink = page.getByRole('link', { name: 'Configuration' });
    await configLink.click();

    // Should navigate to the configuration page
    await expect(page).toHaveURL(/\/wiki\/configuration/);
    await expect(page.getByRole('heading', { name: 'Configuration', level: 1 })).toBeVisible();
  });
});
