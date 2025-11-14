/**
 * Git integration for wiki pages
 *
 * Automatically commits wiki changes to git repository:
 * - Exports wiki pages to markdown files (.wiki/ folder)
 * - Creates git commits on create/update/delete
 * - Returns commit SHA for tracking
 *
 * Features:
 * - Descriptive commit messages
 * - Metadata preservation (frontmatter)
 * - Git history browsable via GitKraken/CLI
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Configuration for git integration
 */
export interface GitIntegrationConfig {
  /** Root directory of git repository */
  repoRoot: string;
  /** Directory for wiki markdown files (relative to repoRoot) */
  wikiDir: string;
  /** Git user name for commits */
  gitUserName?: string;
  /** Git user email for commits */
  gitUserEmail?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: GitIntegrationConfig = {
  repoRoot: process.cwd(),
  wikiDir: '.wiki',
  gitUserName: 'ProjectPulse Wiki Bot',
  gitUserEmail: 'wiki-bot@projectpulse.local',
};

/**
 * Result of git commit operation
 */
export interface GitCommitResult {
  /** Git commit SHA */
  commitSha: string;
  /** Commit message used */
  message: string;
  /** File path that was committed */
  filePath: string;
  /** Operation type */
  operation: 'create' | 'update' | 'delete';
}

/**
 * Convert wiki page to markdown file content with frontmatter
 *
 * @param page - Wiki page data
 * @returns Markdown file content with YAML frontmatter
 *
 * @example
 * const markdown = wikiPageToMarkdown({
 *   title: "API Reference",
 *   path: "/api-reference",
 *   content: "# API\n\nDocumentation...",
 *   category: "reference",
 *   tags: ["api", "docs"]
 * });
 * // Returns:
 * // ---
 * // title: API Reference
 * // path: /api-reference
 * // category: reference
 * // tags: [api, docs]
 * // createdAt: 2025-11-14T...
 * // ---
 * // # API
 * // Documentation...
 */
export function wikiPageToMarkdown(page: {
  title: string;
  path: string;
  content: string;
  category: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  excerpt?: string | null;
}): string {
  // Build YAML frontmatter
  const frontmatter: Record<string, any> = {
    title: page.title,
    path: page.path,
    category: page.category,
  };

  if (page.tags && page.tags.length > 0) {
    frontmatter.tags = page.tags;
  }

  if (page.excerpt) {
    frontmatter.excerpt = page.excerpt;
  }

  if (page.createdAt) {
    frontmatter.createdAt = page.createdAt.toISOString();
  }

  if (page.updatedAt) {
    frontmatter.updatedAt = page.updatedAt.toISOString();
  }

  // Convert frontmatter to YAML
  const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.join(', ')}]`;
    }
    return `${key}: ${value}`;
  });

  const yaml = yamlLines.join('\n');

  // Combine frontmatter + content
  return `---\n${yaml}\n---\n\n${page.content}`;
}

/**
 * Get file path for wiki page in .wiki/ directory
 *
 * @param wikiPath - Wiki page path (e.g., "/api-reference")
 * @param config - Git integration config
 * @returns Absolute file path
 *
 * @example
 * getWikiFilePath("/api-reference", config)
 * // Returns: "/path/to/repo/.wiki/api-reference.md"
 */
export function getWikiFilePath(
  wikiPath: string,
  config: GitIntegrationConfig = DEFAULT_CONFIG
): string {
  // Remove leading slash, ensure .md extension
  const slug = wikiPath.replace(/^\//, '');
  const filename = slug.endsWith('.md') ? slug : `${slug}.md`;

  const wikiDirPath = join(config.repoRoot, config.wikiDir);
  return join(wikiDirPath, filename);
}

/**
 * Ensure .wiki/ directory exists
 *
 * @param config - Git integration config
 */
function ensureWikiDir(config: GitIntegrationConfig = DEFAULT_CONFIG): void {
  const wikiDirPath = join(config.repoRoot, config.wikiDir);

  if (!existsSync(wikiDirPath)) {
    mkdirSync(wikiDirPath, { recursive: true });
  }
}

/**
 * Execute git command and return output
 *
 * @param command - Git command to execute
 * @param config - Git integration config
 * @returns Command output (trimmed)
 */
function execGit(
  command: string,
  config: GitIntegrationConfig = DEFAULT_CONFIG
): string {
  try {
    return execSync(command, {
      cwd: config.repoRoot,
      encoding: 'utf-8',
    }).trim();
  } catch (error: any) {
    throw new Error(`Git command failed: ${command}\n${error.message}`);
  }
}

/**
 * Commit wiki page creation to git
 *
 * Creates markdown file in .wiki/ directory and commits with message:
 * "wiki: Create [page-title]"
 *
 * @param page - Wiki page data
 * @param config - Git integration config
 * @returns Commit result with SHA
 *
 * @example
 * const result = await commitWikiCreate({
 *   title: "API Reference",
 *   path: "/api-reference",
 *   content: "# API\n...",
 *   category: "reference"
 * });
 * // Returns: { commitSha: "abc123...", message: "wiki: Create API Reference", ... }
 */
export function commitWikiCreate(
  page: {
    title: string;
    path: string;
    content: string;
    category: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    excerpt?: string | null;
  },
  config: GitIntegrationConfig = DEFAULT_CONFIG
): GitCommitResult {
  ensureWikiDir(config);

  // Convert to markdown with frontmatter
  const markdown = wikiPageToMarkdown(page);
  const filePath = getWikiFilePath(page.path, config);

  // Write markdown file
  writeFileSync(filePath, markdown, 'utf-8');

  // Git add + commit
  const relativeFilePath = join(config.wikiDir, page.path.replace(/^\//, '') + '.md');
  const message = `wiki: Create ${page.title}\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;

  // Configure git user (if specified)
  if (config.gitUserName) {
    execGit(`git config user.name "${config.gitUserName}"`, config);
  }
  if (config.gitUserEmail) {
    execGit(`git config user.email "${config.gitUserEmail}"`, config);
  }

  // Stage file
  execGit(`git add "${relativeFilePath}"`, config);

  // Commit
  execGit(`git commit -m "${message}"`, config);

  // Get commit SHA
  const commitSha = execGit('git rev-parse HEAD', config);

  return {
    commitSha,
    message,
    filePath: relativeFilePath,
    operation: 'create',
  };
}

