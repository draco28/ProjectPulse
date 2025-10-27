# Memory MCP Usage Strategy

**Purpose**: Define when and how to use Memory MCP for strategic knowledge capture vs file-based persistence.

**Last Updated**: 2025-10-27

---

## 🎯 Core Principle

**Memory MCP is for KNOWLEDGE, not PROGRESS**

- ❌ **NOT for**: Task progress, current work, session state
- ✅ **YES for**: Decisions, patterns, architectural insights, lessons learned

**Why?**

- Memory MCP: ~1000 tokens per operation
- File operations: ~100-200 tokens per operation
- Files are 10x cheaper AND human-readable

---

## 🆚 File-Based vs Memory MCP

### Use Files For (Tier 1 & 2: Real-time + Checkpoints)

**Task Progress** → `.agent/task/current-todos.md`

```markdown
## 🔄 In Progress

- [ ] **Implement POST /api/issues** (started 14:30)
```

**Session Context** → `.agent/task/current-session-[timestamp].md`

```markdown
## Progress This Session

- ✅ 14:30 - Created Prisma schema for issues
- ✅ 14:45 - Implemented API endpoint
- 🔄 15:00 - IN PROGRESS: Writing tests
```

**Checkpoint Updates** → `STATUS.md`

```markdown
**Last Task Completed**: POST /api/issues endpoint (2025-10-27)
**Last Checkpoint**: 2025-10-27
```

**Token Cost**: ~100-200 tokens per update
**Recovery Time**: Immediate (read files)
**Human Readable**: Yes

### Use Memory MCP For (Tier 3: Strategic Knowledge)

**Architectural Decisions**

```
Entity: Issue Management System
Observation: Chose Server Actions over API routes for forms
Reasoning: Progressive enhancement, better type safety
Date: 2025-10-27
```

**Design Patterns Established**

```
Entity: API Error Handling Pattern
Observation: All API routes return {data, error} format
Pattern: Zod validation → Prisma query → error handling → response
Date: 2025-10-27
```

**Lessons Learned**

```
Entity: Port Configuration Issue
Observation: Turbopack ignores next.config.js port setting
Solution: Must pass --port flag to next dev command
Prevention: Document in SOP, update package.json scripts
Date: 2025-10-26
```

**Token Cost**: ~1000 tokens per operation
**Recovery Time**: Query + search (~500 tokens)
**Human Readable**: Via query only

---

## 📊 Decision Matrix

| Need                 | Duration      | Frequency               | Use                            |
| -------------------- | ------------- | ----------------------- | ------------------------------ |
| Track current task   | Session-level | Every 15-30 min         | **Files** (.agent/task/)       |
| Session progress     | Session-level | Per major step          | **Files** (current-session.md) |
| Phase checkpoints    | Phase-level   | Per phase               | **Files** (STATUS.md)          |
| Design decisions     | Project-level | Per major decision      | **Memory MCP**                 |
| Patterns established | Project-level | When pattern emerges    | **Memory MCP**                 |
| Lessons learned      | Project-level | When gotcha discovered  | **Memory MCP**                 |
| Team knowledge       | Project-level | When knowledge reusable | **Memory MCP**                 |

---

## 🔍 When to Use Memory MCP

### Phase Completion

**After completing a major phase**, capture strategic knowledge:

```typescript
// Example: After completing Issue Management API

mcp__memory__create_entities({
  entities: [
    {
      name: 'Issue Management API Pattern',
      entityType: 'design-pattern',
      observations: [
        'Used Zod for validation with inferred types',
        'Implemented optimistic locking with updatedAt checks',
        'Chose cursor-based pagination for scalability',
        'Added full-text search with PostgreSQL tsvector',
      ],
    },
  ],
});

mcp__memory__create_relations({
  relations: [
    {
      from: 'Issue Management API Pattern',
      to: 'API Standards',
      relationType: 'follows',
    },
    {
      from: 'Issue Management API Pattern',
      to: 'Next.js App Router',
      relationType: 'implements-in',
    },
  ],
});
```

**When**: After phase complete, before moving to next phase
**Frequency**: 1-2 times per phase (major phases)
**Token Cost**: ~1000 tokens

### Architectural Decisions

**When a significant architectural decision is made**:

```typescript
// Example: Decided to use Server Actions vs API Routes

mcp__memory__create_entities({
  entities: [
    {
      name: 'Form Handling Architecture Decision',
      entityType: 'architectural-decision',
      observations: [
        'Decision: Use Server Actions for form mutations, API routes for external access',
        'Reasoning: Server Actions provide progressive enhancement',
        'Reasoning: API routes needed for MCP server integration',
        'Trade-off: Dual implementation required for some operations',
        'Date: 2025-10-27',
      ],
    },
  ],
});
```

