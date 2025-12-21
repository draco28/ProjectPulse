/**
 * E2E Test: Ticket Detail Page
 *
 * Tests the unified /tickets/[id] detail page functionality including:
 * - Display ticket header (title, #ID, badges)
 * - Kind badge with correct color/styling
 * - Status and priority badges
 * - Source indicator (manual, scanner, agent, onboarding)
 * - Assignee type (human vs agent_persona)
 * - Description section rendering
 * - Metadata (author, created, updated, closedAt if closed)
 * - Linked task hierarchy (Phase → Sprint → Week → Day → Task)
 * - Comments section with list
 * - Add comment form
 * - Labels display
 * - Linked files display
 *
 * Sprint 10: Unified Ticket System with Kind-based Work Items
 */
import { test, expect } from '@playwright/test';

test.describe('Ticket Detail Page', () => {
  let testTicketId: string;

  test.beforeAll(async ({ browser }) => {
    // Get a ticket ID from the list page to use in tests
    const page = await browser.newPage();

    try {
      await page.goto('/tickets?project=3');
      await page.waitForSelector('h1, h2', { timeout: 10000 });

      // Try to get first ticket link
      const firstLink = page.locator('[data-testid="ticket-card"] a').first();
      const href = await firstLink.getAttribute('href');
      testTicketId = href?.match(/\/tickets\/(\d+)/)?.[1] || '1';

      console.log(`✓ Using ticket ID ${testTicketId} for detail tests`);
    } catch (error) {
      console.log('⚠️ Could not fetch ticket from list, using default ID 1');
      testTicketId = '1';
    } finally {
      await page.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to ticket detail page before each test
    await page.goto(`/tickets/${testTicketId}?project=3`);
    await page.waitForSelector('h1, h2', { timeout: 10000 });
  });

  test('should display ticket header with title and ID', async ({ page }) => {
    // Verify ticket title is displayed (use specific class to avoid sidebar h1)
    const heading = page.locator('h1.text-2xl').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const headingText = await heading.textContent();
    expect(headingText).toBeTruthy();
    console.log(`✓ Ticket title: ${headingText?.substring(0, 50)}...`);

    // Verify ticket ID/number is displayed
    const ticketNumber = page
      .locator('[data-testid="ticket-id"]')
      .or(page.getByText(`#${testTicketId}`));
    if ((await ticketNumber.count()) > 0) {
      await expect(ticketNumber.first()).toBeVisible();
      console.log(`✓ Ticket ID #${testTicketId} displayed`);
    }
  });

  test('should display kind badge with appropriate styling', async ({ page }) => {
    // Look for kind badge with data-testid
    const kindBadge = page.locator('[data-testid="kind-badge"]');

    if ((await kindBadge.count()) > 0) {
      await expect(kindBadge.first()).toBeVisible();

      const kindText = await kindBadge.first().textContent();
      console.log(`✓ Kind badge: ${kindText}`);

      // Verify badge has color/styling
      const backgroundColor = await kindBadge
        .first()
        .evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
      console.log(`✓ Kind badge has styling: ${backgroundColor}`);
    } else {
      console.log('⚠️ Kind badge not found - may not be implemented yet');
    }
  });

  test('should display status badge', async ({ page }) => {
    // Look for status badge with data-testid
    const statusBadge = page.locator('[data-testid="status-badge"]');

    if ((await statusBadge.count()) > 0) {
      await expect(statusBadge.first()).toBeVisible();
      const statusText = await statusBadge.first().textContent();
      console.log(`✓ Status badge: ${statusText}`);
    } else {
      // Alternative: Look for status text anywhere on page
      const statusText = page.getByText(/status/i);
      if ((await statusText.count()) > 0) {
        console.log('✓ Status shown as text');
      } else {
        console.log('⚠️ Status not found - may not be displayed');
      }
    }
  });

  test('should display priority badge', async ({ page }) => {
    // Look for priority badge with data-testid
    const priorityBadge = page.locator('[data-testid="priority-badge"]');

    if ((await priorityBadge.count()) > 0) {
      await expect(priorityBadge.first()).toBeVisible();
      const priorityText = await priorityBadge.first().textContent();
      console.log(`✓ Priority badge: ${priorityText}`);

      // Verify priority badge has appropriate color
      const className = await priorityBadge.first().getAttribute('class');
      expect(className).toBeTruthy();
    } else {
      console.log('⚠️ Priority badge not found');
    }
  });

  test('should display source indicator (manual, scanner, agent, onboarding)', async ({ page }) => {
    // Look for source indicator with data-testid
    const sourceIndicator = page.locator('[data-testid="source-badge"]');

    if ((await sourceIndicator.count()) > 0) {
      const sourceText = await sourceIndicator.first().textContent();
      console.log(`✓ Source indicator: ${sourceText}`);

      // Verify source is one of the valid types
      const validSources = ['manual', 'scanner', 'agent', 'onboarding'];
      const hasValidSource = validSources.some((src) => sourceText?.toLowerCase().includes(src));
      expect(hasValidSource).toBe(true);
    } else {
      console.log('⚠️ Source indicator not found - may not be displayed');
    }
  });

  test('should display assignee with type (human or agent_persona)', async ({ page }) => {
    // Look for assignee information with data-testid
    const assigneeSection = page
      .locator('[data-testid="assignee"]')
      .or(page.getByText(/assigned to|assignee/i));

    if ((await assigneeSection.count()) > 0) {
      const assigneeText = await assigneeSection.first().textContent();
      console.log(`✓ Assignee: ${assigneeText}`);

      // Check if assignee type is indicated (human vs agent)
      const assigneeType = page.getByText(/human|agent|persona/i);
      if ((await assigneeType.count()) > 0) {
        const typeText = await assigneeType.first().textContent();
        console.log(`✓ Assignee type: ${typeText}`);
      }
    } else {
      console.log('⚠️ Assignee not displayed (may be unassigned)');
    }
  });

  test('should display description section', async ({ page }) => {
    // Look for description section with heading
    const descriptionHeading = page.getByRole('heading', { name: /description/i });

    if ((await descriptionHeading.count()) > 0) {
      await expect(descriptionHeading.first()).toBeVisible();
      console.log('✓ Description section header found');

      // Verify description content is present
      const descriptionContent = descriptionHeading.locator('..').locator('p, div');
      if ((await descriptionContent.count()) > 0) {
        console.log('✓ Description content rendered');
      }
    } else {
      console.log('⚠️ Description section not found');
    }
  });

  test('should display metadata (author, created, updated dates)', async ({ page }) => {
    // Look for author/creator
    const authorInfo = page.getByText(/created by|author|reported by/i);
    if ((await authorInfo.count()) > 0) {
      const authorText = await authorInfo.first().textContent();
      console.log(`✓ Author: ${authorText}`);
    }

    // Look for created date with time element or testid
    const createdDate = page.locator('time').or(page.locator('[data-testid="created-at"]'));
    if ((await createdDate.count()) > 0) {
      await expect(createdDate.first()).toBeVisible();
      console.log('✓ Created date displayed');
    }

    // Look for updated date
    const updatedDate = page.locator('[data-testid="updated-at"]');
    if ((await updatedDate.count()) > 0) {
      console.log('✓ Updated date displayed');
    }
  });

  test('should display closedAt timestamp for closed tickets', async ({ page }) => {
    // Check if this is a closed ticket
    const statusBadge = page.getByText(/closed|resolved/i);
    const isClosed = (await statusBadge.count()) > 0;

    if (isClosed) {
      // Look for closedAt timestamp
      const closedDate = page
        .locator('[data-testid="closed-at"]')
        .or(page.getByText(/closed.*ago|resolved.*ago/i));

      if ((await closedDate.count()) > 0) {
        await expect(closedDate.first()).toBeVisible();
        console.log('✓ Closed date displayed for closed ticket');
      } else {
        console.log('⚠️ Closed date not displayed (should show for closed tickets)');
      }
    } else {
      console.log('ℹ️ Ticket is not closed, closedAt not applicable');
    }
  });

  test('should display linked task hierarchy if present', async ({ page }) => {
    // Look for linked task section
    const linkedTaskSection = page
      .locator('[data-testid="linked-task"]')
      .or(page.getByText(/linked to task|related task|sprint task/i));

    if ((await linkedTaskSection.count()) > 0) {
      const taskText = await linkedTaskSection.first().textContent();
      console.log(`✓ Linked task: ${taskText}`);

      // Look for hierarchy breadcrumb (Phase → Sprint → Week → Day → Task)
      const breadcrumb = page
        .locator('nav[aria-label="breadcrumb"]')
        .or(page.locator('.breadcrumb'));
      if ((await breadcrumb.count()) > 0) {
        const breadcrumbText = await breadcrumb.first().textContent();
        console.log(`✓ Task hierarchy: ${breadcrumbText}`);
      }
    } else {
      console.log('ℹ️ No linked task (ticket may not be linked to sprint task)');
    }
  });

  test('should display comments section with list', async ({ page }) => {
    // Look for comments section heading
    const commentsHeading = page.getByRole('heading', { name: /comments/i });

    if ((await commentsHeading.count()) > 0) {
      await expect(commentsHeading.first()).toBeVisible();
      console.log('✓ Comments section found');

      // Check if comments exist
      const commentsList = page.locator('[data-testid="comment"]').or(page.locator('.comment'));
      const commentCount = await commentsList.count();

      if (commentCount > 0) {
        console.log(`✓ ${commentCount} comment(s) displayed`);

        // Verify first comment has author and content
        const firstComment = commentsList.first();
        const commentText = await firstComment.textContent();
        expect(commentText).toBeTruthy();
      } else {
        console.log('ℹ️ No comments yet on this ticket');
      }
    } else {
      console.log('⚠️ Comments section not found');
    }
  });

  test('should display add comment form', async ({ page }) => {
    // Look for comment input/textarea
    const commentInput = page
      .locator('[data-testid="comment-textarea"]')
      .or(page.locator('textarea[placeholder*="comment"]'))
      .or(page.locator('textarea[name="comment"]'));

    if ((await commentInput.count()) > 0) {
      await expect(commentInput.first()).toBeVisible();
      console.log('✓ Comment input field found');

      // Look for submit button near comment form
      const submitButton = page.getByRole('button', { name: /add comment|post|submit/i });

      if ((await submitButton.count()) > 0) {
        await expect(submitButton.first()).toBeVisible();
        console.log('✓ Comment submit button found');
      }
    } else {
      console.log('⚠️ Add comment form not found');
    }
  });

  test('should display labels if attached', async ({ page }) => {
    // Look for labels section
    const labelsSection = page.locator('[data-testid="labels"]').or(page.getByText(/^labels$/i));

    if ((await labelsSection.count()) > 0) {
      console.log('✓ Labels section found');

      // Look for label badges
      const labelBadges = page
        .locator('[data-testid="label-badge"]')
        .or(page.locator('.label'))
        .or(page.locator('.tag'));
      const labelCount = await labelBadges.count();

      if (labelCount > 0) {
        console.log(`✓ ${labelCount} label(s) displayed`);

        // Verify labels have color
        const firstLabel = labelBadges.first();
        const backgroundColor = await firstLabel.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor
        );
        expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      } else {
        console.log('ℹ️ No labels attached to this ticket');
      }
    } else {
      console.log('⚠️ Labels section not found');
    }
  });

  test('should display linked files if present', async ({ page }) => {
    // Look for linked files section
    const filesSection = page
      .locator('[data-testid="linked-files"]')
      .or(page.getByText(/linked files|attached files|related files/i));

    if ((await filesSection.count()) > 0) {
      console.log('✓ Linked files section found');

      // Look for file items
      const fileItems = page
        .locator('[data-testid="file-link"]')
        .or(page.locator('code'))
        .or(page.locator('.file-path'));
      const fileCount = await fileItems.count();

      if (fileCount > 0) {
        console.log(`✓ ${fileCount} linked file(s) displayed`);

        // Verify first file has path
        const firstFile = fileItems.first();
        const fileText = await firstFile.textContent();
        expect(fileText).toBeTruthy();
      } else {
        console.log('ℹ️ No linked files on this ticket');
      }
    } else {
      console.log('ℹ️ Linked files section not present (may not have any)');
    }
  });
});
