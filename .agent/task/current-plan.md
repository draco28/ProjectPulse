# Implementation Plan: Sprint 2 Week 1 Day 5-6

**Date**: 2025-11-09 21:30
**Phase**: Sprint 2 Week 1 Day 5-6 - Git Hooks + MCP Tool
**Story Points**: ~8 points (5 for git hooks + 3 for MCP tool)
**Dependencies**: Week 1 Day 3-5 complete (templates + extractors + sync service ✅)

---

## Overview

Complete the markdown sync automation layer by adding:
1. Generated files registry (.agent/generated-files.json)
2. Pre-commit hook validation (prevent manual edits)
3. MCP tool for triggering sync from agents
4. Windows testing of git hooks

## Success Criteria

- [ ] .agent/generated-files.json tracks all generated markdown files
- [ ] Pre-commit hook prevents manual edits to generated files
- [ ] Hook reads registry dynamically (no hardcoded filenames)
- [ ] MCP tool syncs markdown via HTTP endpoint
- [ ] Hooks tested on Windows
- [ ] Zero TypeScript errors

---

## Implementation Steps

### Step 1: Generated Files Registry (30 mins)

**File**: `.agent/generated-files.json`

Create JSON registry to track all auto-generated markdown files:

```json
{
  "version": "1.0",
  "lastUpdated": "2025-11-09T21:30:00Z",
  "generatedFiles": [
    {
      "path": "STATUS.md",
      "category": "tracking",
      "templateId": "status-template",
      "contentHash": "sha256_hash_here",
      "lastGenerated": "2025-11-09T20:45:00Z"
    }
  ]
}
```

**Why this matters**: Git hooks will read this registry dynamically instead of hardcoding filenames. This allows EPIC-012 to add 13 new document templates without modifying the hook script.

---

### Step 2: Update Sync Service to Maintain Registry (45 mins)

**File**: `apps/web/lib/services/markdown-sync-service.ts`

Add registry update logic to `syncMarkdownFiles()`:

```typescript
async function updateGeneratedFilesRegistry(syncedFiles: SyncResult[]) {
  const registry = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    generatedFiles: syncedFiles.map(f => ({
      path: f.path,
      category: f.category,
      templateId: f.templateId,
      contentHash: f.contentHash,
      lastGenerated: new Date().toISOString()
    }))
  };

  await fs.writeFile(
    '.agent/generated-files.json',
    JSON.stringify(registry, null, 2)
  );
}
```

**Integration point**: Call `updateGeneratedFilesRegistry()` after successful sync.

---

### Step 3: Create Pre-Commit Hook (60 mins)

**File**: `.husky/pre-commit`

Create Node.js script for cross-platform compatibility:

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read generated files registry
const registryPath = path.join(process.cwd(), '.agent', 'generated-files.json');

if (!fs.existsSync(registryPath)) {
  console.log('⚠️  Warning: .agent/generated-files.json not found. Skipping validation.');
  process.exit(0);
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const generatedPaths = registry.generatedFiles.map(f => f.path);

// Get staged files
const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// Check for manual edits to generated files
const protectedEdits = stagedFiles.filter(file => generatedPaths.includes(file));

if (protectedEdits.length > 0) {
  console.error('❌ ERROR: Manual edits to auto-generated files detected!');
  console.error('');
  console.error('Protected files:');
  protectedEdits.forEach(file => console.error(`  - ${file}`));
  console.error('');
  console.error('These files are auto-generated from the database.');
  console.error('To update them, use: pnpm mcp:sync-markdown');
  console.error('');
  console.error('To bypass (emergencies only): git commit --no-verify');
  process.exit(1);
}

console.log('✅ Pre-commit validation passed');
process.exit(0);
```

**Windows compatibility**: Node.js scripts work cross-platform (unlike shell scripts).

---

### Step 4: Configure Husky (15 mins)

**File**: `package.json`

Ensure husky is configured:

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^8.0.0"
  }
}
```

**Commands**:
```bash
npx husky install
npx husky add .husky/pre-commit "node .husky/pre-commit"
chmod +x .husky/pre-commit
```

---

### Step 5: Create MCP Tool (60 mins)

**File**: `apps/mcp-server/src/tools/markdown-sync.ts`

Create MCP tool wrapper for markdown sync:

```typescript
import { McpTool, McpToolCall } from '../types/mcp.js';
import { httpClient } from '../utils/http-client.js';

export const markdownSyncTool: McpTool = {
  name: 'projectpulse.markdown.sync',
  description: 'Sync markdown files from database (STATUS.md, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by category (e.g., "tracking", "industry_doc"). Syncs all if omitted.',
        enum: ['tracking', 'industry_doc', 'memory_bank']
      },
      force: {
        type: 'boolean',
        description: 'Force sync even if content hash matches',
        default: false
      }
    }
  },

  async execute(call: McpToolCall) {
    const { category, force = false } = call.params as {
      category?: string;
      force?: boolean;
    };

    // Call HTTP endpoint on Mac mini
    const response = await httpClient.post('/api/markdown/sync', {
      category,
      force
    });

    if (!response.ok) {
      throw new Error(`Markdown sync failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: `✅ Markdown sync complete\n\n` +
                `Synced ${result.syncedCount} file(s) in ${result.duration}ms\n\n` +
                `Files updated:\n${result.files.map(f => `  - ${f.path}`).join('\n')}`
        }
      ]
    };
  }
};
```

**API endpoint**: Already exists from Day 3-5 (`POST /api/markdown/sync`).

---

### Step 6: Register MCP Tool (10 mins)

**File**: `apps/mcp-server/src/tools/index.ts`

Add to tool registry:

```typescript
import { markdownSyncTool } from './markdown-sync.js';

