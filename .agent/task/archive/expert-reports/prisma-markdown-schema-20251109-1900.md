# Prisma Design Plan: Generic MarkdownFile Schema for Sprint 2 + EPIC-012

**Created**: 2025-11-09 19:00
**Type**: Schema Design + Migration Strategy
**Context**: Sprint 2 (Weeks 3-4) - Markdown Sync + Workflow Foundation
**Critical Requirement**: Support 2 docs in Sprint 2, 13+ docs in EPIC-012 WITHOUT schema migration

---

## Executive Summary

This schema design ensures Sprint 2's markdown sync system is **generic and extensible** from day one, eliminating 45 story points of refactoring work in EPIC-012.

**Key Decisions**:
1. ✅ **Strings over Enums** - Unlimited document types without migrations
2. ✅ **Path Flexibility** - ANY directory supported (root, docs/, .agent/)
3. ✅ **Plugin Architecture** - Template registration system (not hardcoded switch statements)
4. ✅ **Zero Refactoring** - EPIC-012 adds templates, NOT schema changes

---

## Data Model Requirements

### Sprint 2 (2 Documents)
- STATUS.md - Auto-sync project status (root directory)
- DEVELOPMENT_PLAN.md - Auto-sync sprint roadmap (root directory)
- Category: 'tracking'
- Sync Strategy: 'auto' (regenerate on every database change)

### EPIC-012 (13 Additional Documents)
- docs/01-PRD.md (Product Requirements)
- docs/02-SRS.md (Software Requirements)
- docs/03-Architecture.md (System Design)
- docs/04-Data-and-Model-Spec.md (Database Schema)
- docs/05-AgentOps-Plan.md (Agent Workflows)
- docs/06-API/openapi.yaml (API Specification)
- docs/07-UI-UX.md (User Experience)
- docs/08-Security-and-Compliance.md (Security Model)
- docs/09-Testing-and-QA.md (Test Strategy)
- docs/10-Observability-and-SRE.md (Monitoring)
- docs/11-Infrastructure.md (Deployment)
- docs/12-Backlog.md (User Stories)
- docs/13-Project-Plan.md (Sprint Roadmap)
- Category: 'industry_doc'
- Sync Strategy: 'curated' (regenerate only when explicitly requested)

### Future Extensibility (Beyond EPIC-012)
- .agent/project-brief.md (Memory Bank)
- .agent/system-patterns.md (Memory Bank)
- .agent/tech-context.md (Memory Bank)
- .agent/active-context.md (Memory Bank)
- .agent/progress.md (Memory Bank)
- Category: 'memory_bank'
- Sync Strategy: 'manual' (user-controlled regeneration)

---

## Schema Design (Final Recommendation)

```prisma
model MarkdownFile {
  id            String   @id @default(cuid())
  projectId     String

  // Document Identification (String - NOT Enum)
  slug          String   // 'STATUS', 'DEVELOPMENT_PLAN', '01-PRD', '02-SRS', etc.
  path          String   // 'STATUS.md', 'docs/01-PRD.md', '.agent/progress.md'

  // Categorization (String - NOT Enum)
  category      String   // 'tracking', 'industry_doc', 'memory_bank', 'custom'

  // Sync Strategy (String - NOT Enum)
  syncStrategy  String   // 'auto', 'curated', 'manual'

  // Template System (String - NOT FK to Template table)
  templateId    String   // 'status-template', 'prd-template', 'project-brief-template'

  // Content Tracking
  contentHash   String?  @db.Char(64) // SHA-256 hash (64 hex chars)
  lastSyncedAt  DateTime?

  // Metadata
  isGenerated   Boolean  @default(true) // false = manually created file
  status        String   @default("active") // 'active', 'deprecated', 'archived'
  metadata      Json?    @db.JsonB // Extensible metadata (e.g., { author, version, tags })

  // Relationships
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Indexes
  @@unique([projectId, slug]) // Prevent duplicate slugs per project
  @@index([projectId, category]) // Query by category (e.g., sync only 'tracking' docs)
  @@index([projectId, status]) // Query active vs deprecated docs
  @@index([projectId, syncStrategy]) // Query by sync strategy
  @@index([lastSyncedAt]) // Find stale documents

  @@map("markdown_files")
}

// Add relation to existing Project model
model Project {
  // ... existing fields ...
  markdownFiles MarkdownFile[]
}
```

---

## Design Rationale: String vs Enum

### Decision: Use Strings for ALL enum-like fields

**Fields Affected**: `slug`, `category`, `syncStrategy`, `templateId`, `status`

**Rationale**:

| Consideration | String (✅ Chosen) | Enum (❌ Rejected) |
|--------------|-------------------|-------------------|
| **EPIC-012 Impact** | Zero schema migration required | Must add 13 enum values → schema migration |
| **Flexibility** | Unlimited document types | Must migrate for each new type |
| **Database Validation** | Application-level Zod validation | Database-level enum validation |
| **Code Changes** | Register template in code only | Register template + migrate schema |
| **Migration Risk** | None | Production downtime for enum changes |
| **Developer Workflow** | Add template file → restart server | Add template → migrate DB → restart |

**Example Impact on EPIC-012**:

**With Enums (❌ Rejected)**:
```prisma
// Sprint 2 schema
enum DocumentSlug {
  STATUS
  DEVELOPMENT_PLAN
}

// EPIC-012 requires schema migration
enum DocumentSlug {
  STATUS
  DEVELOPMENT_PLAN
  PRD         // ← 13 new values
  SRS
  ARCHITECTURE
  // ... 10 more
}
```
**Result**: ~8 story points just for schema migration + testing

