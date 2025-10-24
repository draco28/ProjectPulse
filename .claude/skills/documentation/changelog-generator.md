---
name: Changelog Generator (DevHub)
description: Generate release notes and changelogs from git history with dual-audience format (technical + user-facing)
category: documentation
version: 1.0
project: Moksha DevHub (AI_HUB)
---

# Changelog Generator for Moksha DevHub

## Overview

This skill provides patterns for generating comprehensive, well-organized changelogs from git commit history, formatted for both technical and user-facing audiences.

## Changelog Format

### Standard Format (Keep a Changelog)
```markdown
# Changelog

All notable changes to Moksha DevHub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Issue filtering by priority and module
- Hybrid search (full-text + semantic) for knowledge base
- Agent persona system with MCP Prompts integration

### Changed
- Improved database query performance with indexes
- Updated issue list UI with better responsive design

### Fixed
- Issue creation validation now properly handles empty titles
- Search no longer fails on special characters

### Removed
- Deprecated REST API v1 endpoints

## [1.0.0] - 2025-01-15

### Added
- Initial release
- Issue tracker with CRUD operations
- Knowledge base with semantic search
- Documentation wiki
- MCP integration for Claude Code

[Unreleased]: https://github.com/user/moksha-devhub/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/moksha-devhub/releases/tag/v1.0.0
```

## Categorization Rules

### Added
New features, capabilities, or content
```
- Issue filtering by status, priority, and module
- MCP tool: execute_helper_script with tiered permissions
- Agent persona editor UI with live preview
```

### Changed
Modifications to existing features
```
- Improved search relevance algorithm (hybrid search)
- Updated UI components to use shadcn/ui latest version
- Refactored API routes for better performance
```

### Fixed
Bug fixes and corrections
```
- Fixed hydration mismatch in IssueList component
- Corrected timezone handling in date display
- Resolved N+1 query issue in issue list endpoint
```

### Deprecated
Features marked for removal in future
```
- API v1 endpoints (use v2 instead)
- Direct Prisma queries in components (use Server Components)
```

### Removed
Deleted features or code
```
- Removed experimental real-time sync feature
- Deleted unused MCP tools
```

### Security
Security fixes and improvements
```
- Fixed SQL injection vulnerability in search endpoint
- Updated dependencies to patch security vulnerabilities
- Added rate limiting to API routes
```

## Generating from Git History

### Extract Commits
```bash
# Get commits since last release
git log v1.0.0..HEAD --pretty=format:"%h - %s (%an, %ar)"

# Get commits by date range
git log --since="2025-01-01" --pretty=format:"%h - %s"

# Get commits for specific file/directory
git log --oneline -- app/api/issues/
```

### Parse Conventional Commits
```bash
# feat: New feature
git log --grep="^feat:" --oneline

# fix: Bug fix
git log --grep="^fix:" --oneline

# docs: Documentation
git log --grep="^docs:" --oneline

# refactor: Code refactor
git log --grep="^refactor:" --oneline

# perf: Performance improvement
git log --grep="^perf:" --oneline
```

## Automated Changelog Script

```typescript
// scripts/generate-changelog.ts
import { execSync } from 'child_process';
import fs from 'fs';

type CommitType = 'feat' | 'fix' | 'docs' | 'refactor' | 'perf' | 'test' | 'chore';

interface Commit {
  type: CommitType | null;
  scope: string | null;
  message: string;
  hash: string;
}

function parseCommit(line: string): Commit | null {
  // Parse: "abc123 feat(api): add search endpoint"
  const match = line.match(/^(\w+) (\w+)(\(([^)]+)\))?: (.+)$/);

  if (!match) return null;

  return {
    hash: match[1],
    type: match[2] as CommitType,
    scope: match[4] || null,
    message: match[5],
  };
}

function generateChangelog(since: string) {
  // Get commits
  const log = execSync(`git log ${since}..HEAD --oneline`).toString();
  const commits = log
    .split('\n')
    .map(parseCommit)
    .filter(Boolean) as Commit[];

  // Categorize
  const categories = {
    Added: commits.filter((c) => c.type === 'feat'),
    Fixed: commits.filter((c) => c.type === 'fix'),
    Changed: commits.filter((c) => c.type === 'refactor'),
    Performance: commits.filter((c) => c.type === 'perf'),
  };

  // Generate markdown
  let changelog = `## [Unreleased]\n\n`;

  for (const [category, items] of Object.entries(categories)) {
    if (items.length === 0) continue;

    changelog += `### ${category}\n`;
    for (const commit of items) {
      const scope = commit.scope ? `**${commit.scope}**: ` : '';
      changelog += `- ${scope}${commit.message} (${commit.hash})\n`;
    }
    changelog += '\n';
  }

  return changelog;
}

