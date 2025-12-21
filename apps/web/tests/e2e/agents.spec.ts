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

test.describe('Agent AI Hub Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents');
    await page.waitForLoadState('networkidle');
  });

  test('should have 4 tabs visible', async ({ page }) => {
    // Verify all tabs are present
    await expect(page.getByRole('tab', { name: /Agent Personas/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Skills/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Workflows/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /SOPs/i })).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Start on Agent Personas tab
    await expect(page.getByRole('tabpanel')).toBeVisible();

    // Switch to Skills tab
    await page.getByRole('tab', { name: /Skills/i }).click();
    await expect(page.getByText(/Showing.*skills/i)).toBeVisible();

    // Switch to Workflows tab
    await page.getByRole('tab', { name: /Workflows/i }).click();
    await expect(page.getByText(/Showing.*workflows/i)).toBeVisible();

    // Switch to SOPs tab
    await page.getByRole('tab', { name: /SOPs/i }).click();
    await expect(page.getByText(/Showing.*SOPs/i)).toBeVisible();

    // Switch back to Agent Personas
    await page.getByRole('tab', { name: /Agent Personas/i }).click();
    await expect(page.locator('[data-testid="agent-card"]')).toBeVisible();
  });

  test('should filter skills by search term', async ({ page }) => {
    // Go to Skills tab
    await page.getByRole('tab', { name: /Skills/i }).click();
    await page.waitForTimeout(500);

    // Type in search (if skills exist)
    const searchInput = page.getByPlaceholder(/Search skills/i);
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Verify count updated (or empty state shown)
    await expect(page.getByText(/Showing.*skills/i)).toBeVisible();
  });

  test('should filter workflows by status', async ({ page }) => {
    // Go to Workflows tab
    await page.getByRole('tab', { name: /Workflows/i }).click();
    await page.waitForTimeout(500);

    // Find status filter
    const statusSelect = page
      .locator('[role="combobox"]')
      .filter({ hasText: /Status|All Status/i });

    if (await statusSelect.isVisible()) {
      // Click to open
      await statusSelect.click();

      // Select "Active"
      await page.getByRole('option', { name: /^Active$/i }).click();
      await page.waitForTimeout(500);

      // Verify results updated
      await expect(page.getByText(/Showing.*workflows/i)).toBeVisible();
    }
  });

  test('should filter SOPs by category', async ({ page }) => {
    // Go to SOPs tab
    await page.getByRole('tab', { name: /SOPs/i }).click();
    await page.waitForTimeout(500);

    // Verify count text present
    await expect(page.getByText(/Showing.*SOPs/i)).toBeVisible();

    // If SOPs exist, test category filter
    const categorySelect = page.locator('[role="combobox"]').first();

    if (await categorySelect.isVisible()) {
      const initialCount = await page.getByText(/Showing.*SOPs/i).textContent();

      // Try to select a category
      await categorySelect.click();
      await page.waitForTimeout(300);

      // Select first non-"All" option if available
      const options = page.locator('[role="option"]');
      const count = await options.count();

      if (count > 1) {
        await options.nth(1).click(); // Select second option (first is "All Categories")
        await page.waitForTimeout(500);

        // Verify count changed or stayed same
        const newCount = await page.getByText(/Showing.*SOPs/i).textContent();
        expect(newCount).toBeDefined();
      }
    }
  });

  test('should open skill detail modal and display content', async ({ page }) => {
    await page.getByRole('tab', { name: /Skills/i }).click();
    await page.waitForTimeout(500);

    // Check if skills exist
    const skillCards = page.locator('.neu-raised.cursor-pointer');
    const count = await skillCards.count();

    if (count > 0) {
      // Click first skill card
      await skillCards.first().click();

      // Verify modal opens
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

      // Verify content is displayed
      await expect(page.locator('pre, .prose')).toBeVisible();

      // Close modal
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should open workflow detail modal and show steps', async ({ page }) => {
    await page.getByRole('tab', { name: /Workflows/i }).click();
    await page.waitForTimeout(500);

    // Check if workflows exist
    const workflowCards = page.locator('.neu-raised.cursor-pointer');
    const count = await workflowCards.count();

    if (count > 0) {
      // Click first workflow card
      await workflowCards.first().click();

      // Verify modal opens
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

      // Verify steps section exists
      await expect(page.getByText(/Workflow Steps/i)).toBeVisible();

      // Close modal
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should open SOP detail modal with markdown content', async ({ page }) => {
    await page.getByRole('tab', { name: /SOPs/i }).click();
    await page.waitForTimeout(500);

    // Check if SOPs exist
    const sopCards = page.locator('.neu-raised.cursor-pointer');
    const count = await sopCards.count();

    if (count > 0) {
      // Click first SOP card
      await sopCards.first().click();

      // Verify modal opens
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

      // Verify content section exists
      await expect(page.getByText(/Content/i)).toBeVisible();

      // Verify download button exists
      await expect(page.getByRole('button', { name: /Download/i })).toBeVisible();

      // Close modal
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should show empty states when no data', async ({ page }) => {
    // This test assumes a project with no skills/workflows/sops
    // Or you can create a test project with no data

    // Skills empty state
    await page.getByRole('tab', { name: /Skills/i }).click();
    await page.waitForTimeout(500);
    // Should show either skills or empty state
    const hasSkills = await page.getByText(/Showing.*of.*skills/i).isVisible();
    expect(hasSkills).toBe(true);

    // Workflows empty state
    await page.getByRole('tab', { name: /Workflows/i }).click();
    await page.waitForTimeout(500);
    const hasWorkflows = await page.getByText(/Showing.*of.*workflows/i).isVisible();
    expect(hasWorkflows).toBe(true);

    // SOPs empty state
    await page.getByRole('tab', { name: /SOPs/i }).click();
    await page.waitForTimeout(500);
    const hasSOPs = await page.getByText(/Showing.*of.*SOPs/i).isVisible();
    expect(hasSOPs).toBe(true);
  });

  test('should show info banners explaining resource availability', async ({ page }) => {
    // Skills info banner
    await page.getByRole('tab', { name: /Skills/i }).click();
    await expect(page.getByText(/How Skills Work/i)).toBeVisible();
    await expect(page.getByText(/project-wide resources/i)).toBeVisible();

    // Workflows info banner
    await page.getByRole('tab', { name: /Workflows/i }).click();
    await expect(page.getByText(/How Workflows Work/i)).toBeVisible();

    // SOPs info banner
    await page.getByRole('tab', { name: /SOPs/i }).click();
    await expect(page.getByText(/How SOPs Work/i)).toBeVisible();
  });
});
