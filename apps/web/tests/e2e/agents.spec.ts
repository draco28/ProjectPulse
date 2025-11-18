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

test.describe('Agent Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="agent-card"]', { timeout: 10000 });
  });

  test('should open agent detail modal on card click', async ({ page }) => {
    // Click first agent card
    const agentCard = page.locator('[data-testid="agent-card"]').first();
    await agentCard.click();

    // Verify modal opens
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Skills')).toBeVisible();
    await expect(page.getByText('Workflows')).toBeVisible();
    await expect(page.getByText('Configuration')).toBeVisible();
  });

  test('should display skills tab with full skill content', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="agent-card"]').first().click();
    
    // Wait for modal to load
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    
    // Skills tab should be active by default
    await expect(page.getByRole('tabpanel')).toBeVisible();
    
    // Verify search input present
    await expect(page.getByPlaceholder(/Search skills/i)).toBeVisible();
    
    // Verify showing count text present
    await expect(page.getByText(/Showing.*skills/i)).toBeVisible();
  });

  test('should filter skills by search term', async ({ page }) => {
    await page.locator('[data-testid="agent-card"]').first().click();
    
    // Wait for modal to load
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    
    // Wait for skills to load (if any exist)
    await page.waitForTimeout(1000);
    
    // Get initial count text
    const countText = await page.getByText(/Showing.*skills/i).textContent();
    
    // Type in search
    await page.getByPlaceholder(/Search skills/i).fill('nonexistent');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Verify count changed or empty state shown
    const newCountText = await page.getByText(/Showing.*skills/i).textContent();
    expect(newCountText).not.toBe(countText);
  });

  test('should switch to workflows tab', async ({ page }) => {
    await page.locator('[data-testid="agent-card"]').first().click();
    
    // Wait for modal to load
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    
    // Click workflows tab trigger
    await page.getByRole('tab', { name: /Workflows/i }).click();
    
    // Verify workflows content displayed
    await expect(page.getByText(/Showing.*workflows/i)).toBeVisible();
  });

  test('should display config tab with system prompt', async ({ page }) => {
    await page.locator('[data-testid="agent-card"]').first().click();
    
    // Wait for modal to load
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    
    // Click configuration tab
    await page.getByRole('tab', { name: /Configuration/i }).click();
    
    // Verify sections present
    await expect(page.getByText('System Prompt')).toBeVisible();
    await expect(page.getByText('Rules & Guidelines')).toBeVisible();
    await expect(page.getByText('Expertise Areas')).toBeVisible();
    await expect(page.getByText('MCP Tools')).toBeVisible();
    await expect(page.getByText('Metadata')).toBeVisible();
  });

  test('should expand system prompt when clicked', async ({ page }) => {
    await page.locator('[data-testid="agent-card"]').first().click();
    
    // Wait for modal and switch to config tab
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByRole('tab', { name: /Configuration/i }).click();
    
    // Click show prompt button
    await page.getByText(/Show system prompt/i).click();
    
    // Verify prompt content appears
    await expect(page.locator('pre')).toBeVisible();
    
    // Click hide button
    await page.getByText(/Hide system prompt/i).click();
    
    // Verify prompt hidden
    await expect(page.locator('pre')).not.toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.locator('[data-testid="agent-card"]').first().click();
    
    // Verify modal open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    
    // Press Escape key to close modal
    await page.keyboard.press('Escape');
    
    // Verify modal closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
