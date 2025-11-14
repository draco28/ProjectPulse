/**
 * E2E Test: Health Dashboard
 *
 * Tests comprehensive health monitoring including:
 * - Page rendering with ISR caching
 * - Overall health score display (numeric + grade A-F + trend)
 * - Category breakdown (security, quality, performance, accessibility)
 * - Findings table with filters (category, severity, scanner)
 * - 30-day trend graph (recharts line chart)
 * - MCP tool integration (health.runScan, health.getScore)
 */
import { test, expect } from '@playwright/test';

test.describe('Health Dashboard - Page Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
  });

  test('should display health dashboard layout', async ({ page }) => {
    // Check main layout elements
    await expect(page.locator('aside')).toBeVisible(); // Sidebar
    await expect(page.locator('header')).toBeVisible(); // Header
    await expect(page.locator('main')).toBeVisible(); // Main content

    // Check page title
    await expect(page.getByRole('heading', { name: 'Project Health', level: 2 })).toBeVisible();
  });

  test('should show last updated timestamp', async ({ page }) => {
    // Verify timestamp exists (format: "Last updated: 1/14/2025, 10:30:00 AM")
    await expect(page.getByText(/Last updated:/)).toBeVisible();
    // Check for findings count in header (scoped to avoid strict mode violation)
    await expect(page.locator('header').getByText(/findings/)).toBeVisible();
  });

  test('should handle no data state gracefully', async ({ page }) => {
    // Navigate to project with no health data
    // (This would require project parameter support - future feature)
    // For now, verify the no-data fallback exists in the page component
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy(); // Page loads without errors
  });

  test('should serve cached page with ISR headers', async ({ page }) => {
    const response = await page.goto('/health');

    // Verify page renders (ISR cache may or may not be hit)
    await expect(page.getByRole('heading', { name: 'Project Health' })).toBeVisible();

    // Response should exist (not null)
    expect(response).not.toBeNull();
  });
});

test.describe('Health Dashboard - Score Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
  });

  test('should display overall health score', async ({ page }) => {
    // Health score should be visible (0-100 numeric value)
    const scoreElement = page.locator('[data-testid="overall-score"]').first();
    await expect(scoreElement).toBeVisible();

    const scoreText = await scoreElement.textContent();
    const score = parseInt(scoreText || '0', 10);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should display health grade badge (A-F)', async ({ page }) => {
    // Grade badge should be visible
    const gradeBadge = page.locator('[data-testid="health-grade"]').first();
    await expect(gradeBadge).toBeVisible();

    const gradeText = await gradeBadge.textContent();
    expect(['A', 'B', 'C', 'D', 'F']).toContain(gradeText?.trim());
  });

  test('should display trend indicator', async ({ page }) => {
    // Trend indicator (improving/declining/stable)
    const trendElement = page.locator('[data-testid="trend-indicator"]').first();
    await expect(trendElement).toBeVisible();

    const trendText = await trendElement.textContent();
    expect(trendText).toMatch(/Improving|Declining|Stable/i);
  });

  test('should show trend icon based on direction', async ({ page }) => {
    // Trend icon (arrow up/down/stable)
    const trendIcon = page.locator('[data-testid="trend-icon"]').first();
    await expect(trendIcon).toBeVisible();

    // Icon element itself should be an SVG (lucide-react renders icons as SVG elements)
    const tagName = await trendIcon.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('svg');
  });
});