**With Strings (✅ Chosen)**:
```prisma
// Sprint 2 schema (unchanged in EPIC-012)
slug String

// EPIC-012 adds NO schema changes
// Just register templates:
templateEngine.register('prd-template', prdTemplate);
```
**Result**: Zero schema changes, zero migration story points

---

## Field Specifications

### 1. `slug` (String, Required)
**Purpose**: Human-readable unique identifier per project

**Format**: kebab-case or numbered prefix
- Sprint 2: `'STATUS'`, `'DEVELOPMENT_PLAN'`
- EPIC-012: `'01-PRD'`, `'02-SRS'`, `'03-ARCHITECTURE'`
- Memory Bank: `'project-brief'`, `'system-patterns'`

**Validation** (Zod):
```typescript
z.string()
  .min(1, 'Slug required')
  .max(100, 'Slug too long')
  .regex(/^[a-zA-Z0-9-_]+$/, 'Alphanumeric, hyphens, underscores only')
```

**Why Not Enum**: EPIC-012 adds 13 slugs without schema migration

---

### 2. `path` (String, Required)
**Purpose**: Actual file path relative to project root

**Format**: Unix-style paths with extension
- Root: `'STATUS.md'`, `'DEVELOPMENT_PLAN.md'`
- Subdirectory: `'docs/01-PRD.md'`, `'docs/02-SRS.md'`
- Hidden: `'.agent/progress.md'`, `'.agent/project-brief.md'`
- Nested: `'docs/06-API/openapi.yaml'`

**Validation** (Zod):
```typescript
z.string()
  .min(1, 'Path required')
  .max(500, 'Path too long')
  .regex(/^[a-zA-Z0-9._\/-]+$/, 'Valid file path characters only')
```

**Constraints**:
- No path length limit at DB level (application validates <500 chars)
- Supports ANY directory depth
- Supports ANY file extension (.md, .yaml, .json, .txt)

**Why Not Constraint**: Future documents may use nested paths we can't predict

---

### 3. `category` (String, Required)
**Purpose**: Group documents for filtered sync operations

**Values**:
- Sprint 2: `'tracking'` (STATUS.md, DEVELOPMENT_PLAN.md)
- EPIC-012: `'industry_doc'` (PRD, SRS, Architecture, etc.)
- Sprint 9: `'memory_bank'` (project-brief, system-patterns, etc.)
- Future: `'custom'`, `'template'`, `'report'`

**Use Case**: MCP tool can sync only 'tracking' docs without regenerating all 15 industry docs

**Query Pattern**:
```typescript
// Sync only tracking docs (fast - 2 docs)
await prisma.markdownFile.findMany({
  where: { projectId, category: 'tracking' }
});

// Sync only industry docs (slow - 13 docs, curated strategy)
await prisma.markdownFile.findMany({
  where: { projectId, category: 'industry_doc' }
});
```

**Validation** (Zod):
```typescript
z.enum(['tracking', 'industry_doc', 'memory_bank', 'custom', 'report'])
  .or(z.string().min(1).max(50)) // Allow custom categories
```

**Why Not Enum**: Future categories unknown (e.g., 'compliance_doc', 'onboarding_doc')

---

### 4. `syncStrategy` (String, Required)
**Purpose**: Control regeneration behavior

**Values**:
- `'auto'` - Regenerate on every database change (Sprint 2 tracking docs)
- `'curated'` - Regenerate only when explicitly requested via MCP tool (EPIC-012 industry docs)
- `'manual'` - Never auto-regenerate (Memory Bank files, user-controlled)

**Behavior**:
```typescript
// After any hierarchy change (task progress update, session complete):
if (markdownFile.syncStrategy === 'auto') {
  await regenerateMarkdown(markdownFile);
} else if (markdownFile.syncStrategy === 'curated') {
  // Skip auto-regeneration, wait for MCP tool call
} else if (markdownFile.syncStrategy === 'manual') {
  // Skip entirely, user regenerates manually
}
```

**Validation** (Zod):
```typescript
z.enum(['auto', 'curated', 'manual'])
```

**Why Not Enum**: Unlikely to need more strategies, but string keeps door open

---

### 5. `templateId` (String, Required)
**Purpose**: Link to registered template in TemplateEngine

**Format**: kebab-case identifier
- Sprint 2: `'status-template'`, `'project-plan-template'`
- EPIC-012: `'prd-template'`, `'srs-template'`, `'architecture-template'`
- Memory Bank: `'project-brief-template'`, `'system-patterns-template'`

**Template Registration Pattern**:
```typescript
// lib/markdown/templates/registry.ts
export const templateEngine = {
  templates: new Map<string, TemplateFunction>(),

  register(id: string, template: TemplateFunction) {
    this.templates.set(id, template);
  },

  render(templateId: string, data: any): string {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);
    return template(data);
  }
};

// Sprint 2 registration
templateEngine.register('status-template', statusTemplate);
templateEngine.register('project-plan-template', projectPlanTemplate);

// EPIC-012 registration (NO schema migration!)
templateEngine.register('prd-template', prdTemplate);
templateEngine.register('srs-template', srsTemplate);
// ... 11 more
```

**Why Not FK to Template Table**: Templates are code artifacts, not database entities. Adding template = adding file, not row.

**Validation** (Zod):
```typescript
z.string()
  .min(1, 'Template ID required')
  .max(100, 'Template ID too long')
```

---

### 6. `contentHash` (String?, SHA-256)
**Purpose**: Detect changes to prevent unnecessary regeneration

**Format**: 64 hex characters (SHA-256)

**Database Type**: `@db.Char(64)` - Fixed-length string for exact 64 chars

