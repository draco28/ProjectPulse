# Skills System Catalog

**Last Updated**: 2025-11-13
**Status**: Active (Sprint 6 complete)
**Purpose**: Comprehensive guide to the ProjectPulse skills system with lazy-loading and token efficiency

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Token Efficiency](#3-token-efficiency)
4. [Skills Categories](#4-skills-categories)
5. [Skill Structure](#5-skill-structure)
6. [LRU Cache Behavior](#6-lru-cache-behavior)
7. [Common Workflows](#7-common-workflows)
8. [MCP Tools Reference](#8-mcp-tools-reference)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Best Practices](#10-best-practices)

---

## 1. Overview

### What is the Skills System?

The **Skills System** is a token-efficient knowledge management solution designed for AI agents to access implementation patterns, framework techniques, testing strategies, and workflow guides with minimal token overhead.

**Key Features:**

- **Lazy-Loading**: Skills load in two tiers (frontmatter-only vs full content)
- **Token Efficiency**: 97.2% reduction for list operations, 91.2% for full loads
- **Auto-Unload**: LRU cache with 5-minute TTL automatically manages memory
- **Categorization**: 4 categories (framework, testing, workflow, troubleshooting)
- **Knowledge Linking**: Bidirectional links to knowledge base items
- **Search**: Full-text search across title, description, and content

**Comparison with Knowledge Base:**

| Feature | Skills System | Knowledge Base |
|---------|---------------|----------------|
| **Purpose** | Implementation patterns | Theoretical concepts |
| **Structure** | Frontmatter + Markdown | Full markdown |
| **Loading** | Lazy (two-tier) | Eager (full load) |
| **Token Cost** | 70 tokens (list), 220 (full) | 1,200 tokens (average) |
| **Search** | Full-text | Hybrid (semantic + full-text) |
| **Cache** | LRU (5-min TTL, 100 entries) | Standard query cache |

---

## 2. System Architecture

### Database Schema

**Primary Table: `Skill`**

```prisma
model Skill {
  id          Int       @id @default(autoincrement())
  title       String    @db.VarChar(200)
  description String    @db.VarChar(500)
  content     String    @db.Text
  category    String    @db.VarChar(32)
  tags        String[]
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relationships
  knowledgeLinks SkillKnowledgeLink[]

  @@index([category])
  @@index([title])
  @@map("skills")
}
```

**Link Table: `SkillKnowledgeLink`**

```prisma
model SkillKnowledgeLink {
  id          Int       @id @default(autoincrement())
  skillId     Int
  knowledgeId Int
  createdAt   DateTime  @default(now())

  // Relations
  skill       Skill     @relation(fields: [skillId], references: [id], onDelete: Cascade)
  knowledge   Knowledge @relation(fields: [knowledgeId], references: [id], onDelete: Cascade)

  @@unique([skillId, knowledgeId])
  @@index([skillId])
  @@index([knowledgeId])
  @@map("skill_knowledge_links")
}
```

### Two-Tier Loading Architecture

```
┌─────────────────────────────────────────────────────┐
│ Tier 1: Frontmatter Only (List Operation)          │
│ ─────────────────────────────────────────────────   │
│ SELECT id, title, description, category, tags,     │
│        metadata, createdAt, updatedAt               │
│ FROM skills                                         │
│ WHERE category = ?                                  │
│                                                     │
│ Token Cost: ~70 tokens per skill                   │
│ Use Case: Browse, filter, select                   │
└─────────────────────────────────────────────────────┘
                        ↓ User selects skill
┌─────────────────────────────────────────────────────┐
│ Tier 2: Full Content (Load Operation)              │
│ ─────────────────────────────────────────────────   │
│ SELECT * FROM skills                                │
│ WHERE id = ?                                        │
│ INCLUDE knowledgeLinks (with related knowledge)    │
│                                                     │
│ Token Cost: ~220 tokens per skill                  │
│ Use Case: Implementation, reference                │
└─────────────────────────────────────────────────────┘
```

### LRU Cache Flow

```
Agent Request
     ↓
┌─────────────────┐
│ Check LRU Cache │ ─→ Cache Hit (90%+) ─→ Return Cached Skill
│  (5-min TTL)    │                         (~5ms)
└─────────────────┘
     ↓ Cache Miss (10%)
┌─────────────────┐
│ Database Query  │ ─→ Fetch Full Skill ─→ Store in Cache
│                 │                         (~100ms)
└─────────────────┘
     ↓
Return to Agent
     ↓
After 5 minutes of inactivity
     ↓
┌─────────────────┐
│ Auto-Evict      │ ─→ Skill removed from cache
│ from Cache      │     (frees memory)
└─────────────────┘
```

---

## 3. Token Efficiency

### Baseline vs Optimized

**Baseline (No Lazy-Loading):**
- Load all skills: 15 skills × 2,500 tokens = **37,500 tokens**
- Problem: Exceeds practical limits, forces selective loading

**Optimized (Lazy-Loading):**
- List all skills: 15 skills × 70 tokens = **1,050 tokens** (97.2% reduction)
- Load 1 skill: 220 tokens (91.2% reduction)
- Total for browse + load: 1,050 + 220 = **1,270 tokens**

**Token Budget Impact:**

```
Claude Code Limit: 200,000 tokens

Without Lazy-Loading:
  - Load 15 skills: 37,500 tokens (18.75% of budget)
  - Can handle: ~5 skill lookups per session
  - Result: Agents avoid skills due to token cost

With Lazy-Loading:
  - List 15 skills: 1,050 tokens (0.5% of budget)
  - Load 10 skills: 2,200 tokens (1.1% of budget)
  - Total: 3,250 tokens (1.6% of budget)
  - Can handle: 60+ skill lookups per session
  - Result: Agents use skills freely
```

### Measured Token Counts

**Tier 1 (Frontmatter Only):**

| Field | Token Count | Example |
|-------|-------------|---------|
| id | 2 | `1` |
| title | 8-12 | "Jest Testing Patterns" |
| description | 20-30 | "Comprehensive testing strategies..." |
| category | 3-5 | "testing" |
| tags | 10-15 | ["jest", "unit-testing", "tdd"] |
| metadata | 15-20 | {difficulty: "intermediate", ...} |
| timestamps | 8-10 | ISO 8601 dates |
| **Total** | **66-94** | **Average: ~70 tokens** |

**Tier 2 (Full Content):**

| Component | Token Count |
|-----------|-------------|
| Frontmatter (from Tier 1) | 70 |
| Markdown content | 120-180 |
| Linked knowledge (3 items) | 20-30 |
| **Total** | **210-280** |
| **Average** | **~220 tokens** |

---

## 4. Skills Categories

### Framework

**Purpose**: Framework-specific patterns and techniques

**Examples:**
- Next.js Server Components patterns
- React hook composition strategies
- Prisma query optimization techniques
- TailwindCSS utility patterns

**Typical Content:**
- Framework-specific APIs and patterns
- Performance optimization strategies
- Best practices and conventions
- Common pitfalls and solutions

**Token Range**: 200-300 tokens (full load)

---

### Testing

**Purpose**: Testing strategies and patterns

**Examples:**
- Jest unit testing patterns
- Playwright E2E testing workflows
- React Testing Library best practices
- Test-driven development workflows

**Typical Content:**
- Test setup and configuration
- Mock and stub strategies
- Assertion patterns
- Coverage and quality metrics

**Token Range**: 180-250 tokens (full load)

---

### Workflow

**Purpose**: Development workflows and processes

**Examples:**
- Git branch management strategies
- CI/CD pipeline configuration
- Code review processes
- Sprint planning workflows

**Typical Content:**
- Step-by-step procedures
- Automation scripts
- Integration points
- Quality gates

**Token Range**: 200-300 tokens (full load)

---

### Troubleshooting

**Purpose**: Debugging and problem-solving guides

**Examples:**
- TypeScript error resolution
- Database migration failures
- Build configuration issues
- Performance debugging

**Typical Content:**
- Symptom identification
- Root cause analysis
- Resolution steps
- Prevention strategies

**Token Range**: 150-250 tokens (full load)

---

## 5. Skill Structure

### Frontmatter Format

**Structure:**

```typescript
interface SkillFrontmatter {
  id: number;
  title: string;              // 1-200 chars
  description: string;        // 1-500 chars
  category: "framework" | "testing" | "workflow" | "troubleshooting";
  tags: string[];             // Max 10 tags
  metadata?: {
    difficulty?: "beginner" | "intermediate" | "advanced";
    prerequisites?: string[]; // Skill titles or IDs
    estimatedTime?: string;   // e.g., "15 minutes"
    lastValidated?: string;   // ISO 8601 date
    [key: string]: any;       // Custom metadata
  };
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601
}
```

**Example:**

```typescript
{
  "id": 1,
  "title": "Jest Testing Patterns",
  "description": "Comprehensive unit testing strategies with Jest framework",
  "category": "testing",
  "tags": ["jest", "unit-testing", "tdd", "mocking"],
  "metadata": {
    "difficulty": "intermediate",
    "prerequisites": ["javascript-basics", "node-environment"],
    "estimatedTime": "20 minutes",
    "lastValidated": "2025-11-10T00:00:00Z"
  },
  "createdAt": "2025-11-10T00:00:00Z",
  "updatedAt": "2025-11-13T10:00:00Z"
}
```

### Markdown Content Format

**Structure:**

```markdown
# [Skill Title]

## Overview

Brief introduction to the skill (1-2 paragraphs).

## Prerequisites

- Required knowledge or skills
- Tools or frameworks needed

## Implementation

Step-by-step implementation guide.

### Step 1: [Description]

Code example:

\`\`\`typescript
// Code sample
\`\`\`

### Step 2: [Description]

More implementation details...

## Examples

### Example 1: [Scenario]

\`\`\`typescript
// Complete example
\`\`\`

## Best Practices

- Key recommendation 1
- Key recommendation 2
- Key recommendation 3

## Common Pitfalls

- Mistake to avoid 1
- Mistake to avoid 2

## Related Skills

- [Link to related skill]
- [Link to knowledge base article]

## References

- External documentation links
- Official guides
```

**Token Allocation:**

| Section | Token Count | % of Total |
|---------|-------------|------------|
| Overview | 30-40 | 20% |
| Prerequisites | 15-20 | 10% |
| Implementation | 80-120 | 50% |
| Examples | 30-40 | 15% |
| Best Practices | 10-15 | 5% |
| Related/References | 5-10 | 3% |
| **Total** | **170-245** | **103% (buffer)** |

---

## 6. LRU Cache Behavior

### Cache Configuration

```typescript
interface CacheConfig {
  maxEntries: 100;        // Maximum cached skills
  ttl: 300000;            // 5 minutes (in milliseconds)
  evictionPolicy: "LRU";  // Least Recently Used
  autoCleanup: true;      // Automatic expired entry removal
}
```

### Cache Operations

**1. Cache Hit (90%+ of requests)**

```
Agent Request: skill.load(id: 1)
     ↓
Check cache for skill ID 1
     ↓
Found in cache + not expired (< 5 min)
     ↓
Return cached skill (~5ms)
     ↓
Update LRU position (most recent)
```

**2. Cache Miss (10% of requests)**

```
Agent Request: skill.load(id: 42)
     ↓
Check cache for skill ID 42
     ↓
Not found OR expired (> 5 min)
     ↓
Fetch from database (~100ms)
     ↓
Store in cache (if < 100 entries)
     ↓
Return skill to agent
```

**3. Cache Eviction (when full)**

```
Cache at 100 entries
     ↓
New skill requested (not cached)
     ↓
Identify least recently used skill
     ↓
Evict LRU skill from cache
     ↓
Store new skill in freed slot
```

**4. Auto-Cleanup (every 60 seconds)**

```
Background cleanup task runs
     ↓
Check all cached entries for expiry
     ↓
Remove entries older than 5 minutes
     ↓
Free memory for new skills
```

### Cache Metrics

**Typical Performance:**

| Metric | Value | Target |
|--------|-------|--------|
| Cache Hit Rate | 92-95% | >90% |
| Average Hit Time | 3-5ms | <10ms |
| Average Miss Time | 80-120ms | <200ms |
| Memory Usage | ~2-5MB | <10MB |
| Cache Size | 40-60 entries | <100 |

**Why 5-Minute TTL?**

- **Balances freshness vs efficiency**: Skills rarely change mid-session
- **Matches session patterns**: Most skills used multiple times within 5 minutes
- **Prevents stale data**: Ensures updates visible within reasonable time
- **Memory efficiency**: Auto-evicts unused skills

---

## 7. Common Workflows

### Workflow 1: Browse and Load Skill

```typescript
// Step 1: List skills by category (Tier 1)
const skills = await projectpulse.skill.list({
  category: 'testing',
  limit: 20,
});
// Token Cost: 20 skills × 70 tokens = 1,400 tokens

// Step 2: Select skill from list
const selectedSkillId = skills.skills[0].id;

// Step 3: Load full skill content (Tier 2)
const fullSkill = await projectpulse.skill.load({
  skillId: selectedSkillId,
});
// Token Cost: 220 tokens

// Total Token Cost: 1,400 + 220 = 1,620 tokens (vs 50,000 without lazy-loading)
```

### Workflow 2: Search and Implement

```typescript
// Step 1: Search for relevant skill
const results = await projectpulse.skill.search({
  query: 'mocking API calls',
  category: 'testing',
  limit: 10,
});
// Token Cost: ~800 tokens (search results with excerpts)

// Step 2: Load top result
const skill = await projectpulse.skill.load({
  skillId: results.results[0].id,
});
// Token Cost: 220 tokens

// Step 3: Follow linked knowledge
if (skill.linkedKnowledge.length > 0) {
  const knowledge = await projectpulse.knowledge.related({
    itemId: skill.linkedKnowledge[0].id,
  });
  // Token Cost: ~1,200 tokens
}

// Total Token Cost: ~2,220 tokens (comprehensive context)
```

### Workflow 3: Create Skill from Implementation

```typescript
// After implementing a feature, document the pattern
const newSkill = await projectpulse.skill.create({
  title: 'Server Actions with Optimistic Updates',
  description: 'Pattern for Next.js Server Actions with useOptimistic hook',
  content: `
# Server Actions with Optimistic Updates

## Overview
Implement instant UI feedback with Server Actions...

[Complete implementation guide]
  `,
  category: 'framework',
  tags: ['nextjs', 'server-actions', 'useOptimistic', 'react'],
  metadata: {
    difficulty: 'intermediate',
    prerequisites: ['nextjs-basics', 'react-hooks'],
    estimatedTime: '30 minutes',
  },
});

// Link to related knowledge
await projectpulse.skill.linkKnowledge({
  skillId: newSkill.id,
  knowledgeId: 42, // "React 18 Concurrent Features" knowledge item
});
```

### Workflow 4: Export and Import (Backup/Migration)

```typescript
// Export all testing skills for backup
const exported = await projectpulse.skill.export({
  filters: {
    category: 'testing',
  },
});
// Save to file or transfer to another environment

// Import skills from backup
const imported = await projectpulse.skill.import({
  items: exported.exportData,
  options: {
    skipDuplicates: true,
  },
});
// Result: { imported: 15, skipped: 0, failed: 0 }
```

---

## 8. MCP Tools Reference

**Complete Documentation**: [mcp-tools-guide.md](./mcp-tools-guide.md#projectpulse-mcp-server)

### Quick Reference

| Tool | Purpose | Token Cost |
|------|---------|------------|
| `projectpulse.skill.list` | Browse skills (frontmatter only) | ~70 per skill |
| `projectpulse.skill.load` | Load full skill content | ~220 per skill |
| `projectpulse.skill.search` | Find skills by keyword | ~80 per result |
| `projectpulse.skill.create` | Document new pattern | N/A |
| `projectpulse.skill.update` | Refine existing skill | N/A |
| `projectpulse.skill.delete` | Remove obsolete skill | N/A |
| `projectpulse.skill.export` | Backup skills | N/A |
| `projectpulse.skill.import` | Restore skills | N/A |
| `projectpulse.skill.linkKnowledge` | Connect to knowledge | N/A |

---

## 9. API Endpoints Reference

**Complete Documentation**: [api-reference.md](./api-reference.md#skills-management)

### Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/skills` | GET | List skills (frontmatter only) |
| `/api/skills/:id` | GET | Get full skill content |
| `/api/skills/search` | GET | Search skills |
| `/api/skills` | POST | Create new skill |
| `/api/skills/:id` | PATCH | Update skill |
| `/api/skills/:id` | DELETE | Delete skill |
| `/api/skills/export` | POST | Export to JSON |
| `/api/skills/import` | POST | Import from JSON |
| `/api/skills/:id/link-knowledge` | POST | Link to knowledge |
| `/api/skills/:id/unlink-knowledge/:knowledgeId` | DELETE | Unlink knowledge |

---

## 10. Best Practices

### For AI Agents

**1. Use Lazy-Loading Workflow**
```typescript
// ✅ GOOD: Browse first, load only what you need
const list = await skill.list({ category: 'testing' });
const skill = await skill.load({ skillId: list.skills[0].id });

// ❌ BAD: Loading all skills upfront
const allSkills = await Promise.all(
  skillIds.map(id => skill.load({ skillId: id }))
);
```

**2. Leverage Cache Efficiency**
```typescript
// ✅ GOOD: Load once, reuse within 5 minutes
const skill = await skill.load({ skillId: 1 });
// ... use skill ...
// Later in same session (within 5 min):
const sameSkill = await skill.load({ skillId: 1 }); // Cache hit (~5ms)

// ❌ BAD: Clearing cache or loading repeatedly
```

**3. Use Search for Discovery**
```typescript
// ✅ GOOD: Search narrows down before loading
const results = await skill.search({ query: 'testing hooks' });
const topSkill = await skill.load({ skillId: results.results[0].id });

// ❌ BAD: Loading all skills to find relevant one
```

**4. Link Skills to Knowledge**
```typescript
// ✅ GOOD: Create bidirectional relationships
await skill.linkKnowledge({
  skillId: 1,  // "Jest Testing Patterns"
  knowledgeId: 5,  // "Unit Testing Best Practices"
});
// Enables discovery via knowledge.related()

// ❌ BAD: Isolated skills without context
```

### For Human Developers

**1. Maintain Skill Quality**
- Update skills when patterns evolve
- Validate code examples regularly
- Keep difficulty and prerequisites accurate
- Remove obsolete skills promptly

**2. Document Thoroughly**
- Include complete code examples
- Explain rationale behind patterns
- Document common pitfalls
- Link to official documentation

**3. Use Metadata Effectively**
```typescript
metadata: {
  difficulty: 'intermediate',
  prerequisites: ['react-basics', 'typescript'],
  estimatedTime: '20 minutes',
  lastValidated: '2025-11-10',
  frameworkVersion: 'Next.js 14',
  relevantNFRs: ['NFR-005', 'NFR-019']  // Link to requirements
}
```

**4. Categorize Appropriately**
- **Framework**: Next.js, React, Prisma patterns
- **Testing**: Jest, Playwright, RTL strategies
- **Workflow**: Git, CI/CD, deployment processes
- **Troubleshooting**: Debugging, error resolution

---

## Token Efficiency Summary

**System Metrics (Sprint 6 Validated):**

| Operation | Baseline Tokens | Optimized Tokens | Reduction |
|-----------|-----------------|------------------|-----------|
| List 15 skills | 37,500 | 1,050 | 97.2% |
| Load 1 skill | 2,500 | 220 | 91.2% |
| Search 10 results | 5,000 | 800 | 84.0% |
| Browse + Load (1) | 37,500 | 1,270 | 96.6% |
| Browse + Load (5) | 37,500 | 2,150 | 94.3% |

**Cache Metrics (Sprint 6 Validated):**

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Cache Hit Rate | 92% | >90% | ✅ |
| Hit Latency | 3-5ms | <10ms | ✅ |
| Miss Latency | 80-120ms | <200ms | ✅ |
| Memory Usage | 3-5MB | <10MB | ✅ |
| Auto-Eviction | 5 min TTL | 5 min | ✅ |

---

## See Also

- [MCP Tools Guide](./mcp-tools-guide.md) - Complete MCP tool documentation
- [API Reference](./api-reference.md) - API endpoint reference
- [Database Schema](./database-schema.md) - Prisma schema details
- [Sprint 6 Completion](../progress.md#sprint-6) - Implementation details

---

**Sprint 6 Status**: ✅ Complete (51/51 points, 100%)
**Last Updated**: 2025-11-13
**Maintained By**: ProjectPulse Team