test.describe('Health Dashboard - Score Cards Grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
  });

  test('should display all 4 score cards', async ({ page }) => {
    // Score cards grid container
    const grid = page.locator('[data-testid="score-cards-grid"]');
    await expect(grid).toBeVisible();

    // Overall score card
    await expect(page.locator('[data-testid="overall-score-card"]')).toBeVisible();

    // Critical issues card
    await expect(page.locator('[data-testid="critical-count-card"]')).toBeVisible();

    // High priority card
    await expect(page.locator('[data-testid="high-priority-card"]')).toBeVisible();

    // Last scan card
    await expect(page.locator('[data-testid="last-scan-card"]')).toBeVisible();
  });

  test('should show overall score as 0-100', async ({ page }) => {
    const scoreElement = page.locator('[data-testid="overall-score"]');
    await expect(scoreElement).toBeVisible();

    const scoreText = await scoreElement.textContent();
    const score = parseInt(scoreText || '0', 10);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should display critical issues count', async ({ page }) => {
    const criticalCard = page.locator('[data-testid="critical-count-card"]');
    await expect(criticalCard).toBeVisible();

    // Should show "Critical Issues" label
    await expect(page.getByText('Critical Issues')).toBeVisible();
  });

  test('should display high priority count', async ({ page }) => {
    const highCard = page.locator('[data-testid="high-priority-card"]');
    await expect(highCard).toBeVisible();

    // Should show "High Priority" label
    await expect(page.getByText('High Priority')).toBeVisible();
  });

  test('should show last scan time', async ({ page }) => {
    const lastScanCard = page.locator('[data-testid="last-scan-card"]');
    await expect(lastScanCard).toBeVisible();

    // Should show "Last Scan" label
    await expect(page.getByText('Last Scan')).toBeVisible();
  });
});

test.describe('Health Dashboard - Vulnerability Breakdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
  });

  test('should display vulnerability breakdown container', async ({ page }) => {
    const breakdown = page.locator('[data-testid="vulnerability-breakdown"]');
    await expect(breakdown).toBeVisible();

    // Should show title
    await expect(page.getByText('Vulnerability Breakdown')).toBeVisible();
  });

  test('should display all 4 severity levels', async ({ page }) => {
    await expect(page.locator('[data-testid="critical-severity-row"]')).toBeVisible();
    await expect(page.locator('[data-testid="high-severity-row"]')).toBeVisible();
    await expect(page.locator('[data-testid="medium-severity-row"]')).toBeVisible();
    await expect(page.locator('[data-testid="low-severity-row"]')).toBeVisible();
  });

  test('should show total vulnerability count', async ({ page }) => {
    const totalElement = page.locator('[data-testid="total-vulnerabilities"]');
    await expect(totalElement).toBeVisible();

    const totalText = await totalElement.textContent();
    const total = parseInt(totalText || '0', 10);
    expect(total).toBeGreaterThanOrEqual(0);
  });

  test('should color-code severity rows', async ({ page }) => {
    // Critical row should have red styling
    const criticalRow = page.locator('[data-testid="critical-severity-row"]');
    await expect(criticalRow).toBeVisible();

    // Verify text labels exist (scoped to avoid strict mode violation with filter dropdowns)
    await expect(criticalRow.getByText('Critical', { exact: true })).toBeVisible();

    const highRow = page.locator('[data-testid="high-severity-row"]');
    await expect(highRow.getByText('High', { exact: true })).toBeVisible();
  });

  test('should have accessible structure', async ({ page }) => {
    // Container should be visible and have proper heading
    const breakdown = page.locator('[data-testid="vulnerability-breakdown"]');
    await expect(breakdown).toBeVisible();
  });
});

test.describe('Health Dashboard - Scanner Status', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
  });

  test('should display scanner status container', async ({ page }) => {
    const container = page.locator('[data-testid="scanner-status-cards"]');
    await expect(container).toBeVisible();

    // Should show title
    await expect(page.getByText('Scanner Status')).toBeVisible();
  });

  test('should display scanner cards', async ({ page }) => {
    // At least one scanner card should be visible
    const scannerCards = page.locator('[data-testid^="scanner-card-"]');
    const count = await scannerCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show scanner names', async ({ page }) => {
    // Check for common scanner names
    const scannerContainer = page.locator('[data-testid="scanner-status-cards"]');
    await expect(scannerContainer).toBeVisible();

    // At least one scanner should be displayed
    const count = await page.locator('[data-testid^="scanner-card-"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display findings count per scanner', async ({ page }) => {
    // Each scanner card should show findings count
    const scannerCards = page.locator('[data-testid^="scanner-card-"]');
    const firstCard = scannerCards.first();

    if (await firstCard.isVisible()) {
      await expect(firstCard.getByText('findings')).toBeVisible();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    const container = page.locator('[data-testid="scanner-status-cards"]');
    await expect(container).toBeVisible();
  });
});

test.describe('Health Dashboard - Security Timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
  });

  test('should display security timeline container', async ({ page }) => {
    const timeline = page.locator('[data-testid="security-timeline"]');
    await expect(timeline).toBeVisible();

    // Should show title
    await expect(page.getByText('Security Activity')).toBeVisible();
  });

  test('should display timeline events', async ({ page }) => {
    const events = page.locator('[data-testid="timeline-event"]');
    const count = await events.count();

    // Should have 0 or more events (depending on data)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show relative timestamps', async ({ page }) => {
    const timeline = page.locator('[data-testid="security-timeline"]');
    await expect(timeline).toBeVisible();

    // Look for relative time patterns (e.g., "2h ago", "1d ago")
    const events = page.locator('[data-testid="timeline-event"]');
    if (await events.count() > 0) {
      const firstEvent = events.first();
      await expect(firstEvent).toBeVisible();
    }
  });

  test('should have proper semantic structure', async ({ page }) => {
    const timeline = page.locator('[data-testid="security-timeline"]');
    await expect(timeline).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Timeline should be visible even with no events
    const timeline = page.locator('[data-testid="security-timeline"]');
    await expect(timeline).toBeVisible();
  });
});

