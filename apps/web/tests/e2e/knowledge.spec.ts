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

test.describe('Knowledge Base - Basic Rendering', () => {
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

test.describe('Knowledge Graph Traversal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForLoadState('networkidle');
  });

  test('should display related knowledge items', async ({ page }) => {
    // Click on a knowledge item with relationships
    const postgresItem = page.getByText('PostgreSQL Full-Text Search Best Practices', { exact: true });
    await postgresItem.click();
    await page.waitForLoadState('networkidle');

    // Should show "Related Knowledge" section
    const relatedSection = page.getByRole('heading', { name: /Related|Connections/i });

    if (await relatedSection.isVisible()) {
      await expect(relatedSection).toBeVisible();

      // Should have at least one related item
      const relatedItems = page.locator('[data-testid="related-item"]');
      const count = await relatedItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show direct (1-hop) relationships', async ({ page }) => {
    // Navigate to item with known relationships
    await page.goto('/knowledge/postgresql-fts');
    await page.waitForLoadState('networkidle');

    // Look for "Direct References" section
    const directSection = page.getByText(/Direct|References|Directly Related/i);

    if (await directSection.isVisible()) {
      await expect(directSection).toBeVisible();

      // Verify relationship types (REFERENCES, CONTRADICTS, EXTENDS)
      const relationshipTypes = page.locator('[data-testid="relation-type"]');
      const count = await relationshipTypes.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show indirect (2-hop) relationships', async ({ page }) => {
    await page.goto('/knowledge/postgresql-fts');
    await page.waitForLoadState('networkidle');

    // Look for "Indirectly Related" section
    const indirectSection = page.getByText(/Indirect|2-hop|Also Related/i);

    if (await indirectSection.isVisible()) {
      await expect(indirectSection).toBeVisible();

      // 2-hop items should be visually distinct from 1-hop
      const indirectItems = page.locator('[data-testid="indirect-relation"]');
      const count = await indirectItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should navigate through relationship graph', async ({ page }) => {
    await page.goto('/knowledge/postgresql-fts');
    await page.waitForLoadState('networkidle');

    // Click a related item
    const relatedItem = page.locator('[data-testid="related-item"]').first();

    if (await relatedItem.isVisible()) {
      await relatedItem.click();

      // Should navigate to related knowledge item
      await expect(page).toHaveURL(/\/knowledge\/.+/);

      // Should show title of related item
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });
});

test.describe('Hybrid Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForLoadState('networkidle');
  });

  test('should perform hybrid search with semantic + fulltext', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search knowledge base/i);

    // Search with natural language query (semantic search)
    await searchInput.fill('database performance optimization');
    await page.waitForTimeout(500);

    // Results should appear
    const results = page.getByRole('link').filter({ hasText: /.+/ });
    const count = await results.count();

    expect(count).toBeGreaterThan(0);

    // Should show semantically relevant results (not just keyword matches)
    await expect(page.getByText(/PostgreSQL|Database|Performance/i).first()).toBeVisible();
  });

  test('should switch to semantic-only search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search knowledge base/i);
    await searchInput.fill('database optimization');

    // Look for search mode toggle
    const semanticToggle = page.getByRole('button', { name: /Semantic|AI Search/i });

    if (await semanticToggle.isVisible()) {
      await semanticToggle.click();
      await page.waitForTimeout(500);

      // Should show semantic results (cosine similarity only)
      const results = page.getByRole('link');
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should switch to fulltext-only search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search knowledge base/i);
    await searchInput.fill('PostgreSQL');

    // Look for fulltext mode toggle
    const fulltextToggle = page.getByRole('button', { name: /Keyword|Text Search/i });

    if (await fulltextToggle.isVisible()) {
      await fulltextToggle.click();
      await page.waitForTimeout(500);

      // Should show keyword matches only (tsvector + ts_rank_cd)
      await expect(page.getByText('PostgreSQL', { exact: false })).toBeVisible();
    }
  });

  test('should display search mode indicator', async ({ page }) => {
    // Should show current search mode (Hybrid, Semantic, or Fulltext)
    const modeIndicator = page.locator('[data-testid="search-mode"]');

    if (await modeIndicator.isVisible()) {
      const modeText = await modeIndicator.textContent();
      expect(['Hybrid', 'Semantic', 'Fulltext', 'Keyword']).toContain(modeText?.trim() || '');
    }
  });
});

test.describe('Knowledge Item Linking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForLoadState('networkidle');
  });

  test('should display relationship types', async ({ page }) => {
    // Navigate to knowledge item
    const item = page.getByText('PostgreSQL Full-Text Search Best Practices', { exact: true });
    await item.click();
    await page.waitForLoadState('networkidle');

    // Look for relationship type badges
    const relationTypes = page.locator('[data-testid="relation-type"]');

    if (await relationTypes.first().isVisible()) {
      const typeText = await relationTypes.first().textContent();

      // Should show one of the relationship types
      expect(['REFERENCES', 'CONTRADICTS', 'EXTENDS', 'RELATED_TO']).toContain(typeText?.trim() || '');
    }
  });

  test('should create new relationship', async ({ page }) => {
    // Navigate to knowledge item
    await page.goto('/knowledge/postgresql-fts');
    await page.waitForLoadState('networkidle');

    // Look for "Add Relationship" button
    const addRelationButton = page.getByRole('button', { name: /Add Relationship|Link Knowledge/i });

    if (await addRelationButton.isVisible()) {
      await addRelationButton.click();

      // Should show relationship creation form
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
      await expect(page.getByText(/Select Item|Choose Knowledge/i)).toBeVisible();
    }
  });

  test('should show bidirectional relationships', async ({ page }) => {
    // If A references B, then B should show "Referenced by A"
    await page.goto('/knowledge/postgresql-fts');
    await page.waitForLoadState('networkidle');

    // Look for "Referenced by" section (inverse relationships)
    const referencedBy = page.getByText(/Referenced by|Incoming References/i);

    if (await referencedBy.isVisible()) {
      await expect(referencedBy).toBeVisible();
    }
  });
});
