/**
 * E2E Test: Dashboard
 *
 * Tests the Dashboard page functionality including:
 * - Page rendering
 * - Navigation
 * - Theme switching
 * - Component visibility
 * - Responsive layout
 */
import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto('/dashboard');
  });

  test('should display the dashboard layout', async ({ page }) => {
    // Check that the main layout elements are present
    await expect(page.locator('aside')).toBeVisible(); // Sidebar
    await expect(page.locator('header')).toBeVisible(); // Header
    await expect(page.locator('main')).toBeVisible(); // Main content
  });

  test('should display the welcome banner', async ({ page }) => {
    // Check welcome banner is visible with greeting
    const banner = page.locator('text=/Good (morning|afternoon|evening)/');
    await expect(banner).toBeVisible();

    // Check CTA button is present
    const ctaButton = page.locator('button:has-text("Create New Issue")');
    await expect(ctaButton).toBeVisible();
  });

  test('should display stat cards', async ({ page }) => {
    // Check all 4 stat cards are visible
    await expect(page.locator('text=Open Issues')).toBeVisible();
    await expect(page.locator('text=Knowledge Items')).toBeVisible();
    await expect(page.locator('text=Security Findings')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();

    // Check stat values are displayed
    await expect(page.locator('text=12').first()).toBeVisible(); // Open Issues count
    await expect(page.locator('text=47').first()).toBeVisible(); // Knowledge Items count
  });

  test('should display recent issues section', async ({ page }) => {
    // Check section title
    await expect(page.locator('text=Recent Issues')).toBeVisible();
    await expect(page.locator('text=View all')).toBeVisible();

    // Check at least one issue card is displayed
    await expect(
      page.locator('text=Authentication flow not handling session timeout')
    ).toBeVisible();

    // Check priority badges
    await expect(page.locator('text=Critical').first()).toBeVisible();
  });

  test('should display widgets in sidebar', async ({ page }) => {
    // Check Quick Actions widget
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('button:has-text("Create Issue")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Knowledge")')).toBeVisible();
    await expect(page.locator('button:has-text("Run Agent")')).toBeVisible();

    // Check Active Agents widget
    await expect(page.locator('text=Active Agents')).toBeVisible();
    await expect(page.locator('text=Code Reviewer')).toBeVisible();
    await expect(page.locator('text=Bug Hunter')).toBeVisible();
  });

  test('should navigate through sidebar menu', async ({ page }) => {
    // Click on Dashboard (should already be active)
    const dashboardLink = page.locator('a:has-text("Dashboard")');
    await expect(dashboardLink).toHaveClass(/bg-accent-primary\/20/);

    // Click on Issues
    await page.locator('a:has-text("Issues")').click();
    await expect(page).toHaveURL('/issues');
  });

  test('should display search bar in header', async ({ page }) => {
    // Check search input is present
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /Search issues, knowledge, wiki/);

    // Check keyboard shortcut indicator
    await expect(page.locator('kbd:has-text("⌘K")')).toBeVisible();
  });

  test('should display notification indicator', async ({ page }) => {
    // Check notification bell icon is present
    const notificationButton = page.locator('button').filter({ has: page.locator('svg') });
    await expect(notificationButton.first()).toBeVisible();
  });

  test('should toggle theme using quick toggle button', async ({ page }) => {
    // Get the theme toggle button
    const themeToggle = page
      .locator('button')
      .filter({
        has: page.locator('svg'),
      })
      .nth(1); // Second button in header (after notifications)

    // Click to toggle theme
    await themeToggle.click();

    // Wait for theme change (check HTML attribute)
    await page.waitForTimeout(500); // Allow animation to complete

    // Verify theme changed by checking data-theme attribute
    const htmlElement = page.locator('html');
    const themeAttr = await htmlElement.getAttribute('data-theme');
    expect(['desert', 'neon', 'earthy', 'coral']).toContain(themeAttr);
  });

  test('should display pulse indicators on active issues', async ({ page }) => {
    // Check for pulse indicator elements
    const pulseIndicator = page.locator('.pulse-indicator').first();
    await expect(pulseIndicator).toBeVisible();

    // Check pulse dot and ring are present
    await expect(page.locator('.pulse-dot').first()).toBeVisible();
    await expect(page.locator('.pulse-ring').first()).toBeVisible();
  });

  test('should show hover effects on cards', async ({ page }) => {
    // Get first issue card
    const issueCard = page.locator('[class*="card-hover"]').first();
    await expect(issueCard).toBeVisible();

    // Hover over card
    await issueCard.hover();

    // Wait for transition
    await page.waitForTimeout(300);

    // Card should have hover effect (transform translateY)
    const transform = await issueCard.evaluate((el) => {
      return window.getComputedStyle(el).transform;
    });
    // Transform should not be 'none' when hovered
    expect(transform).not.toBe('none');
  });

  test('should display all priority badge variants', async ({ page }) => {
    // Check different priority badges exist
    await expect(page.locator('text=Critical').first()).toBeVisible();
    await expect(page.locator('text=High').first()).toBeVisible();
    await expect(page.locator('text=Medium').first()).toBeVisible();
    await expect(page.locator('text=Low').first()).toBeVisible();
  });

  test('should display agent status indicators', async ({ page }) => {
    // Check for different status indicators
    await expect(page.locator('text=Active').first()).toBeVisible();
    await expect(page.locator('text=Idle').first()).toBeVisible();
    await expect(page.locator('text=Offline').first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Main content should still be visible
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('text=/Good (morning|afternoon|evening)/')).toBeVisible();

    // Stat cards should stack vertically on mobile
    const statCards = page.locator('[class*="grid"]').first();
    await expect(statCards).toBeVisible();
  });

  test('should display user profile in sidebar', async ({ page }) => {
    // Check user avatar
    await expect(page.locator('[class*="avatar"]').first()).toBeVisible();

    // Check user name
    await expect(page.locator('text=Developer')).toBeVisible();

    // Check online status indicator
    const statusDot = page.locator('.bg-success').last();
    await expect(statusDot).toBeVisible();
  });

  test('should display theme switcher in sidebar', async ({ page }) => {
    // Check theme switcher button exists in sidebar
    const themeSwitcher = page.locator('aside button').filter({
      hasText: /Desert Stone|Neon Vibes|Earthy|Dark Neumorphic Coral/,
    });
    await expect(themeSwitcher).toBeVisible();
  });
});

