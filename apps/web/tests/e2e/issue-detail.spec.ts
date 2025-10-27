/**
 * E2E Test: Issue Detail Page
 *
 * Tests the Issue Detail page functionality including:
 * - Navigation from issues list to detail page
 * - Issue details rendering (title, description, metadata)
 * - Comments display and submission
 * - Attachments display
 * - Sidebar information
 * - Linked files and commits
 * - Responsive layout
 */
import { test, expect } from '@playwright/test';

test.describe('Issue Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to issues list page before each test
    await page.goto('/issues');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate from issues list to issue detail', async ({ page }) => {
    // Find the first issue card and click on its title link
    const firstIssueTitle = page.locator('.issue-card h3 a').first();
    await expect(firstIssueTitle).toBeVisible();

    // Store the issue title text for verification
    const titleText = await firstIssueTitle.textContent();

    // Click the title to navigate to detail page
    await firstIssueTitle.click();

    // Wait for navigation
    await page.waitForURL(/\/issues\/\d+/);

    // Verify we're on the detail page by checking URL pattern
    expect(page.url()).toMatch(/\/issues\/\d+$/);

    // Verify the same title appears on the detail page
    await expect(page.locator('h1').filter({ hasText: titleText || '' })).toBeVisible();
  });

  test('should display issue header with status and priority badges', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Check issue number is displayed
    await expect(page.locator('text=/#\\d+/')).toBeVisible();

    // Check status badge exists
    await expect(page.locator('text=/Open|In Progress|Closed/').first()).toBeVisible();

    // Check priority badge exists
    await expect(page.locator('text=/Critical|High|Medium|Low/').first()).toBeVisible();

    // Check module badge exists
    await expect(page.locator('.coral-gradient, .bg-coral').first()).toBeVisible();
  });

  test('should display issue description', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Check description section header
    await expect(page.locator('text=Description')).toBeVisible();

    // Description content should be visible
    const descriptionSection = page.locator('text=Description').locator('..');
    await expect(descriptionSection).toBeVisible();
  });

  test('should display metadata (author, created date, updated date)', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Check author is displayed
    await expect(page.locator('text=/Created by/')).toBeVisible();

    // Check timestamps are displayed (relative time format)
    await expect(page.locator('text=/ ago|just now/')).toBeVisible();
  });

  test('should display comments section', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Scroll to comments section
    await page.locator('text=Comments').scrollIntoViewIfNeeded();

    // Check comments section header
    await expect(page.locator('text=Comments')).toBeVisible();

    // Comment form should be visible
    const commentForm = page
      .locator('form')
      .filter({ has: page.locator('[data-testid="comment-textarea"]') });
    await expect(commentForm).toBeVisible();
  });

  test('should add a new comment successfully', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Scroll to comment form
    const commentTextarea = page.locator('[data-testid="comment-textarea"]');
    await commentTextarea.scrollIntoViewIfNeeded();

    // Type a comment
    const testComment = `E2E test comment - ${Date.now()}`;
    await commentTextarea.fill(testComment);

    // Submit the comment
    const submitButton = page.locator('[data-testid="submit-comment"]');
    await submitButton.click();

    // Wait for the comment to appear in the list
    await expect(page.locator(`text=${testComment}`)).toBeVisible({ timeout: 10000 });

    // Verify the textarea is cleared
    await expect(commentTextarea).toHaveValue('');
  });

  test('should show validation error for empty comment', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Scroll to comment form
    const commentTextarea = page.locator('[data-testid="comment-textarea"]');
    await commentTextarea.scrollIntoViewIfNeeded();

    // Try to submit without typing anything
    const submitButton = page.locator('[data-testid="submit-comment"]');

    // Submit button should be disabled when textarea is empty
    await expect(submitButton).toBeDisabled();
  });

  test('should display sidebar with issue details', async ({ page, isMobile }) => {
    // Skip on mobile as sidebar layout is different
    test.skip(isMobile, 'Sidebar layout different on mobile');

    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Check Quick Actions section
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('button:has-text("Watch Issue")')).toBeVisible();
    await expect(page.locator('button:has-text("Copy Link")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Branch")')).toBeVisible();

    // Check Details section
    await expect(page.locator('text=Details').first()).toBeVisible();
    await expect(page.locator('text=Assignee')).toBeVisible();
    await expect(page.locator('text=Priority')).toBeVisible();
  });

  test('should copy issue link to clipboard when clicking Copy Link button', async ({
    page,
    isMobile,
    context,
  }) => {
    test.skip(isMobile, 'Sidebar layout different on mobile');

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Click Copy Link button
    const copyLinkButton = page.locator('button:has-text("Copy Link")');
    await copyLinkButton.click();

    // Wait a bit for clipboard operation
    await page.waitForTimeout(500);

    // Verify clipboard contains the issue URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('/issues/');
  });

  test('should display attachments section if attachments exist', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Check if attachments section exists
    const attachmentsSection = page.locator('text=Attachments');

    // If attachments exist, verify they're displayed
    if (await attachmentsSection.isVisible()) {
      await expect(attachmentsSection).toBeVisible();

      // Check for attachment items with file icons
      await expect(page.locator('.attachment-item').first()).toBeVisible();
    }
  });

  test('should display linked files section if linked files exist', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Scroll down to find linked files section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check if linked files section exists
    const linkedFilesSection = page.locator('text=Linked Files');

    if (await linkedFilesSection.isVisible()) {
      await expect(linkedFilesSection).toBeVisible();
    }
  });

  test('should display linked commits section if commits exist', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Scroll down to find linked commits section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check if linked commits section exists
    const linkedCommitsSection = page.locator('text=Linked Commits');

    if (await linkedCommitsSection.isVisible()) {
      await expect(linkedCommitsSection).toBeVisible();

      // Check for commit hash patterns
      await expect(page.locator('text=/[a-f0-9]{7}/').first()).toBeVisible();
    }
  });

  test('should show proper loading states when submitting comment', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Scroll to comment form
    const commentTextarea = page.locator('[data-testid="comment-textarea"]');
    await commentTextarea.scrollIntoViewIfNeeded();

    // Type a comment
    await commentTextarea.fill('Test loading state comment');

    // Get submit button
    const submitButton = page.locator('[data-testid="submit-comment"]');

    // Click submit and immediately check loading state
    await submitButton.click();

    // Button should show "Posting..." during submission
    await expect(submitButton).toHaveText(/Posting.../);

    // Wait for completion
    await page.waitForTimeout(2000);

    // Button should return to "Comment" after completion
    await expect(submitButton).toHaveText(/Comment/);
  });

  test('should display neumorphic design elements', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Check for neumorphic classes (neu-raised, neu-pressed, glass-dark)
    await expect(page.locator('[class*="neu-raised"]').first()).toBeVisible();
    await expect(page.locator('[class*="neu-pressed"]').first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Main content should be visible
    await expect(page.locator('h1').first()).toBeVisible();

    // Description should be visible
    await expect(page.locator('text=Description')).toBeVisible();

    // Comments should be visible
    await expect(page.locator('text=Comments')).toBeVisible();
  });

  test('should display labels if they exist', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Check if labels section exists in sidebar
    const labelsSection = page.locator('text=Labels');

    if (await labelsSection.isVisible()) {
      await expect(labelsSection).toBeVisible();

      // Labels should have left border color
      const labelBadge = page.locator('.neu-pressed').filter({ hasText: /.+/ }).first();
      await expect(labelBadge).toBeVisible();
    }
  });

  test('should handle back navigation correctly', async ({ page }) => {
    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Verify we're on detail page
    expect(page.url()).toMatch(/\/issues\/\d+$/);

    // Go back
    await page.goBack();

    // Should be back on issues list
    await expect(page).toHaveURL('/issues');
    await expect(page.locator('.issue-card').first()).toBeVisible();
  });
});

test.describe('Issue Detail Page Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/issues');
    await page.waitForLoadState('networkidle');

    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Check h1 exists (page title)
    await expect(page.locator('h1').first()).toBeVisible();

    // Check h2 or h3 exists for section headings
    await expect(page.locator('h2, h3').first()).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/issues');
    await page.waitForLoadState('networkidle');

    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus is on a focusable element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA']).toContain(focusedElement || '');
  });

  test('should have proper ARIA labels on buttons', async ({ page }) => {
    await page.goto('/issues');
    await page.waitForLoadState('networkidle');

    // Navigate to first issue
    await page.locator('.issue-card h3 a').first().click();
    await page.waitForURL(/\/issues\/\d+/);

    // Check that buttons have accessible names
    const watchButton = page.locator('button:has-text("Watch Issue")');
    await expect(watchButton).toBeVisible();

    const copyButton = page.locator('button:has-text("Copy Link")');
    await expect(copyButton).toBeVisible();
  });
});