/**
 * Commit wiki page update to git
 *
 * Updates markdown file in .wiki/ directory and commits with message:
 * "wiki: Update [page-title]"
 *
 * @param page - Wiki page data
 * @param config - Git integration config
 * @returns Commit result with SHA
 *
 * @example
 * const result = await commitWikiUpdate({
 *   title: "API Reference",
 *   path: "/api-reference",
 *   content: "# API (updated)\n...",
 *   category: "reference"
 * });
 * // Returns: { commitSha: "def456...", message: "wiki: Update API Reference", ... }
 */
export function commitWikiUpdate(
  page: {
    title: string;
    path: string;
    content: string;
    category: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    excerpt?: string | null;
  },
  config: GitIntegrationConfig = DEFAULT_CONFIG
): GitCommitResult {
  ensureWikiDir(config);

  // Convert to markdown with frontmatter
  const markdown = wikiPageToMarkdown(page);
  const filePath = getWikiFilePath(page.path, config);

  // Write markdown file
  writeFileSync(filePath, markdown, 'utf-8');

  // Git add + commit
  const relativeFilePath = join(config.wikiDir, page.path.replace(/^\//, '') + '.md');
  const message = `wiki: Update ${page.title}\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;

  // Configure git user (if specified)
  if (config.gitUserName) {
    execGit(`git config user.name "${config.gitUserName}"`, config);
  }
  if (config.gitUserEmail) {
    execGit(`git config user.email "${config.gitUserEmail}"`, config);
  }

  // Stage file
  execGit(`git add "${relativeFilePath}"`, config);

  // Commit
  execGit(`git commit -m "${message}"`, config);

  // Get commit SHA
  const commitSha = execGit('git rev-parse HEAD', config);

  return {
    commitSha,
    message,
    filePath: relativeFilePath,
    operation: 'update',
  };
}

/**
 * Commit wiki page deletion to git
 *
 * Removes markdown file from .wiki/ directory and commits with message:
 * "wiki: Delete [page-title]"
 *
 * @param page - Wiki page data (title and path needed)
 * @param config - Git integration config
 * @returns Commit result with SHA
 *
 * @example
 * const result = await commitWikiDelete({
 *   title: "API Reference",
 *   path: "/api-reference"
 * });
 * // Returns: { commitSha: "ghi789...", message: "wiki: Delete API Reference", ... }
 */
export function commitWikiDelete(
  page: {
    title: string;
    path: string;
  },
  config: GitIntegrationConfig = DEFAULT_CONFIG
): GitCommitResult {
  const filePath = getWikiFilePath(page.path, config);

  // Delete file if exists
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }

  // Git rm + commit
  const relativeFilePath = join(config.wikiDir, page.path.replace(/^\//, '') + '.md');
  const message = `wiki: Delete ${page.title}\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;

  // Configure git user (if specified)
  if (config.gitUserName) {
    execGit(`git config user.name "${config.gitUserName}"`, config);
  }
  if (config.gitUserEmail) {
    execGit(`git config user.email "${config.gitUserEmail}"`, config);
  }

  // Stage deletion
  execGit(`git rm "${relativeFilePath}"`, config);

  // Commit
  execGit(`git commit -m "${message}"`, config);

  // Get commit SHA
  const commitSha = execGit('git rev-parse HEAD', config);

  return {
    commitSha,
    message,
    filePath: relativeFilePath,
    operation: 'delete',
  };
}
