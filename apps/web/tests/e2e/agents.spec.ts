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

    // Wait for agent cards to load
    await page.waitForSelector('.agent-card', { timeout: 10000 });

    // Seeded agent names (using case-insensitive regex)
    await expect(page.getByText(/code reviewer/i)).toBeVisible();
    await expect(page.getByText(/debugging assistant/i)).toBeVisible();
    await expect(page.getByText(/documentation writer/i)).toBeVisible();
  });

  test('should toggle agent status with optimistic UI', async ({ page }) => {
    // Wait for agent cards to load
    await page.waitForSelector('.agent-card', { timeout: 10000 });
    
    // Find the Code Reviewer card using data-testid
    const codeReviewerCard = page.locator('.agent-card').filter({ hasText: 'Code Reviewer' });
    const toggleButton = codeReviewerCard.getByTestId('agent-toggle');

    // Verify initial state is Inactive
    await expect(codeReviewerCard.getByText('Inactive')).toBeVisible();

    // Click to activate
    await toggleButton.click();

    // Status badge should change to "Active" (optimistic UI)
    await expect(codeReviewerCard.getByText('Active')).toBeVisible({ timeout: 10000 });

    // Toggle back off to restore original state
    await toggleButton.click();
    await expect(codeReviewerCard.getByText('Inactive')).toBeVisible({ timeout: 10000 });
  });

  test('should persist agent state across page reloads', async ({ page }) => {
    // Wait for agent cards to load
    await page.waitForSelector('.agent-card', { timeout: 10000 });
    
    // Activate Debugging Assistant
    const debuggerCard = page.locator('.agent-card').filter({ hasText: 'Debugging Assistant' });
    const toggleButton = debuggerCard.getByTestId('agent-toggle');

    await toggleButton.click();
    await expect(debuggerCard.getByText('Active')).toBeVisible({ timeout: 10000 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.agent-card', { timeout: 10000 });

    // State should persist - card should still show active
    const reloadedCard = page.locator('.agent-card').filter({ hasText: 'Debugging Assistant' });
    await expect(reloadedCard.getByText('Active')).toBeVisible();

    // Clean up: toggle back off
    const reloadedToggle = reloadedCard.getByTestId('agent-toggle');
    await reloadedToggle.click();
    await expect(reloadedCard.getByText('Inactive')).toBeVisible({ timeout: 10000 });
  });
});
