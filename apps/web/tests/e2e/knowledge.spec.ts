/**
 * E2E Test: Knowledge Base Page
 *
 * Covers:
 * - Page render (header + search + tags)
 * - Search flow (URL param + results)
 * - Tag filter (URL param + results + clear)
 */
import { test, expect } from '@playwright/test';

// Seeded content reference (apps/web/prisma/seed.ts):
// - Titles:
//   - "PostgreSQL Full-Text Search Best Practices"
//   - "Next.js 14 Server Components vs Client Components"
//   - "Prisma Schema Best Practices"
// - Tags (subset): 'postgresql', 'full-text-search', 'tsvector', 'nextjs', 'react', 'server-components', 'prisma'

test.describe('Knowledge Base', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForLoadState('networkidle');
  });

  test('should render header, search bar and tags section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Knowledge Base' })).toBeVisible();

    // Search input by placeholder (use regex to avoid exact-match fragility)
    const searchInput = page.getByPlaceholder(/Search knowledge base/i);
    await expect(searchInput).toBeVisible();

    // Tags label
    await expect(page.getByText('Popular tags:', { exact: true })).toBeVisible();
  });

  test('should search and update results and URL', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search knowledge base/i);

    // Type a seeded term and wait for debounce-driven navigation
    await searchInput.fill('PostgreSQL');

    // URL should include search param
    await expect(page).toHaveURL(/\bsearch=PostgreSQL/i);

    // Expect a seeded article title to appear
    await expect(
      page.getByText('PostgreSQL Full-Text Search Best Practices', { exact: true })
    ).toBeVisible();
  });

  test('should filter by tag, update URL, and allow clearing', async ({ page }) => {
    // Click a popular tag from seed (e.g., nextjs)
    const nextjsTag = page.getByRole('button', { name: 'nextjs' });
    await nextjsTag.click();

    // URL should include tag param
    await expect(page).toHaveURL(/\btag=nextjs\b/i);

    // Expect the Next.js article becomes visible
    await expect(
      page.getByText('Next.js 14 Server Components vs Client Components', { exact: true })
    ).toBeVisible();

    // Clear the tag
    const clearBtn = page.getByRole('button', { name: /Clear/i });
    await clearBtn.click();

    // Tag parameter should be removed
    await expect(page).toHaveURL((url) => {
      const u = new URL(url);
      return !u.searchParams.has('tag');
    });
  });
});
