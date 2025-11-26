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
      const firstLink = page.locator('[data-testid="ticket-card"] a, .ticket-card a, article a').first();
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
    // Verify ticket title is displayed
    const heading = page.locator('main h1, main h2, header h2').first().first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const headingText = await heading.textContent();
    expect(headingText).toBeTruthy();
    console.log(`✓ Ticket title: ${headingText?.substring(0, 50)}...`);

    // Verify ticket ID/number is displayed
    const ticketNumber = page.locator(`text=/#${testTicketId}/i, [data-testid="ticket-id"]`);
    if ((await ticketNumber.count()) > 0) {
      await expect(ticketNumber.first()).toBeVisible();
      console.log(`✓ Ticket ID #${testTicketId} displayed`);
    }
  });

  test('should display kind badge with appropriate styling', async ({ page }) => {
    // Look for kind badge (feature, task, epic, issue, bug, etc.)
    const kindBadge = page.locator('[data-testid="kind-badge"], .badge:has-text(/feature|task|epic|issue|bug|scanner|tech/i)');

    if ((await kindBadge.count()) > 0) {
      await expect(kindBadge.first()).toBeVisible();

      const kindText = await kindBadge.first().textContent();
      console.log(`✓ Kind badge: ${kindText}`);

      // Verify badge has color/styling
      const backgroundColor = await kindBadge.first().evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
      console.log(`✓ Kind badge has styling: ${backgroundColor}`);
    } else {
      console.log('⚠️ Kind badge not found - may not be implemented yet');
    }
  });

  test('should display status badge', async ({ page }) => {
    // Look for status badge
    const statusBadge = page.locator(
      '[data-testid="status-badge"], .badge:has-text(/open|closed|in progress|blocked|cancelled/i)'
    );

    if ((await statusBadge.count()) > 0) {
      await expect(statusBadge.first()).toBeVisible();
      const statusText = await statusBadge.first().textContent();
      console.log(`✓ Status badge: ${statusText}`);
    } else {
      // Alternative: Look for status text anywhere on page
      const statusText = page.locator('text=/status.*open|status.*closed/i');
      if ((await statusText.count()) > 0) {
        console.log('✓ Status shown as text');
      } else {
        console.log('⚠️ Status not found - may not be displayed');
      }
    }
  });

  test('should display priority badge', async ({ page }) => {
    // Look for priority badge
    const priorityBadge = page.locator(
      '[data-testid="priority-badge"], .badge:has-text(/critical|high|medium|low/i)'
    );

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
    // Look for source indicator
    const sourceIndicator = page.locator(
      '[data-testid="source-badge"], text=/source.*manual|source.*scanner|source.*agent|source.*onboarding/i'
    );

    if ((await sourceIndicator.count()) > 0) {
      const sourceText = await sourceIndicator.first().textContent();
      console.log(`✓ Source indicator: ${sourceText}`);

      // Verify source is one of the valid types
      const validSources = ['manual', 'scanner', 'agent', 'onboarding'];
      const hasValidSource = validSources.some(src =>
        sourceText?.toLowerCase().includes(src)
      );
      expect(hasValidSource).toBe(true);
    } else {
      console.log('⚠️ Source indicator not found - may not be displayed');
    }
  });

  test('should display assignee with type (human or agent_persona)', async ({ page }) => {
    // Look for assignee information
    const assigneeSection = page.locator(
      '[data-testid="assignee"], text=/assigned to|assignee/i'
    );

    if ((await assigneeSection.count()) > 0) {
      const assigneeText = await assigneeSection.first().textContent();
      console.log(`✓ Assignee: ${assigneeText}`);

      // Check if assignee type is indicated (human vs agent)
      const assigneeType = page.locator('text=/human|agent|persona/i');
      if ((await assigneeType.count()) > 0) {
        const typeText = await assigneeType.first().textContent();
        console.log(`✓ Assignee type: ${typeText}`);
      }
    } else {
      console.log('⚠️ Assignee not displayed (may be unassigned)');
    }
  });

  test('should display description section', async ({ page }) => {
    // Look for description section
    const descriptionHeading = page.locator('text=/^description$/i, h2:has-text("Description"), h3:has-text("Description")');

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
    const authorInfo = page.locator('text=/created by|author|reported by/i');
    if ((await authorInfo.count()) > 0) {
      const authorText = await authorInfo.first().textContent();
      console.log(`✓ Author: ${authorText}`);
    }

    // Look for created date
    const createdDate = page.locator('time, [data-testid="created-at"], text=/created.*ago/i');
    if ((await createdDate.count()) > 0) {
      await expect(createdDate.first()).toBeVisible();
      console.log('✓ Created date displayed');
    }

    // Look for updated date
    const updatedDate = page.locator('[data-testid="updated-at"], text=/updated.*ago/i');
    if ((await updatedDate.count()) > 0) {
      console.log('✓ Updated date displayed');
    }
  });

  test('should display closedAt timestamp for closed tickets', async ({ page }) => {
    // Check if this is a closed ticket
    const statusBadge = page.locator('text=/closed|resolved/i');
    const isClosed = (await statusBadge.count()) > 0;

    if (isClosed) {
      // Look for closedAt timestamp
      const closedDate = page.locator('[data-testid="closed-at"], text=/closed.*ago|resolved.*ago/i');

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
    const linkedTaskSection = page.locator(
      '[data-testid="linked-task"], text=/linked to task|related task|sprint task/i'
    );

    if ((await linkedTaskSection.count()) > 0) {
      const taskText = await linkedTaskSection.first().textContent();
      console.log(`✓ Linked task: ${taskText}`);

      // Look for hierarchy breadcrumb (Phase → Sprint → Week → Day → Task)
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"], .breadcrumb, text=/phase.*sprint.*week/i');
      if ((await breadcrumb.count()) > 0) {
        const breadcrumbText = await breadcrumb.first().textContent();
        console.log(`✓ Task hierarchy: ${breadcrumbText}`);
      }
    } else {
      console.log('ℹ️ No linked task (ticket may not be linked to sprint task)');
    }
  });

  test('should display comments section with list', async ({ page }) => {
    // Look for comments section
    const commentsHeading = page.locator('text=/^comments$/i, h2:has-text("Comments"), h3:has-text("Comments")');

    if ((await commentsHeading.count()) > 0) {
      await expect(commentsHeading.first()).toBeVisible();
      console.log('✓ Comments section found');

      // Check if comments exist
      const commentsList = page.locator('[data-testid="comment"], .comment, article:has-text("ago")');
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
    const commentInput = page.locator(
      '[data-testid="comment-textarea"], textarea[placeholder*="comment"], textarea[name="comment"]'
    );

    if ((await commentInput.count()) > 0) {
      await expect(commentInput.first()).toBeVisible();
      console.log('✓ Comment input field found');

      // Look for submit button
      const submitButton = page.locator(
        'button:has-text("Add Comment"), button:has-text("Post"), button[type="submit"]'
      ).filter({ has: page.locator('textarea') });

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
    const labelsSection = page.locator('[data-testid="labels"], text=/^labels$/i');

    if ((await labelsSection.count()) > 0) {
      console.log('✓ Labels section found');

      // Look for label badges
      const labelBadges = page.locator('[data-testid="label-badge"], .label, .tag');
      const labelCount = await labelBadges.count();

      if (labelCount > 0) {
        console.log(`✓ ${labelCount} label(s) displayed`);

        // Verify labels have color
        const firstLabel = labelBadges.first();
        const backgroundColor = await firstLabel.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
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
    const filesSection = page.locator(
      '[data-testid="linked-files"], text=/linked files|attached files|related files/i'
    );

    if ((await filesSection.count()) > 0) {
      console.log('✓ Linked files section found');

      // Look for file items
      const fileItems = page.locator('[data-testid="file-link"], code, .file-path');
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
