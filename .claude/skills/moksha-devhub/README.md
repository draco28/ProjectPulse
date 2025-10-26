# Moksha DevHub Skills

**Created**: 2025-10-26
**Purpose**: Token-efficient codebase patterns and conventions
**Token Cost**: ~1,100 tokens (all 5 skills) vs ~14,000 tokens (full docs)
**Savings**: 92% token reduction

---

## What Are Skills?

**Skills** are concise, token-efficient patterns that capture Moksha DevHub's coding conventions. They provide quick reference for common tasks while linking to comprehensive documentation for deep dives.

**How They Work**:

1. Skill descriptions always loaded in context (50-100 tokens each)
2. Full skill content loaded only when invoked
3. After use, content can be discarded from context
4. Skills link to full `.agent/` documentation for details

---

## Available Skills

### [api-patterns.md](api-patterns.md)

**When**: Creating API endpoints, implementing routes
**Triggers**: "api endpoint", "create route", "POST /api", "GET /api"
**Covers**:

- Next.js App Router API structure
- Zod validation patterns
- Prisma query patterns
- Response format conventions
- Error handling

**Token Cost**: ~220 tokens (vs 2,400 in full api-catalog.md)

---

### [component-patterns.md](component-patterns.md)

**When**: Creating React components
**Triggers**: "create component", "new component", "server component"
**Covers**:

- Server vs Client component decision
- File organization
- Naming conventions
- Tailwind CSS styling
- shadcn/ui integration

**Token Cost**: ~280 tokens (vs 3,500 in full component-patterns.md)

---

### [database-patterns.md](database-patterns.md)

**When**: Querying database, working with Prisma
**Triggers**: "prisma", "database query", "migration", "findMany"
**Covers**:

- Common query patterns
- Relations (include vs select)
- Pagination
- Migrations
- Transactions

**Token Cost**: ~200 tokens (vs 2,800 in full database-schema.md)

---

### [testing-patterns.md](testing-patterns.md)

**When**: Writing tests
**Triggers**: "write test", "jest", "playwright", "unit test"
**Covers**:

- API tests (Jest)
- Component tests (React Testing Library)
- E2E tests (Playwright)
- Mocking patterns
- Test structure (AAA)

**Token Cost**: ~240 tokens (vs 2,000+ in full testing guide)

---

### [../workflows/git-workflow.md](../workflows/git-workflow.md)

**When**: Git operations, branching, committing
**Triggers**: "git", "branch", "commit", "pull request"
**Covers**:

- Branch naming (api/_, ui/_, feature/_, fix/_)
- Commit message format
- Pre-commit checklist
- Common workflows
- Emergency procedures

**Token Cost**: ~180 tokens (vs 3,200 in full git-workflow.md)

---

## Usage

### Automatic Invocation

Skills are automatically invoked when Claude Code detects relevant triggers in your request.

**Example**:

```
You: "Create a new API endpoint for issues"
→ Claude automatically uses api-patterns skill
→ Generates code following our conventions
```

### Explicit Invocation

You can explicitly request a skill:

```
You: "Use the API patterns skill"
You: "Follow our component patterns"
You: "Show me the git workflow"
```

### When Skills Are Loaded

1. **Session Start**: Only skill descriptions loaded (~500 tokens for all 5)
2. **When Invoked**: Full skill content loaded temporarily
3. **After Use**: Content discarded, description remains
4. **Result**: Continuous low token usage

---

## Skills vs Documentation

### Three-Layer System

```
Layer 1: Skills (.claude/skills/)
├── Token-efficient (50-280 tokens each)
├── Quick reference for common tasks
├── Auto-invoked when relevant
└── Links to Layer 2 ↓

Layer 2: Agent Docs (.agent/)
├── Comprehensive (2-5K tokens each)
├── Loaded on-demand
├── Full procedures and troubleshooting
└── References Layer 3 ↓

Layer 3: Project Docs (docs/)
├── Architecture, design decisions
├── Long-form documentation
└── Referenced by Layers 1 & 2
```

### When to Use What

**Use Skills For**:

- Common, repetitive tasks
- Following codebase conventions
- Quick pattern reference
- Token-efficient context

**Use .agent/ Docs For**:

- Detailed procedures
- Troubleshooting
- Complete reference
- Advanced patterns

**Use Project Docs For**:

- Architecture understanding
- Design decisions
- Long-form guides
- System overviews

---

## Token Savings Analysis

### Session Start Comparison

**Before Skills** (Loading Full Docs):

```
CLAUDE.md:               3,000 tokens
.agent/README.md:        2,000 tokens
api-catalog.md:          2,400 tokens
component-patterns.md:   3,500 tokens
database-schema.md:      2,800 tokens
git-workflow.md:         3,200 tokens
--------------------------------
Total:                  16,900 tokens
```

**With Skills** (Loading Descriptions Only):

