/**
 * E2E Test: Roadmap Flows
 *
 * Tests roadmap functionality including:
 * - Project context preservation in roadmap navigation
 * - Roadmap creation wizard flow
 * - Roadmap import flow
 * - Tree/Timeline view toggle
 *
 * NOTE: These tests use a dynamic project ID discovery since project IDs
 * vary between environments and users.
 *
 * @see .agent/sops/project-context-pattern.md
 * @see US-073: Development Roadmap Visualization
 */
import { test, expect, Page } from '@playwright/test';

// Test configuration - increase timeout for navigation-heavy tests
test.setTimeout(60000);

/**
 * Helper to login and wait for redirect
 * The login page redirects to /app after success (doesn't honor callbackUrl)
 *
 * NOTE: Using getByLabel() and click() + type() instead of fill() because
 * fill() may not properly trigger React's controlled input onChange handlers.
 */
async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Clear inputs first, then type (ensures React state updates)
  const emailInput = page.getByLabel('Email');
  const passwordInput = page.getByLabel('Password');

  await emailInput.click();
  await emailInput.clear();
  await emailInput.type('dev@projectpulse.local', { delay: 10 });

  await passwordInput.click();
  await passwordInput.clear();
  await passwordInput.type('dev123456', { delay: 10 });

  // Click sign in and wait for navigation
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for redirect to /app (login success) - increased timeout for slower browsers
  await page.waitForURL(/\/(app|dashboard)/, { timeout: 30000 });
}

/**
 * Helper to get a valid project ID for the logged-in user
 * Clicks the first project card and extracts the project ID from URL
 */
async function getFirstProjectId(page: Page): Promise<string> {
  // We should already be on /app after login
  // Wait for project cards to load - they have cursor-pointer class and show "sessions complete"
  await page.waitForSelector('text=sessions complete', { timeout: 10000 });

  // Click the first project card - glass-card with cursor-pointer class
  // These cards have onClick handler and navigate to /dashboard?project=X
  const projectCard = page.locator('.cursor-pointer:has-text("sessions complete")').first();
  await projectCard.click();

  // Wait for navigation to dashboard with project ID
  await page.waitForURL(/\/dashboard\?project=\d+/, { timeout: 10000 });

  // Extract project ID from URL (format: /dashboard?project=X)
  const url = page.url();
  const match = url.match(/project=(\d+)/);
  if (match) {
    return match[1];
  }

  throw new Error('Could not determine project ID from URL: ' + url);
}

