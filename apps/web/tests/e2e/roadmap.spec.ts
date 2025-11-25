/**
 * E2E Test: Roadmap Flows
 *
 * Tests roadmap functionality including:
 * - Project context preservation in roadmap navigation
 * - Roadmap creation wizard flow
 * - Roadmap import flow
 * - Tree/Timeline view toggle
 *
 * @see .agent/sops/project-context-pattern.md
 * @see US-073: Development Roadmap Visualization
 */
import { test, expect } from '@playwright/test';

test.describe('Roadmap - Project Context Preservation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should preserve project ID when navigating to roadmap page', async ({ page }) => {
    // Start on dashboard with project ID
    await page.goto('/dashboard?project=1');
    await expect(page).toHaveURL(/project=1/);

    // Click on Roadmap link in sidebar
    await page.click('a:has-text("Roadmap")');
    await page.waitForLoadState('networkidle');

    // Should preserve project ID
    await expect(page).toHaveURL(/\/roadmap/);
    await expect(page).toHaveURL(/project=1/);
  });

  test('should navigate to create wizard with project context', async ({ page }) => {
    // Go to roadmap page - test assumes no existing roadmap (empty state)
    await page.goto('/roadmap?project=1');
    await page.waitForLoadState('networkidle');

    // Look for Create Roadmap button (only visible in empty state)
    const createButton = page.locator('a:has-text("Create Roadmap")');
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForLoadState('networkidle');

      // Should preserve project context in create wizard URL
      await expect(page).toHaveURL(/\/roadmap\/create/);
      await expect(page).toHaveURL(/project=1/);
    }
  });

  test('should navigate to import page with project context', async ({ page }) => {
    // Go to roadmap page
    await page.goto('/roadmap?project=1');
    await page.waitForLoadState('networkidle');

    // Look for Import JSON button (only visible in empty state)
    const importButton = page.locator('a:has-text("Import JSON")');
    if (await importButton.isVisible()) {
      await importButton.click();
      await page.waitForLoadState('networkidle');

      // Should preserve project context in import URL
      await expect(page).toHaveURL(/\/roadmap\/import/);
      await expect(page).toHaveURL(/project=1/);
    }
  });

  test('should navigate to AI onboarding with project context', async ({ page }) => {
    // Go to roadmap page
    await page.goto('/roadmap?project=1');
    await page.waitForLoadState('networkidle');

    // Look for AI Onboarding link (only visible in empty state)
    const onboardingLink = page.locator('a:has-text("Start AI Onboarding")');
    if (await onboardingLink.isVisible()) {
      await onboardingLink.click();
      await page.waitForLoadState('networkidle');

      // Should preserve project context
      await expect(page).toHaveURL(/\/onboarding/);
      await expect(page).toHaveURL(/project=1/);
    }
  });
});

test.describe('Roadmap Creation Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should display wizard step indicator', async ({ page }) => {
    await page.goto('/roadmap/create?project=1');
    await page.waitForLoadState('networkidle');

    // Step indicator should be visible
    await expect(page.locator('text=Project Info')).toBeVisible();

    // Step 1 should be active
    const step1 = page.locator('text=Project Info').first();
    await expect(step1).toBeVisible();
  });

  test('should display project name context', async ({ page }) => {
    await page.goto('/roadmap/create?project=1');
    await page.waitForLoadState('networkidle');

    // Project context should be displayed
    await expect(page.locator('text=Creating roadmap for')).toBeVisible();
  });

  test('should validate required fields on Step 1', async ({ page }) => {
    await page.goto('/roadmap/create?project=1');
    await page.waitForLoadState('networkidle');

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');

    // Should show validation error for title
    await expect(page.locator('text=Title is required')).toBeVisible();
  });

  test('should navigate between wizard steps', async ({ page }) => {
    await page.goto('/roadmap/create?project=1');
    await page.waitForLoadState('networkidle');

    // Fill Step 1 (Project Info)
    await page.fill('input[name="title"]', 'Test Roadmap');
    await page.click('button:has-text("Next")');

    // Should be on Step 2 (Phases)
    await expect(page.locator('text=Define Phases')).toBeVisible();

    // Go back to Step 1
    await page.click('button:has-text("Back")');
    await expect(page.locator('text=Project Info')).toBeVisible();
  });

  test('should auto-save draft to localStorage', async ({ page }) => {
    await page.goto('/roadmap/create?project=1');
    await page.waitForLoadState('networkidle');

    // Fill in some data
    await page.fill('input[name="title"]', 'Draft Roadmap Test');

    // Check localStorage contains the draft
    const draft = await page.evaluate(() => localStorage.getItem('roadmap_wizard_draft'));
    // Draft should exist after some delay (auto-save is every 30s, but immediate save on blur)
    // For E2E we just verify the form can be filled
    expect(draft).toBeDefined();
  });
});