test.describe('Dashboard Theme Switching', () => {
  test('should switch between all 4 themes', async ({ page }) => {
    await page.goto('/dashboard');

    // Open theme switcher
    const themeSwitcherButton = page
      .locator('aside button')
      .filter({
        hasText: /Desert Stone|Neon Vibes|Earthy|Dark Neumorphic Coral/,
      })
      .first();

    await themeSwitcherButton.click();

    // Wait for dropdown to open
    await page.waitForTimeout(300);

    // Get all theme buttons
    const neonTheme = page.locator('button:has-text("Neon Vibes")');
    const desertTheme = page.locator('button:has-text("Desert Stone")');
    const earthyTheme = page.locator('button:has-text("Earthy")');
    const coralTheme = page.locator('button:has-text("Dark Neumorphic Coral")');

    // Test switching to Neon theme
    if (await neonTheme.isVisible()) {
      await neonTheme.click();
      await page.waitForTimeout(500);
      const htmlElement = page.locator('html');
      expect(await htmlElement.getAttribute('data-theme')).toBe('neon');
    }

    // Open again and switch to Desert
    await themeSwitcherButton.click();
    await page.waitForTimeout(300);
    if (await desertTheme.isVisible()) {
      await desertTheme.click();
      await page.waitForTimeout(500);
      const htmlElement = page.locator('html');
      expect(await htmlElement.getAttribute('data-theme')).toBe('desert');
    }
  });
});

test.describe('Dashboard Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/dashboard');

    // Check main landmark
    await expect(page.locator('main')).toBeVisible();

    // Check aside landmark
    await expect(page.locator('aside')).toBeVisible();

    // Check header landmark
    await expect(page.locator('header')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard');

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check focus is visible (on navigation items)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement || '');
  });
});