// Usage
const changelog = generateChangelog('v1.0.0');
console.log(changelog);
```

## User-Facing vs Technical Format

### Technical (for developers)
```markdown
### Fixed
- Fixed N+1 query in `/api/issues` endpoint by adding Prisma include (#142)
- Resolved hydration mismatch in IssueCard component (abc1234)
- Corrected SQL injection vulnerability in search (CRITICAL - CVE-2025-1234)
```

### User-Facing (for end users)
```markdown
### Improvements
- Issue list now loads 3x faster with improved database queries
- Fixed issue cards not displaying correctly on first page load
- Enhanced security measures for search functionality
```

## Release Notes Template

```markdown
# Moksha DevHub v1.1.0 - "Enhanced Search"

**Release Date:** January 15, 2025

## Highlights

🔍 **Hybrid Search** - Combine full-text and semantic search for better results
🎨 **UI Refresh** - Modernized interface with improved accessibility
🚀 **Performance** - 50% faster page loads with optimized queries

## What's New

### Features
- Hybrid search combining PostgreSQL full-text and pgvector semantic search
- Agent persona system for specialized workflows
- MCP tool execution with tiered permissions
- Issue filtering by multiple criteria

### Improvements
- Redesigned issue list with responsive card layout
- Enhanced database query performance
- Better error messages throughout the app
- Improved mobile experience

### Bug Fixes
- Fixed search not working with special characters
- Resolved issue creation validation errors
- Corrected timezone display in date fields

### Security
- Added input validation for all API endpoints
- Updated dependencies to latest secure versions
- Implemented rate limiting

## Upgrade Guide

```bash
git pull origin main
npm install
npx prisma migrate deploy
npm run build
```

## Breaking Changes

⚠️ **API v1 Deprecated** - Use API v2 endpoints. Migration guide: [MIGRATION.md](./MIGRATION.md)

## Contributors

Thanks to all contributors who made this release possible!

## What's Next

- Wiki system with hierarchical pages (v1.2.0)
- Security dashboard with Semgrep integration (v1.2.0)
- Advanced analytics (v1.3.0)

Full changelog: [CHANGELOG.md](./CHANGELOG.md)
```

## Best Practices

### 1. Write for Your Audience
- **Technical**: Include PR numbers, commit hashes, file paths
- **User-Facing**: Focus on benefits, improvements, user impact

### 2. Be Specific
```
❌ "Fixed bugs"
✅ "Fixed issue creation form not submitting on Enter key press"

❌ "Improved performance"
✅ "Reduced page load time by 50% through database query optimization"
```

### 3. Include Context
```
✅ "Added pagination to issue list (fixes timeout on large datasets)"
✅ "Updated to Next.js 14.2 for better streaming support"
```

### 4. Link to Documentation
```
✅ "Added MCP integration. See [MCP Setup Guide](./docs/mcp-setup.md)"
✅ "Breaking change: API authentication. Migration: [AUTH.md](./AUTH.md)"
```

### 5. Highlight Security Fixes
```
✅ "SECURITY: Fixed SQL injection in search endpoint (CVE-2025-1234)"
✅ "Updated dependencies to address security vulnerabilities"
```

## Success Criteria

Good changelog when:
- [ ] All significant changes documented
- [ ] Changes categorized logically
- [ ] Includes version number and date
- [ ] Breaking changes clearly marked
- [ ] Links to relevant documentation
- [ ] Easy to scan quickly
- [ ] Appropriate level of detail for audience

## Integration with Agents

This skill is used by:
- **devhub-auditor** - To verify changelog is up-to-date
- **devhub-fullstack** - When preparing releases
- All agents - To document significant changes

Pair with:
- **verification-before-completion** - Ensure changelog updated before release
- **api-design-patterns** - Document API changes properly

Remember: A good changelog is a form of communication with users and future maintainers. Make it clear, accurate, and helpful.