```
CLAUDE.md:               3,000 tokens
Skill descriptions:      1,100 tokens (all 5 skills)
--------------------------------
Total:                   4,100 tokens

Savings: 12,800 tokens (76% reduction)
```

### Per-Task Comparison

**Without Skills**:

```
Task: Create API endpoint
- Load full api-catalog.md:     2,400 tokens
- Load full component docs:     3,500 tokens
- Total context:                5,900 tokens
```

**With Skills**:

```
Task: Create API endpoint
- api-patterns skill:           220 tokens
- (component skill not loaded)
- Total context:                220 tokens

Savings: 5,680 tokens (96% reduction)
```

---

## Maintenance

### Keeping Skills Current

**When to Update Skills**:

- New patterns emerge in codebase
- Conventions change
- Best practices evolve
- Tech stack updates

**How to Update**:

1. Edit skill markdown file
2. Update `last_updated` date
3. Adjust `token_estimate` if significantly changed
4. Update related links if docs moved
5. Commit with message: `docs(skills): update [skill-name]`

### Auto-Update (Future)

**Coming in Phase 2**:

```
/update-doc skill [topic]
→ Analyzes codebase for [topic]
→ Generates/updates skill
→ Saves to .claude/skills/moksha-devhub/
```

---

## Creating New Skills

### Skill Template

```markdown
---
name: skill-name-kebab-case
description: Brief description (1-2 sentences) of when to use. Include specific use cases.
triggers: ['keyword1', 'keyword2', 'phrase with spaces']
token_estimate: 200
last_updated: 2025-10-26
related_docs:
  - ../../.agent/path/to/full/doc.md
---

# Skill Title

## Quick Pattern

[Most common use case with minimal example]

## Our Conventions

- Convention 1
- Convention 2

## Common Variations

**When X**: Do Y

## Full Documentation

See [Full Guide](../../.agent/path) for details.

---

**Token Cost**: ~200 tokens (vs ~2,500 in full doc)
```

### Guidelines

**Good Skills**:

- Cover 80%+ of common use cases
- Include actual code examples
- Link to comprehensive docs
- Stay under 300 tokens
- Use clear, concise language

**Avoid**:

- Trying to cover every edge case
- Duplicating full documentation
- Overly generic patterns
- Mixing multiple unrelated topics

---

## Integration with Workflow

### Your Existing Workflow (Unchanged)

```
1. Read STATUS.md
2. Read DEVELOPMENT_PLAN.md
3. Complete feature
4. Update STATUS.md
5. Update DEVELOPMENT_PLAN.md
6. Commit
```

### Enhanced with Skills (Automatic)

```
1. Read STATUS.md
2. Read DEVELOPMENT_PLAN.md
   + Skills descriptions loaded (1,100 tokens)
3. Complete feature
   + Skills auto-invoked as needed
   + Full skill content loaded temporarily
   + Discarded after use
4. Update STATUS.md
5. Update DEVELOPMENT_PLAN.md
6. Commit
```

**No manual intervention needed!** Skills work automatically in the background.

---

## FAQ

### Q: Do I need to manually invoke skills?

**A**: No! Skills are automatically invoked when Claude Code detects relevant triggers in your request. You can explicitly request them if desired, but it's not required.

### Q: What if a skill doesn't cover my use case?

**A**: Skills are designed for common (80%+) cases. For advanced scenarios, the skill will link to comprehensive documentation in `.agent/` or `docs/`.

### Q: How often are skills updated?

**A**: Skills should be updated when patterns change. Currently manual (edit .md file), but Phase 2 will add auto-update via `/update-doc skill [topic]`.

### Q: Can I create custom skills?

**A**: Yes! Follow the template above and place in `.claude/skills/moksha-devhub/`. Update this README to include the new skill.

### Q: Do skills replace .agent/ documentation?

**A**: No! Skills are **token-efficient access layer** to full documentation. Think: Skills for quick reference, .agent/ for deep dives.

---

## Related Documentation

- [SKILLS_ENHANCEMENT_PLAN.md](../../.agent/SKILLS_ENHANCEMENT_PLAN.md) - Complete implementation plan
- [.agent/README.md](../../.agent/README.md) - Agent documentation index
- [CLAUDE.md](../../CLAUDE.md) - Claude Code integration guide
- [transcript_skills.md](../../transcript_skills.md) - Original concept explanation

---

## Next Steps

### Phase 1 (Complete)

- ✅ Created 5 foundational skills
- ✅ Documented usage and benefits
- ✅ Integrated with existing workflow

### Phase 2 (Upcoming)

- Add auto-skill generation via `/update-doc skill`
- Enhance sub-agents to create skills
- Implement lazy-loading optimization

### Phase 3 (Future)

- Convert critical SOPs to skills
- Pattern drift detection
- Skill versioning
- Usage analytics

---

**Status**: Phase 1 Complete
**Total Token Savings**: 92% reduction in pattern/convention loading
**Next**: Auto-skill generation (Phase 2)

🚀 **Skills are ready to use!** Just chat naturally, and they'll work automatically.