export const tools = [
  // ... existing tools
  markdownSyncTool
];
```

---

### Step 7: Windows Testing (45 mins)

**Test scenarios**:

1. **Registry creation**: Run sync → verify .agent/generated-files.json created
2. **Hook blocks manual edit**: Edit STATUS.md → git add → git commit → verify blocked
3. **Hook allows other files**: Edit README.md → git commit → verify allowed
4. **Bypass works**: git commit --no-verify → verify bypass works
5. **MCP tool works**: Call projectpulse.markdown.sync → verify sync completes

**Test on Windows** (current environment).

---

### Step 8: Documentation (30 mins)

**Files to update**:

1. `.agent/sops/git-workflow.md` - Add hook bypass instructions
2. `.agent/system/mcp-tools-guide.md` - Add markdown.sync tool
3. `current-session-20251109-2130.md` - Update with implementation notes

---

## Time Estimates

| Step | Estimated Time | Complexity |
|------|---------------|------------|
| 1. Registry structure | 30 mins | Low |
| 2. Update sync service | 45 mins | Medium |
| 3. Pre-commit hook | 60 mins | Medium |
| 4. Configure Husky | 15 mins | Low |
| 5. Create MCP tool | 60 mins | Medium |
| 6. Register tool | 10 mins | Low |
| 7. Windows testing | 45 mins | Medium |
| 8. Documentation | 30 mins | Low |
| **Total** | **~5 hours** | **Medium** |

---

## Dependencies

**From Previous Session (Day 3-5)** ✅:
- MarkdownFile Prisma schema
- TemplateEngine with Handlebars
- DataExtractorRegistry with status extractor
- MarkdownSyncService with SHA-256 hashing
- POST /api/markdown/sync endpoint

**Required for This Session**:
- Husky installed (check package.json)
- Git configured on Windows
- MCP server infrastructure (from Sprint 1)

---

## Risks & Mitigations

**Risk 1: Windows git hooks fail**
- Mitigation: Use Node.js script (not shell script)
- Fallback: Manual validation script

**Risk 2: Registry not found on first run**
- Mitigation: Graceful degradation (skip validation if registry missing)
- Solution: Run sync once to create registry

**Risk 3: MCP tool HTTP call fails**
- Mitigation: Proper error handling with descriptive messages
- Fallback: Direct API call documentation

---

## Definition of Done

- [ ] .agent/generated-files.json created and tracked
- [ ] Pre-commit hook prevents manual STATUS.md edits
- [ ] Hook reads registry dynamically (no hardcoded paths)
- [ ] Husky configured and working on Windows
- [ ] MCP tool syncs markdown via HTTP
- [ ] All 5 test scenarios pass on Windows
- [ ] Documentation updated
- [ ] Zero TypeScript errors
- [ ] Changes committed to feature/sprint-2-markdown-sync

---

**Plan Complete** ✅
**Ready to Execute**: Yes
**Expert Consultation**: Not required (patterns established in Day 3-5)
