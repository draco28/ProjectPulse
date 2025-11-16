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
    // Page header (exact match to avoid strict mode violation with info banner)
    await expect(page.getByRole('heading', { name: 'Agent Personas', exact: true })).toBeVisible();

    // Stats cards (separate cards for active and total)
    await expect(page.getByText('Active Agents')).toBeVisible();
    await expect(page.getByText('Total Agents')).toBeVisible();

    // Seeded agent names
    await expect(page.getByText('Code Reviewer', { exact: true })).toBeVisible();
    await expect(page.getByText('Debugging Assistant', { exact: true })).toBeVisible();
    await expect(page.getByText('Documentation Writer', { exact: true })).toBeVisible();
  });

  test('should toggle agent status with optimistic UI', async ({ page }) => {
    // Find the Code Reviewer card and its toggle switch
    const codeReviewerCard = page.locator('.agent-card').filter({ hasText: 'Code Reviewer' });
    const toggleSwitch = codeReviewerCard.getByRole('button', { name: /activate agent/i });

    // Click to activate
    await toggleSwitch.click();

    // Optimistic UI: card should show active state immediately (ring-2 ring-coral/50)
    await expect(codeReviewerCard).toHaveClass(/ring-2/);
    await expect(codeReviewerCard).toHaveClass(/ring-coral/);

    // Status badge should change to "Active"
    await expect(codeReviewerCard.getByText('Active')).toBeVisible({ timeout: 5000 });

    // Toggle back off to restore original state
    const deactivateButton = codeReviewerCard.getByRole('button', { name: /deactivate agent/i });
    await deactivateButton.click();
    await expect(codeReviewerCard.getByText('Inactive')).toBeVisible({ timeout: 5000 });
  });

  test('should persist agent state across page reloads', async ({ page }) => {
    // Activate Debugging Assistant
    const debuggerCard = page.locator('.agent-card').filter({ hasText: 'Debugging Assistant' });
    const toggleSwitch = debuggerCard.getByRole('button', { name: /activate agent/i });

    await toggleSwitch.click();
    await expect(debuggerCard.getByText('Active')).toBeVisible({ timeout: 5000 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // State should persist - card should still show active
    const reloadedCard = page.locator('.agent-card').filter({ hasText: 'Debugging Assistant' });
    await expect(reloadedCard.getByText('Active')).toBeVisible();
    await expect(reloadedCard).toHaveClass(/ring-2/);

    // Clean up: toggle back off
    const deactivateButton = reloadedCard.getByRole('button', { name: /deactivate agent/i });
    await deactivateButton.click();
    await expect(reloadedCard.getByText('Inactive')).toBeVisible({ timeout: 5000 });
  });
});