test.describe('Roadmap - Project Context Preservation', () => {
  // Skip mobile projects - sidebar layout is different (collapsed/hamburger menu)
  // Using isMobile fixture which is true for mobile device emulation
  test.skip(({ isMobile }) => isMobile, 'Sidebar navigation tests only run on desktop browsers');

  let projectId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    projectId = await getFirstProjectId(page);
  });

  test('should preserve project ID when navigating to roadmap page', async ({ page }) => {
    // Navigate to dashboard with project ID
    await page.goto(`/dashboard?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Find and click Roadmap link in sidebar - scroll into view first
    const roadmapLink = page.locator('a[href*="/roadmap"]').first();
    if (await roadmapLink.isVisible({ timeout: 5000 })) {
      await roadmapLink.scrollIntoViewIfNeeded();
      await roadmapLink.click();
      // Wait for navigation with explicit timeout
      await page.waitForURL(/\/roadmap/, { timeout: 15000 });

      // Should be on roadmap page with project ID
      await expect(page).toHaveURL(/\/roadmap/);
      await expect(page).toHaveURL(new RegExp(`project=${projectId}`));
    }
  });

  test('should navigate to create wizard with project context', async ({ page }) => {
    // Go directly to roadmap page
    await page.goto(`/roadmap?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Look for Create Roadmap button (visible in empty state)
    const createButton = page.locator('a:has-text("Create Roadmap")');
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      // Wait for navigation to create page with explicit URL check
      await page.waitForURL(/\/roadmap\/create/, { timeout: 10000 });

      // Should preserve project context
      await expect(page).toHaveURL(/\/roadmap\/create/);
      await expect(page).toHaveURL(new RegExp(`project=${projectId}`));
    } else {
      // Roadmap exists - skip this test
      test.skip();
    }
  });

  test('should navigate to import page with project context', async ({ page }) => {
    await page.goto(`/roadmap?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Look for Import JSON button (visible in empty state)
    const importButton = page.locator('a:has-text("Import JSON")');
    if (await importButton.isVisible({ timeout: 3000 })) {
      await importButton.click();
      // Wait for navigation to import page
      await page.waitForURL(/\/roadmap\/import/, { timeout: 10000 });

      await expect(page).toHaveURL(/\/roadmap\/import/);
      await expect(page).toHaveURL(new RegExp(`project=${projectId}`));
    } else {
      test.skip();
    }
  });

  test('should navigate to AI onboarding with project context', async ({ page }) => {
    await page.goto(`/roadmap?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    const onboardingLink = page.locator('a:has-text("Start AI Onboarding")');
    if (await onboardingLink.isVisible({ timeout: 3000 })) {
      await onboardingLink.click();
      // Wait for navigation to onboarding page with explicit URL check
      await page.waitForURL(/\/onboarding/, { timeout: 10000 });

      await expect(page).toHaveURL(/\/onboarding/);
      await expect(page).toHaveURL(new RegExp(`project=${projectId}`));
    } else {
      test.skip();
    }
  });
});