**Algorithm**:
```typescript
import crypto from 'crypto';

function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Before writing file:
const newHash = generateContentHash(generatedContent);
if (existingFile.contentHash === newHash) {
  console.log('Content unchanged, skipping write');
  return;
}

// Write file and update hash
await fs.writeFile(existingFile.path, generatedContent);
await prisma.markdownFile.update({
  where: { id: existingFile.id },
  data: {
    contentHash: newHash,
    lastSyncedAt: new Date()
  }
});
```

**Why SHA-256**: Industry standard, 64-char hex, zero collisions for our use case

**Why Nullable**: Initial record created before first generation

---

### 7. `lastSyncedAt` (DateTime?, Nullable)
**Purpose**: Track when file was last regenerated

**Use Cases**:
- Identify stale documents (not synced in >7 days)
- Track sync cadence metrics
- Audit trail for compliance

**Query Pattern**:
```typescript
// Find stale tracking docs (auto strategy but not synced in 24 hours)
const staleFiles = await prisma.markdownFile.findMany({
  where: {
    category: 'tracking',
    syncStrategy: 'auto',
    lastSyncedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  }
});
```

**Why Nullable**: Initial record created before first sync

---

### 8. `isGenerated` (Boolean, Default: true)
**Purpose**: Distinguish auto-generated files from manually created files

**Values**:
- `true` - File auto-generated by sync system (default)
- `false` - File manually created by user (custom documentation)

**Use Case**: Prevent accidental overwrite of manually created files

**Safety Check**:
```typescript
async function regenerateMarkdown(file: MarkdownFile) {
  if (!file.isGenerated) {
    throw new Error(`Cannot regenerate manually created file: ${file.path}`);
  }
  // Proceed with regeneration
}
```

**Why Boolean**: Clear binary state, no gray area

---

### 9. `status` (String, Default: 'active')
**Purpose**: Lifecycle management for documents

**Values**:
- `'active'` - Currently maintained file (default)
- `'deprecated'` - Old file, replaced by new version (e.g., STATUS.md → docs/13-Project-Plan.md)
- `'archived'` - Historical record, not synced or displayed

**Migration Workflow** (EPIC-012):
```typescript
// Step 1: Deprecate old files
await prisma.markdownFile.updateMany({
  where: { slug: { in: ['STATUS', 'DEVELOPMENT_PLAN'] } },
  data: { status: 'deprecated' }
});

// Step 2: Create new industry docs
await prisma.markdownFile.create({
  data: {
    slug: '13-PROJECT-PLAN',
    path: 'docs/13-Project-Plan.md',
    category: 'industry_doc',
    syncStrategy: 'curated',
    templateId: 'project-plan-template',
    status: 'active'
  }
});
```

**Query Pattern**:
```typescript
// Only sync active files
await prisma.markdownFile.findMany({
  where: { projectId, status: 'active' }
});
```

**Validation** (Zod):
```typescript
z.enum(['active', 'deprecated', 'archived'])
```

**Why Not Enum**: Unlikely to need more statuses, but string keeps door open

---

### 10. `metadata` (Json?, Nullable)
**Purpose**: Extensible metadata without schema migrations

**Use Cases**:
- Author tracking: `{ author: 'claude-code' }`
- Version info: `{ version: '1.2.0' }`
- Custom tags: `{ tags: ['compliance', 'ISO-9001'] }`
- Display hints: `{ icon: '📄', color: 'blue' }`

**Storage**: PostgreSQL JSONB (indexed queries supported)

**Example**:
```typescript
await prisma.markdownFile.create({
  data: {
    slug: '08-SECURITY',
    path: 'docs/08-Security-and-Compliance.md',
    metadata: {
      author: 'security-expert-agent',
      reviewers: ['compliance-agent', 'architect-agent'],
      lastReviewed: '2025-11-01',
      complianceStandards: ['ISO-27001', 'SOC2'],
      confidentiality: 'internal'
    }
  }
});
```

**Why JSONB**: Future-proof for unknown metadata needs, no schema migration required

---

## Index Strategy (Performance Critical)

### 1. Unique Constraint: `@@unique([projectId, slug])`
**Purpose**: Prevent duplicate document slugs per project

**Query Benefit**: Fast lookup by slug (most common query pattern)
```typescript
await prisma.markdownFile.findUnique({
  where: { projectId_slug: { projectId, slug: 'STATUS' } }
});
```

**Database Enforcement**: Constraint violation if duplicate slug attempted

---

### 2. Composite Index: `@@index([projectId, category])`
**Purpose**: Filter documents by category for selective sync

**Query Pattern**:
```typescript
// Sync only tracking docs (fast)
await prisma.markdownFile.findMany({
  where: { projectId, category: 'tracking' }
});
```

**Performance**: O(log n) lookup instead of full table scan

---

### 3. Composite Index: `@@index([projectId, status])`
**Purpose**: Query only active documents

**Query Pattern**:
```typescript
// List all active documents
await prisma.markdownFile.findMany({
  where: { projectId, status: 'active' }
});
```

