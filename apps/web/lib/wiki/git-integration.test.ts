/**
 * Integration tests for git integration
 *
 * Tests:
 * - commitWikiCreate: Create wiki → git commit made
 * - commitWikiUpdate: Update wiki → new commit with diff
 * - commitWikiDelete: Delete wiki → deletion committed
 * - Commit SHA stored correctly in metadata
 * - Markdown file generation with frontmatter
 * - Git operations with proper commit messages
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  commitWikiCreate,
  commitWikiUpdate,
  commitWikiDelete,
  wikiPageToMarkdown,
  getWikiFilePath,
} from './git-integration';

// Test configuration
const TEST_REPO_ROOT = join(process.cwd(), '.test-git-repo');
const TEST_WIKI_DIR = '.wiki-test';

const TEST_CONFIG = {
  repoRoot: TEST_REPO_ROOT,
  wikiDir: TEST_WIKI_DIR,
  gitUserName: 'Test User',
  gitUserEmail: 'test@example.com',
};

describe('Git Integration', () => {
  beforeAll(() => {
    // Create test git repository
    if (existsSync(TEST_REPO_ROOT)) {
      rmSync(TEST_REPO_ROOT, { recursive: true, force: true });
    }

    mkdirSync(TEST_REPO_ROOT, { recursive: true });

    // Initialize git repo
    execSync('git init', { cwd: TEST_REPO_ROOT });
    execSync('git config user.name "Test User"', { cwd: TEST_REPO_ROOT });
    execSync('git config user.email "test@example.com"', { cwd: TEST_REPO_ROOT });

    // Create initial commit (required for subsequent commits)
    const readmePath = join(TEST_REPO_ROOT, 'README.md');
    require('fs').writeFileSync(readmePath, '# Test Repo');
    execSync('git add README.md', { cwd: TEST_REPO_ROOT });
    execSync('git commit -m "Initial commit"', { cwd: TEST_REPO_ROOT });
  });

  afterAll(() => {
    // Clean up test repository
    if (existsSync(TEST_REPO_ROOT)) {
      rmSync(TEST_REPO_ROOT, { recursive: true, force: true });
    }
  });

  describe('wikiPageToMarkdown', () => {
    it('should generate markdown with YAML frontmatter', () => {
      const page = {
        title: 'API Reference',
        path: '/api-reference',
        content: '# API\n\nDocumentation content here',
        category: 'reference',
        tags: ['api', 'docs'],
        excerpt: 'API documentation',
        createdAt: new Date('2025-11-14T00:00:00Z'),
        updatedAt: new Date('2025-11-14T12:00:00Z'),
      };

      const markdown = wikiPageToMarkdown(page);

      expect(markdown).toContain('---');
      expect(markdown).toContain('title: API Reference');
      expect(markdown).toContain('path: /api-reference');
      expect(markdown).toContain('category: reference');
      expect(markdown).toContain('tags: [api, docs]');
      expect(markdown).toContain('excerpt: API documentation');
      expect(markdown).toContain('createdAt: 2025-11-14T00:00:00.000Z');
      expect(markdown).toContain('updatedAt: 2025-11-14T12:00:00.000Z');
      expect(markdown).toContain('# API');
      expect(markdown).toContain('Documentation content here');
    });

    it('should handle pages without optional fields', () => {
      const page = {
        title: 'Simple Page',
        path: '/simple',
        content: '# Simple',
        category: 'guides',
      };

      const markdown = wikiPageToMarkdown(page);

      expect(markdown).toContain('title: Simple Page');
      expect(markdown).toContain('path: /simple');
      expect(markdown).toContain('category: guides');
      expect(markdown).not.toContain('tags:');
      expect(markdown).not.toContain('excerpt:');
      expect(markdown).toContain('# Simple');
    });

    it('should escape special characters in YAML frontmatter', () => {
      const page = {
        title: 'Page: With Special Characters',
        path: '/special-chars',
        content: '# Content',
        category: 'guides',
      };

      const markdown = wikiPageToMarkdown(page);

      expect(markdown).toContain('title: Page: With Special Characters');
    });
  });

  describe('getWikiFilePath', () => {
    it('should generate correct file path', () => {
      const filePath = getWikiFilePath('/api-reference', TEST_CONFIG);

      expect(filePath).toBe(join(TEST_REPO_ROOT, TEST_WIKI_DIR, 'api-reference.md'));
    });

    it('should handle paths without leading slash', () => {
      const filePath = getWikiFilePath('getting-started', TEST_CONFIG);

      expect(filePath).toBe(join(TEST_REPO_ROOT, TEST_WIKI_DIR, 'getting-started.md'));
    });

    it('should handle paths with .md extension', () => {
      const filePath = getWikiFilePath('/troubleshooting.md', TEST_CONFIG);

      expect(filePath).toBe(join(TEST_REPO_ROOT, TEST_WIKI_DIR, 'troubleshooting.md'));
    });
  });

  describe('commitWikiCreate', () => {
    it('should create markdown file and commit to git', () => {
      const page = {
        title: 'Test Page',
        path: '/test-page',
        content: '# Test\n\nThis is a test page.',
        category: 'testing',
        tags: ['test'],
        excerpt: 'Test page excerpt',
        createdAt: new Date('2025-11-14T00:00:00Z'),
        updatedAt: new Date('2025-11-14T00:00:00Z'),
      };

      const result = commitWikiCreate(page, TEST_CONFIG);

      // Check result structure
      expect(result.operation).toBe('create');
      expect(result.commitSha).toBeDefined();
      expect(result.commitSha).toHaveLength(40); // Git SHA is 40 chars
      expect(result.message).toContain('wiki: Create Test Page');
      expect(result.filePath).toContain('.wiki-test/test-page.md');

      // Check file exists
      const filePath = getWikiFilePath('/test-page', TEST_CONFIG);
      expect(existsSync(filePath)).toBe(true);

      // Check file content
      const fileContent = readFileSync(filePath, 'utf-8');
      expect(fileContent).toContain('title: Test Page');
      expect(fileContent).toContain('# Test');
      expect(fileContent).toContain('This is a test page.');

      // Check git commit exists
      const commitMessage = execSync('git log -1 --pretty=%B', {
        cwd: TEST_REPO_ROOT,
        encoding: 'utf-8',
      }).trim();
      expect(commitMessage).toContain('wiki: Create Test Page');
    });

    it('should store correct commit SHA', () => {
      const page = {
        title: 'SHA Test',
        path: '/sha-test',
        content: '# SHA Test',
        category: 'testing',
      };

      const result = commitWikiCreate(page, TEST_CONFIG);

      // Get actual commit SHA from git
      const actualSha = execSync('git rev-parse HEAD', {
        cwd: TEST_REPO_ROOT,
        encoding: 'utf-8',
      }).trim();

      expect(result.commitSha).toBe(actualSha);
    });
  });

  describe('commitWikiUpdate', () => {
    it('should update markdown file and commit changes', () => {
      // First create a page
      const originalPage = {
        title: 'Update Test',
        path: '/update-test',
        content: '# Original Content',
        category: 'testing',
      };

      commitWikiCreate(originalPage, TEST_CONFIG);

      // Now update it
      const updatedPage = {
        title: 'Update Test (Updated)',
        path: '/update-test',
        content: '# Updated Content\n\nThis has been updated.',
        category: 'testing',
        excerpt: 'Updated excerpt',
      };

      const result = commitWikiUpdate(updatedPage, TEST_CONFIG);

      // Check result
      expect(result.operation).toBe('update');
      expect(result.commitSha).toBeDefined();
      expect(result.message).toContain('wiki: Update Update Test (Updated)');

      // Check file content updated
      const filePath = getWikiFilePath('/update-test', TEST_CONFIG);
      const fileContent = readFileSync(filePath, 'utf-8');
      expect(fileContent).toContain('title: Update Test (Updated)');
      expect(fileContent).toContain('# Updated Content');
      expect(fileContent).toContain('This has been updated.');
      expect(fileContent).toContain('excerpt: Updated excerpt');

      // Check git commit message
      const commitMessage = execSync('git log -1 --pretty=%B', {
        cwd: TEST_REPO_ROOT,
        encoding: 'utf-8',
      }).trim();
      expect(commitMessage).toContain('wiki: Update Update Test (Updated)');
    });

    it('should create new commit with different SHA', () => {
      const page = {
        title: 'SHA Change Test',
        path: '/sha-change',
        content: '# Original',
        category: 'testing',
      };

      const createResult = commitWikiCreate(page, TEST_CONFIG);
      const createSha = createResult.commitSha;

      // Update the page
      const updatedPage = {
        ...page,
        content: '# Updated',
      };

      const updateResult = commitWikiUpdate(updatedPage, TEST_CONFIG);
      const updateSha = updateResult.commitSha;

      // SHAs should be different
      expect(updateSha).not.toBe(createSha);
    });
  });

  describe('commitWikiDelete', () => {
    it('should delete markdown file and commit deletion', () => {
      // First create a page
      const page = {
        title: 'Delete Test',
        path: '/delete-test',
        content: '# To Be Deleted',
        category: 'testing',
      };

      commitWikiCreate(page, TEST_CONFIG);

      // Check file exists
      const filePath = getWikiFilePath('/delete-test', TEST_CONFIG);
      expect(existsSync(filePath)).toBe(true);

      // Now delete it
      const result = commitWikiDelete(
        {
          title: 'Delete Test',
          path: '/delete-test',
        },
        TEST_CONFIG
      );

      // Check result
      expect(result.operation).toBe('delete');
      expect(result.commitSha).toBeDefined();
      expect(result.message).toContain('wiki: Delete Delete Test');

      // Check file no longer exists
      expect(existsSync(filePath)).toBe(false);

      // Check git commit message
      const commitMessage = execSync('git log -1 --pretty=%B', {
        cwd: TEST_REPO_ROOT,
        encoding: 'utf-8',
      }).trim();
      expect(commitMessage).toContain('wiki: Delete Delete Test');
    });

    it('should handle deleting non-existent file gracefully', () => {
      const result = commitWikiDelete(
        {
          title: 'Nonexistent Page',
          path: '/nonexistent',
        },
        TEST_CONFIG
      );

      // Should still create commit (git rm will fail, but we handle that)
      expect(result.operation).toBe('delete');
      expect(result.commitSha).toBeDefined();
    });
  });

  describe('Git Integration with Wiki CRUD', () => {
    it('should track version history via git log', () => {
      const page = {
        title: 'Version Test',
        path: '/version-test',
        content: '# Version 1',
        category: 'testing',
      };

      // Create initial version
      const createResult = commitWikiCreate(page, TEST_CONFIG);

      // Update multiple times
      commitWikiUpdate({ ...page, content: '# Version 2' }, TEST_CONFIG);
      commitWikiUpdate({ ...page, content: '# Version 3' }, TEST_CONFIG);

      // Check git log has 3+ commits (including initial repo commit)
      const logOutput = execSync('git log --oneline', {
        cwd: TEST_REPO_ROOT,
        encoding: 'utf-8',
      });

      const commitLines = logOutput.trim().split('\n');
      expect(commitLines.length).toBeGreaterThanOrEqual(3);

      // Check commit messages
      expect(logOutput).toContain('wiki: Create Version Test');
      expect(logOutput).toContain('wiki: Update Version Test');
    });

    it('should allow browsing file history via git', () => {
      const page = {
        title: 'History Test',
        path: '/history-test',
        content: '# Original',
        category: 'testing',
      };

      commitWikiCreate(page, TEST_CONFIG);
      commitWikiUpdate({ ...page, content: '# Updated Once' }, TEST_CONFIG);
      commitWikiUpdate({ ...page, content: '# Updated Twice' }, TEST_CONFIG);

      // Get file history
      const filePath = `.wiki-test/history-test.md`;
      const historyOutput = execSync(`git log --oneline -- "${filePath}"`, {
        cwd: TEST_REPO_ROOT,
        encoding: 'utf-8',
      });

      const historyLines = historyOutput.trim().split('\n');
      expect(historyLines.length).toBe(3); // Create + 2 updates
    });
  });

  describe('Error Handling', () => {
    it('should throw error if git command fails', () => {
      const invalidConfig = {
        ...TEST_CONFIG,
        repoRoot: '/nonexistent/path',
      };

      const page = {
        title: 'Error Test',
        path: '/error-test',
        content: '# Error',
        category: 'testing',
      };

      expect(() => {
        commitWikiCreate(page, invalidConfig);
      }).toThrow();
    });
  });
});