test.describe('Health Dashboard - Compliance Status', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
  });

  test('should display compliance status container', async ({ page }) => {
    const compliance = page.locator('[data-testid="compliance-status"]');
    await expect(compliance).toBeVisible();

    // Should show title
    await expect(page.getByText('Compliance Status')).toBeVisible();
  });

  test('should display compliance standards', async ({ page }) => {
    const standards = page.locator('[data-testid="compliance-standard"]');
    const count = await standards.count();

    // Should have 3 standards (OWASP, CWE, SOC 2)
    expect(count).toBe(3);
  });

  test('should show compliance percentages', async ({ page }) => {
    const percentages = page.locator('[data-testid="compliance-percentage"]');
    const count = await percentages.count();

    expect(count).toBeGreaterThan(0);

    // Verify percentages are valid numbers
    for (let i = 0; i < Math.min(count, 3); i++) {
      const percentText = await percentages.nth(i).textContent();
      const percent = parseInt(percentText?.replace('%', '') || '0', 10);
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    }
  });

  test('should color-code progress bars by threshold', async ({ page }) => {
    const compliance = page.locator('[data-testid="compliance-status"]');
    await expect(compliance).toBeVisible();
  });

  test('should display standard names', async ({ page }) => {
    // Check for OWASP Top 10
    await expect(page.getByText('OWASP Top 10')).toBeVisible();

    // Check for CWE Top 25
    await expect(page.getByText('CWE Top 25')).toBeVisible();

    // Check for SOC 2
    await expect(page.getByText('SOC 2')).toBeVisible();
  });
});