**Performance**: Critical for UI display (don't show deprecated docs)

---

### 4. Composite Index: `@@index([projectId, syncStrategy])`
**Purpose**: Identify which documents need auto-regeneration

**Query Pattern**:
```typescript
// Find all auto-sync docs after task update
const autoSyncFiles = await prisma.markdownFile.findMany({
  where: { projectId, syncStrategy: 'auto' }
});
```

**Performance**: Fast filtering for sync trigger logic

---

### 5. Single Column Index: `@@index([lastSyncedAt])`
**Purpose**: Find stale documents across all projects

**Query Pattern**:
```typescript
// Admin dashboard: Find stale documents globally
const staleFiles = await prisma.markdownFile.findMany({
  where: {
    lastSyncedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    syncStrategy: 'auto'
  }
});
```

**Performance**: Global monitoring query without project filter

---

## Migration Strategy for EPIC-012

### Goal: Add 13 Documents WITHOUT Schema Migration

**Proof of Zero-Refactoring Claim**:

#### Sprint 2 Implementation (Weeks 3-4)

**Schema Migration**:
```sql
-- 20251110_add_markdown_files.sql
CREATE TABLE markdown_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  path TEXT NOT NULL,
  category TEXT NOT NULL,
  sync_strategy TEXT NOT NULL,
  template_id TEXT NOT NULL,
  content_hash CHAR(64),
  last_synced_at TIMESTAMP,
  is_generated BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX markdown_files_project_slug ON markdown_files(project_id, slug);
CREATE INDEX markdown_files_project_category ON markdown_files(project_id, category);
CREATE INDEX markdown_files_project_status ON markdown_files(project_id, status);
CREATE INDEX markdown_files_project_sync ON markdown_files(project_id, sync_strategy);
CREATE INDEX markdown_files_last_synced ON markdown_files(last_synced_at);
```

**Seed Data** (2 documents):
```typescript
// prisma/seed.ts
await prisma.markdownFile.createMany({
  data: [
    {
      slug: 'STATUS',
      path: 'STATUS.md',
      category: 'tracking',
      syncStrategy: 'auto',
      templateId: 'status-template',
      status: 'active',
      projectId: defaultProject.id
    },
    {
      slug: 'DEVELOPMENT_PLAN',
      path: 'DEVELOPMENT_PLAN.md',
      category: 'tracking',
      syncStrategy: 'auto',
      templateId: 'project-plan-template',
      status: 'active',
      projectId: defaultProject.id
    }
  ]
});
```

**Template Registration**:
```typescript
// lib/markdown/templates/registry.ts
import { statusTemplate } from './status-template';
import { projectPlanTemplate } from './project-plan-template';

export const templateEngine = {
  templates: new Map<string, TemplateFunction>(),
  register(id: string, template: TemplateFunction) {
    this.templates.set(id, template);
  }
};

// Register Sprint 2 templates
templateEngine.register('status-template', statusTemplate);
templateEngine.register('project-plan-template', projectPlanTemplate);
```

---

#### EPIC-012 Implementation (Sprint 10, Weeks 19-20)

**Schema Migration**: ❌ **ZERO CHANGES**

**Seed Data** (13 additional documents):
```typescript
// prisma/seed-epic-012.ts (separate seed for EPIC-012)
const industryDocs = [
  { slug: '01-PRD', path: 'docs/01-PRD.md', templateId: 'prd-template' },
  { slug: '02-SRS', path: 'docs/02-SRS.md', templateId: 'srs-template' },
  { slug: '03-ARCHITECTURE', path: 'docs/03-Architecture.md', templateId: 'architecture-template' },
  { slug: '04-DATA-MODEL', path: 'docs/04-Data-and-Model-Spec.md', templateId: 'data-model-template' },
  { slug: '05-AGENTOPS', path: 'docs/05-AgentOps-Plan.md', templateId: 'agentops-template' },
  { slug: '06-API', path: 'docs/06-API/openapi.yaml', templateId: 'openapi-template' },
  { slug: '07-UI-UX', path: 'docs/07-UI-UX.md', templateId: 'ui-ux-template' },
  { slug: '08-SECURITY', path: 'docs/08-Security-and-Compliance.md', templateId: 'security-template' },
  { slug: '09-TESTING', path: 'docs/09-Testing-and-QA.md', templateId: 'testing-template' },
  { slug: '10-OBSERVABILITY', path: 'docs/10-Observability-and-SRE.md', templateId: 'observability-template' },
  { slug: '11-INFRASTRUCTURE', path: 'docs/11-Infrastructure.md', templateId: 'infrastructure-template' },
  { slug: '12-BACKLOG', path: 'docs/12-Backlog.md', templateId: 'backlog-template' },
  { slug: '13-PROJECT-PLAN', path: 'docs/13-Project-Plan.md', templateId: 'project-plan-template' }
];

await prisma.markdownFile.createMany({
  data: industryDocs.map(doc => ({
    ...doc,
    category: 'industry_doc',
    syncStrategy: 'curated',
    status: 'active',
    projectId: defaultProject.id
  }))
});
```

**Template Registration** (13 new templates):
```typescript
// lib/markdown/templates/registry.ts (extended)
import { prdTemplate } from './prd-template';
import { srsTemplate } from './srs-template';
import { architectureTemplate } from './architecture-template';
// ... 10 more imports

// Register EPIC-012 templates (NO schema changes!)
templateEngine.register('prd-template', prdTemplate);
templateEngine.register('srs-template', srsTemplate);
templateEngine.register('architecture-template', architectureTemplate);
// ... 10 more registrations
```

**Deprecation Logic** (optional):
```typescript
// Deprecate old STATUS.md in favor of 13-Project-Plan.md
await prisma.markdownFile.update({
  where: { projectId_slug: { projectId, slug: 'STATUS' } },
  data: { status: 'deprecated' }
});
```

**Total EPIC-012 Work**:
- ❌ Schema migration: 0 lines
- ✅ Template files: 13 files × ~400 lines = ~5.2K lines
- ✅ Data extractors: 13 functions × ~150 lines = ~2K lines
- ✅ Seed data: ~50 lines
- ✅ MCP tool wrapper: ~50 lines
- **Total: ~7.3K lines, ZERO schema changes**

**Proof of Zero Refactoring**:
- Schema unchanged since Sprint 2
- Template engine unchanged (just more registrations)
- Sync service unchanged (already supports any category)
- Git hooks unchanged (dynamic file list from database)
- MCP tools unchanged (already accept category parameter)

---

## Data Extractor Registry (Extensibility Layer)

**Problem**: Each template needs data from different database tables

**Solution**: Separate data extraction from template rendering

### Architecture Pattern

```typescript
// lib/markdown/extractors/registry.ts
export interface DataExtractor {
  extract(projectId: string): Promise<any>;
}

export const dataExtractorRegistry = {
  extractors: new Map<string, DataExtractor>(),

  register(templateId: string, extractor: DataExtractor) {
    this.extractors.set(templateId, extractor);
  },

  async extract(templateId: string, projectId: string): Promise<any> {
    const extractor = this.extractors.get(templateId);
    if (!extractor) throw new Error(`Data extractor not found: ${templateId}`);
    return extractor.extract(projectId);
  }
};
```

### Sprint 2 Extractors

**Status Template Extractor**:
```typescript
// lib/markdown/extractors/status-extractor.ts
export const statusExtractor: DataExtractor = {
  async extract(projectId: string) {
    const phases = await prisma.phase.findMany({
      where: { projectId }, // Future: Filter by project when multi-tenant
      include: {
        weeks: {
          include: {
            days: {
              include: {
                tasks: {
                  include: {
                    sessions: { include: { checkpoints: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    return {
      currentPhase: phases.find(p => p.status === 'IN_PROGRESS'),
      completedPhases: phases.filter(p => p.status === 'COMPLETED'),
      totalProgress: calculateOverallProgress(phases),
      activeTask: await getCurrentTask(),
      recentCheckpoints: await getRecentCheckpoints(10)
    };
  }
};

// Register extractor
dataExtractorRegistry.register('status-template', statusExtractor);
```

**Project Plan Template Extractor**:
```typescript
// lib/markdown/extractors/project-plan-extractor.ts
export const projectPlanExtractor: DataExtractor = {
  async extract(projectId: string) {
    const phases = await prisma.phase.findMany({
      where: { projectId },
      include: { weeks: { include: { days: true } } }
    });

    return {
      phases: phases.map(formatPhaseForTemplate),
      timeline: calculateProjectTimeline(phases),
      milestones: extractMilestones(phases),
      velocity: calculateSprintVelocity(phases)
    };
  }
};

dataExtractorRegistry.register('project-plan-template', projectPlanExtractor);
```

### EPIC-012 Extractors (13 New)

**PRD Template Extractor**:
```typescript
// lib/markdown/extractors/prd-extractor.ts
export const prdExtractor: DataExtractor = {
  async extract(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        issues: { where: { status: 'open' } },
        knowledgeItems: true
      }
    });

    return {
      projectName: project.name,
      description: project.description,
      features: extractFeaturesFromIssues(project.issues),
      userStories: extractUserStoriesFromHierarchy(),
      successCriteria: extractGoalsFromPhases()
    };
  }
};

dataExtractorRegistry.register('prd-template', prdExtractor);
```

**Architecture Template Extractor**:
```typescript
// lib/markdown/extractors/architecture-extractor.ts
export const architectureExtractor: DataExtractor = {
  async extract(projectId: string) {
    const models = await introspectPrismaSchema();
    const apiRoutes = await scanApiRoutes();
    const components = await scanReactComponents();

    return {
      techStack: extractTechStack(),
      databaseSchema: formatPrismaModels(models),
      apiEndpoints: formatApiRoutes(apiRoutes),
      componentHierarchy: buildComponentTree(components),
      mermaidDiagrams: generateArchitectureDiagrams()
    };
  }
};

dataExtractorRegistry.register('architecture-template', architectureExtractor);
```

**Backlog Template Extractor**:
```typescript
// lib/markdown/extractors/backlog-extractor.ts
export const backlogExtractor: DataExtractor = {
  async extract(projectId: string) {
    const hierarchy = await prisma.phase.findMany({
      include: {
        weeks: { include: { days: { include: { tasks: true } } } }
      }
    });

    const issues = await prisma.issue.findMany({
      where: { projectId },
      include: { labels: true }
    });

    return {
      epics: extractEpicsFromPhases(hierarchy),
      userStories: extractUserStoriesFromTasks(hierarchy),
      backlogIssues: formatIssuesAsBacklog(issues),
      prioritization: calculatePriority(issues),
      storyPoints: aggregateStoryPoints(hierarchy)
    };
  }
};

dataExtractorRegistry.register('backlog-template', backlogExtractor);
```

**Total EPIC-012 Extractors**: 13 extractors × ~150 lines = ~2K lines

---

## Sync Service Architecture (Path-Agnostic)

### Core Service Interface

```typescript
// lib/markdown/sync-service.ts
export class MarkdownSyncService {
  async syncFile(file: MarkdownFile): Promise<SyncResult> {
    // 1. Extract data using registered extractor
    const data = await dataExtractorRegistry.extract(file.templateId, file.projectId);

    // 2. Render template
    const content = await templateEngine.render(file.templateId, data);

    // 3. Check if content changed
    const newHash = generateContentHash(content);
    if (file.contentHash === newHash) {
      return { status: 'unchanged', file };
    }

    // 4. Write file to disk (supports ANY path)
    await this.writeFile(file.path, content);

    // 5. Update database record
    await prisma.markdownFile.update({
      where: { id: file.id },
      data: {
        contentHash: newHash,
        lastSyncedAt: new Date()
      }
    });

    return { status: 'updated', file };
  }

  async syncByCategory(projectId: string, category: string): Promise<SyncResult[]> {
    const files = await prisma.markdownFile.findMany({
      where: { projectId, category, status: 'active' }
    });

    return Promise.all(files.map(file => this.syncFile(file)));
  }

  async syncAuto(projectId: string): Promise<SyncResult[]> {
    // Triggered after task progress update, session complete, etc.
    const autoFiles = await prisma.markdownFile.findMany({
      where: { projectId, syncStrategy: 'auto', status: 'active' }
    });

    return Promise.all(autoFiles.map(file => this.syncFile(file)));
  }

  private async writeFile(path: string, content: string): Promise<void> {
    // Supports ANY path: root, docs/, .agent/, nested
    const fullPath = join(process.cwd(), path);
    const dir = dirname(fullPath);

    // Create directory if not exists
    await mkdir(dir, { recursive: true });

    // Write file
    await writeFile(fullPath, content, 'utf-8');
  }
}
```

**Why Path-Agnostic**: `writeFile()` accepts any path, automatically creates directories

**EPIC-012 Compatibility**: Zero changes required, already supports `docs/` and nested paths

---

## Git Hooks (Dynamic Validation)

### Problem: Hardcoded filenames break extensibility

**Bad Approach (❌ Rejected)**:
```bash
# .husky/pre-commit (HARDCODED - breaks in EPIC-012)
if git diff --cached --name-only | grep -q "STATUS.md\|DEVELOPMENT_PLAN.md"; then
  echo "Error: Manual edit of auto-generated files blocked"
  exit 1
fi
```

**Good Approach (✅ Chosen)**:
```bash
# .husky/pre-commit (DYNAMIC - works in EPIC-012)
# Read generated file list from database-backed JSON
GENERATED_FILES=$(cat .agent/generated-files.json | jq -r '.[]')

for FILE in $GENERATED_FILES; do
  if git diff --cached --name-only | grep -q "^$FILE$"; then
    echo "Error: Manual edit of auto-generated file blocked: $FILE"
    exit 1
  fi
done
```

### Dynamic File List Generation

```typescript
// lib/markdown/update-generated-files-list.ts
export async function updateGeneratedFilesList(projectId: string) {
  const generatedFiles = await prisma.markdownFile.findMany({
    where: { projectId, isGenerated: true, status: 'active' },
    select: { path: true }
  });

  const filePaths = generatedFiles.map(f => f.path);

  await writeFile(
    '.agent/generated-files.json',
    JSON.stringify(filePaths, null, 2),
    'utf-8'
  );
}
```

**When to Call**:
- After creating new MarkdownFile record
- After deprecating old MarkdownFile record
- After EPIC-012 seed data runs

**EPIC-012 Impact**:
- Sprint 2: `.agent/generated-files.json` contains 2 files
- EPIC-012: `.agent/generated-files.json` contains 13-15 files (if old files deprecated)
- Git hook unchanged (already reads dynamic list)

---

## MCP Tool Design

### Sprint 2 MCP Tool

```typescript
// apps/mcp-server/src/tools/syncMarkdown.ts
import { z } from 'zod';

const SyncMarkdownSchema = z.object({
  projectId: z.string().optional(),
  category: z.enum(['tracking', 'industry_doc', 'memory_bank', 'all']).optional(),
  force: z.boolean().optional() // Force regeneration even if content unchanged
});

export const syncMarkdownTool = {
  name: 'projectpulse.syncMarkdown',
  description: 'Regenerate markdown documentation files',
  inputSchema: zodToJsonSchema(SyncMarkdownSchema),

  async handler(input: z.infer<typeof SyncMarkdownSchema>) {
    const { projectId, category, force } = input;

    const syncService = new MarkdownSyncService();

    if (category === 'all' || !category) {
      // Sync all active files
      const results = await syncService.syncByCategory(projectId, 'all');
      return { success: true, filesUpdated: results.filter(r => r.status === 'updated').length };
    }

    // Sync specific category
    const results = await syncService.syncByCategory(projectId, category);
    return { success: true, filesUpdated: results.filter(r => r.status === 'updated').length };
  }
};
```

**Usage**:
```typescript
// Agent calls MCP tool
{
  "name": "projectpulse.syncMarkdown",
  "arguments": {
    "category": "tracking" // Syncs STATUS.md + DEVELOPMENT_PLAN.md only
  }
}
```

**EPIC-012 Compatibility**:
- Tool unchanged (category enum extended via Zod .or() union)
- Agent passes `"category": "industry_doc"` to sync 13 docs
- Tool supports `"category": "all"` to sync everything

---

## Testing Strategy

### Unit Tests

**Schema Validation Tests**:
```typescript
describe('MarkdownFile Schema', () => {
  it('prevents duplicate slugs per project', async () => {
    await prisma.markdownFile.create({
      data: { slug: 'STATUS', path: 'STATUS.md', ... }
    });

    await expect(
      prisma.markdownFile.create({
        data: { slug: 'STATUS', path: 'STATUS2.md', ... }
      })
    ).rejects.toThrow('Unique constraint violation');
  });

  it('allows same slug in different projects', async () => {
    await prisma.markdownFile.create({
      data: { projectId: 'proj1', slug: 'STATUS', ... }
    });

    await expect(
      prisma.markdownFile.create({
        data: { projectId: 'proj2', slug: 'STATUS', ... }
      })
    ).resolves.toBeDefined();
  });

  it('supports any file path', async () => {
    const paths = [
      'STATUS.md',
      'docs/01-PRD.md',
      '.agent/progress.md',
      'docs/06-API/openapi.yaml',
      'nested/deep/dir/file.md'
    ];

    for (const path of paths) {
      await expect(
        prisma.markdownFile.create({
          data: { slug: path, path, ... }
        })
      ).resolves.toBeDefined();
    }
  });
});
```

**Template Registration Tests**:
```typescript
describe('Template Engine', () => {
  it('registers templates dynamically', () => {
    const mockTemplate = (data: any) => `Title: ${data.title}`;
    templateEngine.register('test-template', mockTemplate);

    expect(templateEngine.templates.has('test-template')).toBe(true);
  });

  it('renders registered template', () => {
    const result = templateEngine.render('test-template', { title: 'Test' });
    expect(result).toBe('Title: Test');
  });

  it('throws error for unregistered template', () => {
    expect(() =>
      templateEngine.render('nonexistent', {})
    ).toThrow('Template not found: nonexistent');
  });
});
```

**Sync Service Tests**:
```typescript
describe('MarkdownSyncService', () => {
  it('writes file to any directory', async () => {
    const service = new MarkdownSyncService();
    await service.syncFile({
      path: 'test/nested/file.md',
      templateId: 'test-template',
      ...
    });

    expect(await fileExists('test/nested/file.md')).toBe(true);
  });

  it('skips regeneration if content unchanged', async () => {
    const file = await createTestFile({ contentHash: 'abc123' });
    const result = await service.syncFile(file);

    expect(result.status).toBe('unchanged');
  });

  it('updates contentHash after regeneration', async () => {
    const file = await createTestFile({ contentHash: 'old-hash' });
    await service.syncFile(file);

    const updated = await prisma.markdownFile.findUnique({ where: { id: file.id } });
    expect(updated.contentHash).not.toBe('old-hash');
  });
});
```

### Integration Tests (EPIC-012 Proof)

**Extensibility Test**:
```typescript
describe('EPIC-012 Extensibility', () => {
  it('adds 13 documents without schema migration', async () => {
    // Sprint 2 state: 2 documents
    const sprint2Count = await prisma.markdownFile.count();
    expect(sprint2Count).toBe(2);

    // EPIC-012: Add 13 documents (NO schema migration!)
    const industryDocs = [...]; // 13 documents
    await prisma.markdownFile.createMany({ data: industryDocs });

    // Verify 15 total documents
    const epic12Count = await prisma.markdownFile.count();
    expect(epic12Count).toBe(15);

    // Verify schema unchanged
    expect(await getSchemaVersion()).toBe('20251110_add_markdown_files');
  });

  it('syncs only industry_doc category', async () => {
    const service = new MarkdownSyncService();
    const results = await service.syncByCategory(projectId, 'industry_doc');

    expect(results.length).toBe(13);
    expect(results.every(r => r.file.category === 'industry_doc')).toBe(true);
  });

  it('deprecates old files without breaking sync', async () => {
    await prisma.markdownFile.update({
      where: { slug: 'STATUS' },
      data: { status: 'deprecated' }
    });

    const activeFiles = await prisma.markdownFile.findMany({
      where: { status: 'active' }
    });

    expect(activeFiles.find(f => f.slug === 'STATUS')).toBeUndefined();
    expect(activeFiles.find(f => f.slug === '13-PROJECT-PLAN')).toBeDefined();
  });
});
```

---

## Performance Considerations

### Sync Performance

**Target**: <500ms per file regeneration (Sprint 2 requirement)

**Optimization Strategies**:

1. **Content Hash Early Exit**
   ```typescript
   if (file.contentHash === newHash) {
     return { status: 'unchanged' }; // Skip file write
   }
   ```
   **Savings**: ~50-100ms per unchanged file (no disk I/O)

2. **Parallel Sync for Multiple Files**
   ```typescript
   const files = await prisma.markdownFile.findMany({ where: { category: 'tracking' } });
   return Promise.all(files.map(file => this.syncFile(file))); // Parallel
   ```
   **Savings**: 2 files in ~600ms instead of 1s sequential

3. **Database Query Optimization**
   - Use `select` to load only needed fields
   - Leverage composite indexes for category + status filtering
   - Batch operations when possible

4. **Template Caching**
   - Cache compiled Handlebars templates in memory
   - Reuse template instances across multiple sync operations
   - Clear cache on server restart (not on every sync)

**EPIC-012 Impact**:
- Syncing 13 industry docs: ~6-7 seconds (parallel)
- curated strategy means manual trigger only (not after every task update)
- Acceptable performance for batch documentation generation

---

### Index Usage Verification

**Query Plan Analysis** (PostgreSQL EXPLAIN):
```sql
-- Verify composite index used
EXPLAIN ANALYZE
SELECT * FROM markdown_files
WHERE project_id = 'proj1' AND category = 'tracking';
-- Expected: Index Scan using markdown_files_project_category

-- Verify unique constraint index used
EXPLAIN ANALYZE
SELECT * FROM markdown_files
WHERE project_id = 'proj1' AND slug = 'STATUS';
-- Expected: Index Scan using markdown_files_project_slug_key
```

**Monitoring**:
- Add performance logging to sync service
- Track sync duration per file
- Alert if any file exceeds 1s regeneration time

---

## Data Integrity

### Constraints

1. **Unique Slug Per Project** - Enforced via `@@unique([projectId, slug])`
2. **Required Fields** - All string fields non-nullable except contentHash, lastSyncedAt, metadata
3. **Foreign Key Cascade** - Delete project → delete all markdown files
4. **Content Hash Length** - Fixed 64 chars (SHA-256 hex)

### Validation Layer (Zod)

```typescript
// lib/markdown/validation.ts
export const MarkdownFileCreateSchema = z.object({
  projectId: z.string().cuid(),
  slug: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-_]+$/),
  path: z.string().min(1).max(500),
  category: z.enum(['tracking', 'industry_doc', 'memory_bank', 'custom']),
  syncStrategy: z.enum(['auto', 'curated', 'manual']),
  templateId: z.string().min(1).max(100),
  contentHash: z.string().length(64).regex(/^[a-f0-9]{64}$/).optional(),
  isGenerated: z.boolean().default(true),
  status: z.enum(['active', 'deprecated', 'archived']).default('active'),
  metadata: z.record(z.any()).optional()
});

export const MarkdownFileUpdateSchema = MarkdownFileCreateSchema.partial();
```

**API Route Validation**:
```typescript
// POST /api/markdown-files
export async function POST(req: Request) {
  const body = await req.json();
  const validated = MarkdownFileCreateSchema.parse(body); // Throws if invalid

  const file = await prisma.markdownFile.create({ data: validated });
  return NextResponse.json({ data: file });
}
```

---

## Next Steps for Parent Agent

### Sprint 2 Week 3 Days 1-2 (Implementation)

**Step 1: Schema Migration**
```bash
# Create migration from schema.prisma
npx prisma migrate dev --name add_markdown_files

# Verify migration applied
npx prisma migrate status
```

**Step 2: Seed Data**
```typescript
// Add to prisma/seed.ts
await prisma.markdownFile.createMany({
  data: [
    { slug: 'STATUS', path: 'STATUS.md', category: 'tracking', syncStrategy: 'auto', templateId: 'status-template' },
    { slug: 'DEVELOPMENT_PLAN', path: 'DEVELOPMENT_PLAN.md', category: 'tracking', syncStrategy: 'auto', templateId: 'project-plan-template' }
  ]
});

# Run seed
npx prisma db seed
```

**Step 3: Template System**
```bash
# Create files
mkdir -p lib/markdown/templates
touch lib/markdown/templates/registry.ts
touch lib/markdown/templates/status-template.ts
touch lib/markdown/templates/project-plan-template.ts
```

**Step 4: Data Extractors**
```bash
mkdir -p lib/markdown/extractors
touch lib/markdown/extractors/registry.ts
touch lib/markdown/extractors/status-extractor.ts
touch lib/markdown/extractors/project-plan-extractor.ts
```

**Step 5: Sync Service**
```bash
touch lib/markdown/sync-service.ts
```

**Step 6: MCP Tool**
```bash
touch apps/mcp-server/src/tools/syncMarkdown.ts
```

**Step 7: Git Hooks**
```bash
# Install husky
pnpm add -D husky

# Initialize hooks
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "node scripts/check-generated-files.js"

# Create script
touch scripts/check-generated-files.js
```

**Step 8: Update Generated Files List**
```bash
node -e "require('./lib/markdown/update-generated-files-list').updateGeneratedFilesList('default-project-id')"
```

**Step 9: Integration Testing**
```bash
# Create test files
touch lib/markdown/__tests__/schema.test.ts
touch lib/markdown/__tests__/sync-service.test.ts
touch lib/markdown/__tests__/extensibility.test.ts

# Run tests
pnpm test
```

---

## Summary

This Prisma schema design achieves all Sprint 2 + EPIC-012 requirements:

✅ **Supports 2 docs in Sprint 2** (STATUS.md, DEVELOPMENT_PLAN.md)
✅ **Supports 13+ docs in EPIC-012** WITHOUT schema migration (plugin-based architecture)
✅ **Supports ANY file path** (root, docs/, .agent/, nested directories)
✅ **Filtering by category** (MCP tool: sync only 'tracking' docs)
✅ **Prevents duplicate slugs** per project (unique constraint)
✅ **Tracks sync status** (contentHash, lastSyncedAt)
✅ **Performance optimized** (5 indexes, <500ms target)
✅ **Future-proof** (JSONB metadata, string types instead of enums)
✅ **Git hooks dynamic** (no hardcoded filenames)

**Zero-Refactoring Proof**:
- EPIC-012 adds **13 template files** (~5.2K lines)
- EPIC-012 adds **13 data extractors** (~2K lines)
- EPIC-012 adds **0 schema changes**
- EPIC-012 adds **0 sync service changes**
- EPIC-012 adds **0 MCP tool changes**
- **Total: ~7.3K lines, zero refactoring**

**Net Savings**: 45 story points (original refactoring estimate) reduced to 0 points

---

## Appendix: Complete Schema (Copy-Paste Ready)

```prisma
// Add to apps/web/prisma/schema.prisma

model MarkdownFile {
  id            String   @id @default(cuid())
  projectId     Int      // FK to Project.id (existing model uses Int)

  // Document Identification
  slug          String
  path          String

  // Categorization
  category      String

  // Sync Strategy
  syncStrategy  String

  // Template System
  templateId    String

  // Content Tracking
  contentHash   String?  @db.Char(64)
  lastSyncedAt  DateTime?

  // Metadata
  isGenerated   Boolean  @default(true)
  status        String   @default("active")
  metadata      Json?    @db.JsonB

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relationships
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Indexes
  @@unique([projectId, slug])
  @@index([projectId, category])
  @@index([projectId, status])
  @@index([projectId, syncStrategy])
  @@index([lastSyncedAt])

  @@map("markdown_files")
}

// Update existing Project model
model Project {
  // ... existing fields ...
  markdownFiles MarkdownFile[]
}
```

**Migration Command**:
```bash
npx prisma migrate dev --name add_markdown_files
```

---

**End of Design Plan**

**Report Location**: `.agent/task/prisma-markdown-schema-20251109-1900.md`

**Parent Agent Action**: Read this report and implement schema in Sprint 2 Week 3 Days 1-2

**Key Recommendation**: Implement generic architecture now (Sprint 2) to save 45 story points in EPIC-012 (Sprint 10)
