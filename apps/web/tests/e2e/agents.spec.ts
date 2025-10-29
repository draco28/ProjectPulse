/**
 * E2E Test: Agent Personas Page
 *
 * Covers:
 * - Page render with agent cards
 * - Toggle agent active state (optimistic UI)
 * - Verify server state persists
 *
 * Seeded data (apps/web/prisma/seed.ts):
 * - 3 agent personas: Code Reviewer, Debugging Assistant, Documentation Writer
 * - All initially inactive (isActive: false by default)
 */
import { test, expect } from '@playwright/test';

test.describe('Agent Personas Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
  });

  test('should render header and agent cards', async ({ page }) => {
    // Page header
    await expect(page.getByRole('heading', { name: 'Agent Personas' })).toBeVisible();

    // Stats (0 active, 3 total initially)
    await expect(page.getByText(/0 active • 3 total agents/i)).toBeVisible();

    // Seeded agent names
    await expect(page.getByText('Code Reviewer', { exact: true })).toBeVisible();
    await expect(page.getByText('Debugging Assistant', { exact: true })).toBeVisible();
    await expect(page.getByText('Documentation Writer', { exact: true })).toBeVisible();
  });

  test('should toggle agent status with optimistic UI', async ({ page }) => {
    // Find the Code Reviewer card toggle switch
    const codeReviewerCard = page.locator('text=Code Reviewer').locator('..');
    const toggleSwitch = codeReviewerCard
      .getByRole('button', { name: /toggle|activate/i })
      .or(
        codeReviewerCard.locator('button').filter({ hasText: '' }) // Toggle might be icon-only
      )
      .first();

    // Click to activate
    await toggleSwitch.click();

    // Optimistic UI: card should show active state immediately (ring or visual change)
    await expect(codeReviewerCard).toHaveClass(/ring-coral|ring-2/);

    // Wait for server action to complete (check stats update)
    await expect(page.getByText(/1 active • 3 total agents/i)).toBeVisible({ timeout: 5000 });

    // Toggle back off to restore original state
    await toggleSwitch.click();
    await expect(page.getByText(/0 active • 3 total agents/i)).toBeVisible({ timeout: 5000 });
  });

  test('should persist agent state across page reloads', async ({ page }) => {
    // Activate Debugging Assistant
    const debuggerCard = page.locator('text=Debugging Assistant').locator('..');
    const toggleSwitch = debuggerCard.getByRole('button').first();

    await toggleSwitch.click();
    await expect(page.getByText(/1 active • 3 total agents/i)).toBeVisible({ timeout: 5000 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // State should persist (1 active)
    await expect(page.getByText(/1 active • 3 total agents/i)).toBeVisible();

    // Debugging Assistant card should still show active state
    const reloadedCard = page.locator('text=Debugging Assistant').locator('..');
    await expect(reloadedCard).toHaveClass(/ring-coral|ring-2/);

    // Clean up: toggle back off
    const reloadedToggle = reloadedCard.getByRole('button').first();
    await reloadedToggle.click();
    await expect(page.getByText(/0 active • 3 total agents/i)).toBeVisible({ timeout: 5000 });
  });
});