**When**: Major technical decision made
**Frequency**: 2-5 times per phase
**Token Cost**: ~1000 tokens

### Recurring Issues Fixed

**When you fix an issue that keeps coming up**:

```typescript
// Example: Port configuration fix

mcp__memory__create_entities({
  entities: [
    {
      name: 'Port Configuration Gotcha',
      entityType: 'gotcha',
      observations: [
        'Problem: Turbopack ignores next.config.js port setting',
        'Symptom: App starts on port 3002 instead of 3000',
        'Solution: Must use --port flag in package.json script',
        'Command: next dev --turbopack --port 3000',
        'SOP: .agent/sops/port-troubleshooting.md',
        'Date: 2025-10-26',
      ],
    },
  ],
});
```

**When**: Issue fixed AND documented in SOP
**Frequency**: Rarely (only recurring issues)
**Token Cost**: ~1000 tokens

### New Pattern Established

**When you create a reusable pattern**:

```typescript
// Example: Component composition pattern

mcp__memory__create_entities({
  entities: [
    {
      name: 'Neumorphic Card Pattern',
      entityType: 'ui-pattern',
      observations: [
        'Pattern: Consistent shadow and border styling for cards',
        'CSS: shadow-[0_8px_16px_rgba(0,0,0,0.1)] + border-white/20',
        'Usage: All card components (IssueCard, ProjectCard, etc.)',
        'Accessibility: Maintains WCAG AA contrast ratios',
        'Location: components/ui/card-neumorphic.tsx',
      ],
    },
  ],
});
```

**When**: Pattern used 3+ times and documented
**Frequency**: 1-3 times per phase
**Token Cost**: ~1000 tokens

---

## ❌ When NOT to Use Memory MCP

### Task Progress (Use Files Instead)

**❌ DON'T DO THIS**:

```typescript
// WRONG: Using Memory MCP for task progress
mcp__memory__create_entities({
  entities: [
    {
      name: 'Current Task',
      entityType: 'task',
      observations: ['Working on POST /api/issues endpoint', '70% complete', 'Next: Write tests'],
    },
  ],
});
```

**✅ DO THIS**:

```markdown
<!-- .agent/task/current-todos.md -->

## 🔄 In Progress

- [ ] **Implement POST /api/issues** (70% complete, next: tests)
```

**Why?** Files are 10x cheaper and immediately readable

### Session Context (Use Files Instead)

**❌ DON'T DO THIS**:

```typescript
// WRONG: Using Memory MCP for session state
mcp__memory__add_observations({
  observations: [
    {
      entityName: 'Current Session',
      contents: ['Started at 14:30', 'Implemented API endpoint', 'Now writing tests'],
    },
  ],
});
```

**✅ DO THIS**:

```markdown
<!-- .agent/task/current-session-20251027-1430.md -->

## Progress This Session

- ✅ 14:30 - Created Prisma schema
- ✅ 14:45 - Implemented API endpoint
- 🔄 15:00 - IN PROGRESS: Writing tests
```

**Why?** Session files are designed for this exact purpose

### Temporary Information (Use Nothing)

**❌ DON'T DO THIS**:

```typescript
// WRONG: Storing temporary notes
mcp__memory__create_entities({
  entities: [
    {
      name: 'Temporary Notes',
      entityType: 'notes',
      observations: [
        'Remember to check this later',
        'Might need to refactor',
        'Ask user about preferences',
      ],
    },
  ],
});
```

**✅ DO THIS**:

```markdown
<!-- In conversation or session file if important -->

**TODO**: Check X later
**Note**: May need to refactor Y
**Question for user**: What are your preferences for Z?
```

**Why?** Temporary notes clutter the knowledge graph

---

## 🔄 Memory MCP Update Pattern

### Phase Start

**Do NOT create Memory MCP entries yet** - focus on files for progress tracking

### During Phase

**Use files exclusively** for task progress and session context

### Phase Completion

**Review and capture strategic knowledge**:

1. **Review what was built** (from session files and git commits)
2. **Identify strategic knowledge**:
   - What decisions were made and why?
   - What patterns emerged?
   - What gotchas were discovered?
   - What will future developers need to know?

3. **Create Memory MCP entities** for strategic knowledge only
4. **Link entities** with relations to show connections

---

## 📈 Memory MCP Maintenance

### Quarterly Review