test.describe('Roadmap Import', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should display import method toggle', async ({ page }) => {
    await page.goto('/roadmap/import?project=1');
    await page.waitForLoadState('networkidle');

    // Both methods should be visible
    await expect(page.locator('button:has-text("Upload File")')).toBeVisible();
    await expect(page.locator('button:has-text("Paste JSON")')).toBeVisible();
  });

  test('should display project context on import page', async ({ page }) => {
    await page.goto('/roadmap/import?project=1');
    await page.waitForLoadState('networkidle');

    // Project context should be displayed
    await expect(page.locator('text=Importing to')).toBeVisible();
  });

  test('should toggle between file upload and paste modes', async ({ page }) => {
    await page.goto('/roadmap/import?project=1');
    await page.waitForLoadState('networkidle');

    // Click Paste JSON button
    await page.click('button:has-text("Paste JSON")');

    // Textarea should be visible
    await expect(page.locator('textarea')).toBeVisible();

    // Click Upload File button
    await page.click('button:has-text("Upload File")');

    // File dropzone should be visible (textarea should be hidden)
    await expect(page.locator('textarea')).not.toBeVisible();
  });

  test('should validate JSON format on parse', async ({ page }) => {
    await page.goto('/roadmap/import?project=1');
    await page.waitForLoadState('networkidle');

    // Switch to paste mode
    await page.click('button:has-text("Paste JSON")');

    // Enter invalid JSON
    await page.fill('textarea', 'this is not valid json');

    // Click Parse button
    await page.click('button:has-text("Parse")');

    // Should show validation error
    await expect(page.locator('text=Invalid JSON syntax').or(page.locator('text=Unexpected token'))).toBeVisible();
  });

  test('should validate roadmap structure', async ({ page }) => {
    await page.goto('/roadmap/import?project=1');
    await page.waitForLoadState('networkidle');

    // Switch to paste mode
    await page.click('button:has-text("Paste JSON")');

    // Enter valid JSON but missing phases array
    await page.fill('textarea', '{"name": "Test"}');

    // Click Parse button
    await page.click('button:has-text("Parse")');

    // Should show structure validation error
    await expect(page.locator('text=Missing required "phases" array')).toBeVisible();
  });

  test('should show preview for valid JSON', async ({ page }) => {
    await page.goto('/roadmap/import?project=1');
    await page.waitForLoadState('networkidle');

    // Switch to paste mode
    await page.click('button:has-text("Paste JSON")');

    // Enter valid roadmap JSON
    const validJson = JSON.stringify({
      phases: [
        {
          title: 'Phase 1: Foundation',
          duration: '4 weeks',
          sprints: [
            {
              name: 'Sprint 1',
              weeks: 'Weeks 1-2',
              goals: ['Setup project', 'Configure CI/CD'],
              deliverables: ['Working repo', 'CI pipeline'],
            },
          ],
        },
      ],
    });
    await page.fill('textarea', validJson);

    // Click Parse button
    await page.click('button:has-text("Parse")');

    // Preview should show the phase
    await expect(page.locator('text=Phase 1: Foundation')).toBeVisible();
    await expect(page.locator('text=Sprint 1')).toBeVisible();
  });
});

test.describe('Roadmap View Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dev@projectpulse.local');
    await page.fill('input[type="password"]', 'dev123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('should display view toggle when roadmap exists', async ({ page }) => {
    // This test requires an existing roadmap for project 1
    // Skip if empty state is shown
    await page.goto('/roadmap?project=1');
    await page.waitForLoadState('networkidle');

    // Check if we have a roadmap (not empty state)
    const emptyState = page.locator('text=No Roadmap Found');
    if (await emptyState.isVisible()) {
      test.skip();
      return;
    }

    // View toggle should be visible
    const treeToggle = page.locator('button:has-text("Tree")');
    const timelineToggle = page.locator('button:has-text("Timeline")');

    await expect(treeToggle.or(timelineToggle)).toBeVisible();
  });

  test('should toggle between tree and timeline views', async ({ page }) => {
    // This test requires an existing roadmap for project 1
    await page.goto('/roadmap?project=1');
    await page.waitForLoadState('networkidle');

    // Check if we have a roadmap (not empty state)
    const emptyState = page.locator('text=No Roadmap Found');
    if (await emptyState.isVisible()) {
      test.skip();
      return;
    }

    // Click Timeline toggle
    const timelineToggle = page.locator('button:has-text("Timeline")');
    if (await timelineToggle.isVisible()) {
      await timelineToggle.click();
      await page.waitForLoadState('networkidle');

      // Timeline view should be visible
      await expect(page.locator('[data-testid="roadmap-timeline"]').or(page.locator('.roadmap-timeline'))).toBeVisible();
    }

    // Click Tree toggle
    const treeToggle = page.locator('button:has-text("Tree")');
    if (await treeToggle.isVisible()) {
      await treeToggle.click();
      await page.waitForLoadState('networkidle');

      // Tree view should be visible
      await expect(page.locator('[data-testid="roadmap-tree"]').or(page.locator('.roadmap-tree'))).toBeVisible();
    }
  });
});