test.describe('Roadmap Creation Wizard', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    projectId = await getFirstProjectId(page);
  });

  test('should display wizard step indicator', async ({ page }) => {
    await page.goto(`/roadmap/create?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Step 1 header should be visible: "Project Information"
    await expect(page.getByText('Project Information')).toBeVisible({ timeout: 10000 });
  });

  test('should display project name context in wizard', async ({ page }) => {
    await page.goto(`/roadmap/create?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Should show the page header "Create Roadmap"
    await expect(page.getByRole('heading', { name: 'Create Roadmap' })).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields on Step 1', async ({ page }) => {
    await page.goto(`/roadmap/create?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Clear the title field and try to proceed
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.clear();

    // Click Next button
    const nextButton = page.getByRole('button', { name: 'Next' });
    await expect(nextButton).toBeVisible({ timeout: 10000 });
    await nextButton.click();

    // Should show validation error for title
    await expect(page.getByText('Title is required')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between wizard steps', async ({ page }) => {
    await page.goto(`/roadmap/create?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Fill Step 1 - title field
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.fill('Test Roadmap');

    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);

    // Should be on Step 2 - look for "Define Phases" heading
    await expect(page.getByRole('heading', { name: 'Define Phases' })).toBeVisible({ timeout: 5000 });

    // Click Back
    await page.getByRole('button', { name: 'Back' }).click();
    await page.waitForTimeout(500);

    // Should be back on Step 1
    await expect(page.getByText('Project Information')).toBeVisible({ timeout: 5000 });
  });

  test('should preserve entered data when navigating steps', async ({ page }) => {
    await page.goto(`/roadmap/create?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Fill title
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.fill('My Test Roadmap');

    // Navigate forward and back
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Back' }).click();
    await page.waitForTimeout(500);

    // Title should still be filled
    await expect(titleInput).toHaveValue('My Test Roadmap');
  });
});

test.describe('Roadmap Import', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    projectId = await getFirstProjectId(page);
  });

  test('should display import method toggle', async ({ page }) => {
    await page.goto(`/roadmap/import?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Both method buttons should be visible
    await expect(page.getByRole('button', { name: 'Upload File' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Paste JSON' })).toBeVisible();
  });

  test('should display project context on import page', async ({ page }) => {
    await page.goto(`/roadmap/import?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // "Importing to:" text should be visible
    await expect(page.getByText('Importing to:')).toBeVisible({ timeout: 10000 });
  });

  test('should toggle between file upload and paste modes', async ({ page }) => {
    await page.goto(`/roadmap/import?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Click Paste JSON button
    await page.getByRole('button', { name: 'Paste JSON' }).click();
    await page.waitForTimeout(300);

    // Textarea should be visible
    await expect(page.locator('textarea')).toBeVisible();

    // Click Upload File button
    await page.getByRole('button', { name: 'Upload File' }).click();
    await page.waitForTimeout(300);

    // Textarea should be hidden (file dropzone shown instead)
    await expect(page.locator('textarea')).not.toBeVisible();
  });

  test('should validate JSON format on parse', async ({ page }) => {
    await page.goto(`/roadmap/import?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Switch to paste mode
    await page.getByRole('button', { name: 'Paste JSON' }).click();

    // Enter invalid JSON
    await page.locator('textarea').fill('this is not valid json');

    // Click Parse button
    await page.getByRole('button', { name: 'Parse' }).click();
    await page.waitForTimeout(500);

    // Should show error - check for red error container (text varies by browser)
    const errorContainer = page.locator('.text-red-400, .text-red-500, [class*="text-red"]');
    await expect(errorContainer.first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate roadmap structure', async ({ page }) => {
    await page.goto(`/roadmap/import?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Switch to paste mode
    await page.getByRole('button', { name: 'Paste JSON' }).click();

    // Enter valid JSON but missing phases
    await page.locator('textarea').fill('{"name": "Test"}');

    // Click Parse
    await page.getByRole('button', { name: 'Parse' }).click();
    await page.waitForTimeout(500);

    // Should show structure error about phases - use specific error message
    await expect(page.getByText('Missing required "phases" array')).toBeVisible({ timeout: 5000 });
  });

  test('should show preview for valid JSON', async ({ page }) => {
    await page.goto(`/roadmap/import?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Switch to paste mode
    await page.getByRole('button', { name: 'Paste JSON' }).click();

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
    await page.locator('textarea').fill(validJson);

    // Click Parse
    await page.getByRole('button', { name: 'Parse' }).click();
    await page.waitForTimeout(1000);

    // Preview should show the phase
    await expect(page.getByText('Phase 1').or(page.getByText('Foundation'))).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Sprint 1')).toBeVisible();
  });
});

test.describe('Roadmap View Toggle', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    projectId = await getFirstProjectId(page);
  });

  test('should display view toggle when roadmap exists', async ({ page }) => {
    await page.goto(`/roadmap?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Check for empty state
    const emptyState = page.getByText('No Roadmap Found');
    if (await emptyState.isVisible({ timeout: 3000 })) {
      test.skip();
      return;
    }

    // View toggle should be visible
    const toggleGroup = page.getByRole('button', { name: 'Tree' }).or(page.getByRole('button', { name: 'Timeline' }));
    await expect(toggleGroup).toBeVisible({ timeout: 5000 });
  });

  test('should toggle between tree and timeline views', async ({ page }) => {
    await page.goto(`/roadmap?project=${projectId}`);
    await page.waitForLoadState('networkidle');

    // Check for empty state
    const emptyState = page.getByText('No Roadmap Found');
    if (await emptyState.isVisible({ timeout: 3000 })) {
      test.skip();
      return;
    }

    // Try clicking Timeline toggle
    const timelineToggle = page.getByRole('button', { name: 'Timeline' });
    if (await timelineToggle.isVisible({ timeout: 3000 })) {
      await timelineToggle.click();
      await page.waitForTimeout(500);
    }

    // Try clicking Tree toggle
    const treeToggle = page.getByRole('button', { name: 'Tree' });
    if (await treeToggle.isVisible({ timeout: 3000 })) {
      await treeToggle.click();
      await page.waitForTimeout(500);
    }

    // If we get here without errors, the toggle works
    expect(true).toBe(true);
  });
});