**Every 3 months, review Memory MCP**:

```typescript
// Get all entities
mcp__memory__read_graph();

// Review for:
// - Outdated information (patterns no longer used)
// - Redundant entities (consolidate)
// - Missing relations (connect related concepts)
```

### Delete Outdated Knowledge

```typescript
// Example: Remove old pattern no longer used
mcp__memory__delete_entities({
  entityNames: ['Old API Pattern v1'],
});
```

### Update Evolving Patterns

```typescript
// Example: Update pattern as it evolves
mcp__memory__add_observations({
  observations: [
    {
      entityName: 'API Error Handling Pattern',
      contents: [
        'Updated 2025-10-27: Now includes retry logic for transient errors',
        'Uses exponential backoff with max 3 retries',
      ],
    },
  ],
});
```

---

## 🎯 Memory MCP Query Patterns

### Find Similar Work

**Before starting new work, query for similar patterns**:

```typescript
// Search for API patterns before creating new endpoint
mcp__memory__search_nodes({
  query: 'API endpoint pattern validation',
});

// Returns: Previously established patterns, lessons learned
```

### Understand Decisions

**When questioning a design decision**:

```typescript
// Why did we choose this approach?
mcp__memory__search_nodes({
  query: 'Server Actions vs API routes decision',
});

// Returns: Original reasoning, trade-offs considered
```

### Find Gotchas

**Before working on similar feature**:

```typescript
// Check for known gotchas
mcp__memory__search_nodes({
  query: 'port configuration database connection',
});

// Returns: Known issues and their solutions
```

---

## 📊 Token Budget Comparison

### Example Phase with Files Only (Tier 1 + 2)

**Task progress tracking**: 10 updates × 200 tokens = 2,000 tokens
**Session file updates**: 5 updates × 200 tokens = 1,000 tokens
**STATUS.md checkpoint**: 1 update × 500 tokens = 500 tokens
**Total**: 3,500 tokens

### Adding Memory MCP (Tier 3)

**Phase completion knowledge**: 2 entities × 1,000 tokens = 2,000 tokens
**Architectural decisions**: 1 entity × 1,000 tokens = 1,000 tokens
**Total with Memory MCP**: 6,500 tokens

**Cost Increase**: +3,000 tokens (85% increase)
**Benefit**: Persistent strategic knowledge survives indefinitely

---

## 🏆 Best Practices

### 1. **Files First, Memory MCP Last**

Always use files for progress tracking. Only use Memory MCP for strategic knowledge at phase completion.

### 2. **Be Selective**

Not every decision needs Memory MCP. Only capture knowledge that:

- Will be reused in future phases
- Prevents repeated mistakes
- Explains "why" (not just "what")
- Helps new team members understand system

### 3. **Link Related Knowledge**

Use relations to connect related concepts:

```typescript
mcp__memory__create_relations({
  relations: [
    {
      from: 'Issue Management Pattern',
      to: 'Next.js App Router',
      relationType: 'implements-in',
    },
    {
      from: 'Issue Management Pattern',
      to: 'Port Configuration Gotcha',
      relationType: 'affected-by',
    },
  ],
});
```

### 4. **Include Context**

Always include date and reasoning in observations:

```
"Decision made 2025-10-27: Chose X over Y because..."
"Pattern established 2025-10-26: Use X when..."
```

### 5. **Query Before Creating**

Always search Memory MCP before creating similar work to avoid reinventing solutions.

---

## 📚 Related Documentation

- [.agent/system/mcp-tools-guide.md](.agent/system/mcp-tools-guide.md) - Complete MCP tools reference
- [.agent/workflows/persistence-rules.md](.agent/workflows/persistence-rules.md) - Persistence strategy overview
- [.agent/task/README.md](.agent/task/README.md) - File-based context system
- [CLAUDE.md](../../CLAUDE.md) - Integration guide

---

## 💡 Quick Reference

**Use files for**: Current work, session progress, task tracking
**Use Memory MCP for**: Design decisions, patterns, lessons learned, gotchas

**Files token cost**: ~100-200 tokens per operation
**Memory MCP token cost**: ~1000 tokens per operation

**Files are human-readable**: Yes, directly in filesystem
**Memory MCP is human-readable**: Only via query

**Files survive**: Context compaction, session interruption
**Memory MCP survives**: Context compaction, session interruption, project restarts

**Update frequency**: Files (every 15-30 min), Memory MCP (phase completion)

---

**Remember**: Memory MCP is your strategic knowledge base, not your task tracker!

**See also**: [STATUS.md](../../STATUS.md) for current project status