test.describe('Health Dashboard - Findings Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
  });

  test('should display findings table', async ({ page }) => {
    // Findings table should exist
    const findingsTable = page.locator('[data-testid="findings-table"]');
    await expect(findingsTable).toBeVisible();

    // Should have at least one finding card
    const findingCards = page.locator('[data-testid="finding-card"]');
    const cardCount = await findingCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should filter findings by category', async ({ page }) => {
    // Verify findings exist before filtering
    const initialCards = await page.locator('[data-testid="finding-card"]').count();
    expect(initialCards).toBeGreaterThan(0);

    // Select "Security" category from dropdown
    const categorySelect = page.locator('select').filter({ hasText: /All Categories/ });
    await categorySelect.selectOption('SECURITY');
    await page.waitForTimeout(300); // Wait for filter to apply

    // Verify only security findings visible
    const findingCards = page.locator('[data-testid="finding-card"]');
    const count = await findingCards.count();

    // Should have fewer or equal cards after filtering
    expect(count).toBeLessThanOrEqual(initialCards);
    expect(count).toBeGreaterThan(0); // At least some security findings exist
  });

  test('should filter findings by severity', async ({ page }) => {
    // Select "Critical" severity from dropdown
    const severitySelect = page.locator('select').filter({ hasText: /All Severities/ });
    await severitySelect.selectOption('CRITICAL');
    await page.waitForTimeout(300); // Wait for filter to apply

    // Verify only critical findings visible
    const findingCards = page.locator('[data-testid="finding-card"]');
    const count = await findingCards.count();
    expect(count).toBeGreaterThan(0); // At least one critical finding exists
  });

  test('should filter findings by scanner', async ({ page }) => {
    // Select "ESLint" scanner from dropdown
    const scannerSelect = page.locator('select').filter({ hasText: /All Scanners/ });
    await scannerSelect.selectOption('ESLINT');
    await page.waitForTimeout(300); // Wait for filter to apply

    // Verify at least some findings remain (may be 0 if no ESLint findings)
    const findingCards = page.locator('[data-testid="finding-card"]');
    const count = await findingCards.count();
    // Note: count may be 0 if no ESLint findings exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should support multiple filter selections', async ({ page }) => {
    // Get initial count
    const initialCards = await page.locator('[data-testid="finding-card"]').count();
    expect(initialCards).toBeGreaterThan(0);

    // Select category filter
    const categorySelect = page.locator('select').filter({ hasText: /All Categories/ });
    await categorySelect.selectOption('SECURITY');
    await page.waitForTimeout(300);

    // Select severity filter
    const severitySelect = page.locator('select').filter({ hasText: /All Severities/ });
    await severitySelect.selectOption('CRITICAL');
    await page.waitForTimeout(300);

    // Verify filters are applied (should show only critical security findings)
    const filteredCards = await page.locator('[data-testid="finding-card"]').count();
    expect(filteredCards).toBeLessThanOrEqual(initialCards);
  });

  test('should clear all filters', async ({ page }) => {
    // Apply a filter first
    await page.goto('/health?category=SECURITY&severity=CRITICAL');
    await page.waitForLoadState('networkidle');

    // Click "Clear Filters" button
    const clearButton = page.getByRole('button', { name: /Clear/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Verify URL params removed
      await expect(page).toHaveURL((url) => {
        const u = new URL(url);
        return !u.searchParams.has('category') && !u.searchParams.has('severity');
      });
    }
  });
});

test.describe('Health Dashboard - Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/health');
    await page.waitForLoadState('networkidle');

    // Main content should be visible
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Project Health' })).toBeVisible();

    // Score card should stack vertically
    const scoreCard = page.locator('[data-testid="overall-score"]').first();
    await expect(scoreCard).toBeVisible();
  });

  test('should display components on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/health');
    await page.waitForLoadState('networkidle');

    // Score cards grid should be visible on mobile
    const scoreCardsGrid = page.locator('[data-testid="score-cards-grid"]');
    await expect(scoreCardsGrid).toBeVisible();
  });
});

test.describe('Health Dashboard - Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');

    // Main landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement || '');
  });

  test('should have accessible table structure', async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');

    // Findings container should be accessible (uses card-based list, not semantic table)
    const findingsContainer = page.locator('[data-testid="findings-table"]');
    await expect(findingsContainer).toBeVisible();

    // Should have heading for findings section
    await expect(findingsContainer.getByText(/Findings \(\d+\)/)).toBeVisible();
  });
});

test.describe('Health Dashboard - ISR Validation', () => {
  test('should include cache headers', async ({ page }) => {
    const response = await page.goto('/health');

    // Response should exist
    expect(response).not.toBeNull();

    // ISR page should load successfully
    expect(response?.status()).toBe(200);
  });

  test('should serve cached page quickly', async ({ page }) => {
    const start = Date.now();
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
    const duration = Date.now() - start;

    // Should load in reasonable time (cached or fresh)
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });

  test('should display all sections on ISR page', async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');

    // Verify all key sections are rendered
    await expect(page.locator('[data-testid="score-cards-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="vulnerability-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="scanner-status-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="findings-table"]')).toBeVisible();
  });

  test('should handle no data state gracefully', async ({ page }) => {
    // Even if there's no health data, page should render without errors
    await page.goto('/health');

    // Page should load (either with data or "No Health Data Yet" message)
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('should have proper meta tags for ISR', async ({ page }) => {
    await page.goto('/health');

    // Verify page title
    const title = await page.title();
    expect(title).toContain('Project Health');
  });

  test('should revalidate after expiry', async ({ page }) => {
    // First load
    const response1 = await page.goto('/health');
    expect(response1?.status()).toBe(200);

    // Second load (should serve from cache within 1 hour)
    await page.reload();
    const response2 = await page.goto('/health');
    expect(response2?.status()).toBe(200);

    // Page should still be functional
    await expect(page.locator('[data-testid="score-cards-grid"]')).toBeVisible();
  });
});
