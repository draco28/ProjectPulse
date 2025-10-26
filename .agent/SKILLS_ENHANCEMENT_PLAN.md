# Skills Enhancement Plan - Moksha DevHub

**Created**: 2025-10-26
**Status**: Planning → Implementation
**Based On**: transcript_skills.md analysis
**Goal**: Implement token-efficient skills system on top of existing .agent/ documentation

---

## Executive Summary

Implement Claude Code skills to achieve **98% token reduction** for pattern/convention loading while maintaining comprehensive documentation in `.agent/` folder.

**Key Insight**: Skills provide token-efficient descriptions (50-150 tokens) that link to full documentation (2-5K tokens), loading full content only when needed.

**Example**: Shadcn MCP (4,200 tokens) → Shadcn Skill (70 tokens) = 98% reduction

---

## Background

### What Are Skills?

**Skills** are Claude Code's way of teaching agents how to perform specific tasks with minimal token overhead.

**Structure**:

```markdown
---
name: skill-name
description: When to use this skill (50-100 tokens)
triggers: ['keyword1', 'keyword2']
token_estimate: 150
---

# Skill Content

[Concise instructions with examples]
[Links to full documentation]
```

**How They Work**:

1. **Description** always loaded in context (50-100 tokens)
2. **Full content** only loaded when skill invoked
3. Agent decides which skill to use based on triggers
4. After use, content can be discarded

### Skills vs MCP

| Aspect      | MCP                           | Skills                   |
| ----------- | ----------------------------- | ------------------------ |
| Purpose     | External tools/APIs           | Patterns/conventions     |
| Token Cost  | 4,200 tokens (Shadcn example) | 70 tokens (98% less)     |
| When Loaded | Always in context             | On-demand                |
| Best For    | Database, browser, git        | Code patterns, workflows |

### Skills vs Our .agent/ System

**Not Replacing - Enhancing!**

```
.agent/sops/          → Full reference (3K tokens each)
     ↓
.claude/skills/       → Token-efficient access (70 tokens)
     ↓
Main conversation     → Only loads full content when needed
```

**Relationship**:

- `.agent/` = **Comprehensive documentation** (for deep dives)
- `.claude/skills/` = **Quick reference patterns** (for common tasks)
- Skills link to .agent/ docs for details

---

## Current State Analysis

### Token Usage (Current System)

**Session Start**:

```
CLAUDE.md:              3,000 tokens
.agent/README.md:       2,000 tokens
Relevant SOPs:          3,000 tokens (1 SOP loaded)
Relevant system docs:   4,000 tokens (1 system doc)
Total:                 12,000 tokens
```

**Problem**: Even with our optimizations, loading full SOPs/docs at session start is heavy.

### What We Have

**Strengths**:

- ✅ `.agent/` documentation structure
- ✅ Sub-agents for research tasks
- ✅ SOPs for procedures
- ✅ System docs for technical references
- ✅ `.claude/skills/` directory (empty/example skills)

**Gaps**:

- ❌ No codebase-specific skills
- ❌ SOPs not in skill format (token-heavy)
- ❌ Sub-agents don't generate skills
- ❌ No auto-skill-creation from implementations

---

## Enhancement Plan

### Phase 1: Create Codebase Skills (Week 1) - IMMEDIATE

**Goal**: Create 5 foundational skills for Moksha DevHub patterns

**Skills to Create**:

#### 1. `moksha-api-patterns.md`

**Purpose**: Standard API route implementation patterns
**Triggers**: "api endpoint", "create route", "POST /api", "GET /api"
**Content**:

- Next.js API route structure
- Zod validation pattern
- Prisma query pattern
- Response envelope format
- Error handling
- Link to: `.agent/system/api-catalog.md`

**Token Estimate**: 200 tokens (vs 2,400 in api-catalog.md)

#### 2. `moksha-component-patterns.md`

**Purpose**: React component conventions
**Triggers**: "create component", "new component", "react component"
**Content**:

- Server vs Client component decision tree
- File naming conventions
- Props typing pattern
- shadcn/ui integration
- Styling with Tailwind
- Link to: `.agent/system/component-patterns.md`

**Token Estimate**: 250 tokens (vs 3,500 in component-patterns.md)

#### 3. `moksha-database-patterns.md`

**Purpose**: Prisma usage patterns
**Triggers**: "prisma", "database query", "schema", "migration"
**Content**:

- Common query patterns
- Migration workflow
- Relation loading (include vs select)
- Transaction patterns
- Link to: `.agent/system/database-schema.md`

**Token Estimate**: 180 tokens (vs 2,800 in database-schema.md)

#### 4. `moksha-testing-patterns.md`

**Purpose**: Test writing conventions
**Triggers**: "write test", "test", "jest", "playwright"
**Content**:

- API testing pattern (Jest + Supertest)
- Component testing pattern (RTL)
- E2E testing pattern (Playwright)
- Mock data patterns
- Link to: `.agent/sops/` (when created)

**Token Estimate**: 220 tokens

#### 5. `moksha-git-workflow.md`

**Purpose**: Git branching and commit conventions
**Triggers**: "git", "branch", "commit", "pull request"
**Content**:

- Branch naming (api/_, ui/_, feature/\*)
- Pre-work checklist
- Commit message format
- PR creation process
- Link to: `.agent/sops/git-workflow.md`

**Token Estimate**: 150 tokens (vs 3,200 in git-workflow.md)

**Total Token Savings**:

- **Before**: 12,000 tokens (all docs loaded)
- **After**: 1,000 tokens (5 skills loaded)
- **Savings**: 92% reduction!

---

### Phase 2: Enhance Sub-Agents (Week 2)

#### Add "Skill Mode" to synthesize-docs

**New Capability**: Generate skills from implementations

**Usage**:

```
/update-doc skill [topic]

Example:
/update-doc skill api-endpoints
```

**What It Does**:

1. Analyzes recent implementations for [topic]
2. Identifies common patterns
3. Extracts conventions
4. Generates skill with:
   - Description & triggers
   - Pattern examples
   - Links to full docs
5. Saves to `.claude/skills/moksha-devhub/`
6. Updates skill index

**Benefits**:

- Skills stay current with codebase
- Auto-capture new patterns
- Self-improving system

#### Enhance explore-codebase for Pattern Detection

**New Capability**: Identify patterns across codebase

**Usage**:

```
"Analyze API routes and identify common patterns"
```

**What It Does**:

1. Scans all API routes
2. Identifies consistent patterns
3. Notes deviations
4. Suggests skill creation
5. Returns summary for synthesize-docs

---

### Phase 3: Convert Critical SOPs to Skills (Week 2-3)

#### Port Troubleshooting Skill

**Current**: `.agent/sops/port-troubleshooting.md` (3,200 tokens)

**New**: `.claude/skills/troubleshooting/port-config.md` (150 tokens)

```markdown
---
name: port-configuration-fix
description: Fix Next.js dev server port issues. Use when localhost:3000 shows default page or pnpm dev starts on wrong port (3002).
triggers: ['port 3000', 'port 3002', 'default next.js page', 'localhost not working']
token_estimate: 150
---

# Quick Fix

1. **Check port**: `pnpm dev` → MUST show `:3000`
2. **If wrong**: Remove `PORT=3002` from `.env.local`
3. **Kill processes**: `pkill -f node` (Mac/Linux) or `taskkill /F /IM node.exe` (Windows)
4. **Restart**: `pnpm dev`
5. **Verify**: Browser shows your app at localhost:3000

**Full troubleshooting guide**: [.agent/sops/port-troubleshooting.md](../../.agent/sops/port-troubleshooting.md)
```

**Keep Full SOP**: Yes, in `.agent/sops/` for detailed reference

#### Git Workflow Skill

**Current**: `.agent/sops/git-workflow.md` (3,200 tokens)

**New**: `.claude/skills/workflows/git-branching.md` (180 tokens)

**Keep Full SOP**: Yes, for complete procedures

---

### Phase 4: Token Optimization (Week 3-4)

#### Lazy-Loading System

**Goal**: Only load skill descriptions at session start, full content on-demand

**Implementation**:

1. Session start: Load only skill YAML frontmatter (1K tokens for 10 skills)
2. When skill invoked: Load full content
3. After use: Discard full content, keep description
4. Result: Continuous low token usage

#### Skill Index

**Create**: `.claude/skills/moksha-devhub/README.md`

**Content**:

```markdown
# Moksha DevHub Skills

## Quick Reference

- [api-patterns.md](api-patterns.md) - API route conventions
- [component-patterns.md](component-patterns.md) - React patterns
- [database-patterns.md](database-patterns.md) - Prisma patterns
- [testing-patterns.md](testing-patterns.md) - Test conventions
- [git-workflow.md](git-workflow.md) - Git branching

## Usage

Skills are auto-invoked when relevant. You can also explicitly request:

"Use the API patterns skill"
"Follow our component patterns"
```

---

## Expected Benefits

### Token Savings

**Per Session**:

```
Current: 12,000 tokens at start
With Skills: 1,000 tokens at start
Savings: 92% (11,000 tokens)
```

**Over 10 Tasks**:

```
Current: ~120,000 tokens
With Skills: ~20,000 tokens
Savings: 83% (100,000 tokens)
```

### Other Benefits

1. **Faster Context Loading**: Less to read at session start
2. **Better Pattern Consistency**: Skills capture actual conventions
3. **Self-Improving**: Skills grow with codebase
4. **Easier Onboarding**: New developers (or you in 6 months) see patterns quickly
5. **Reduced Errors**: Common mistakes prevented by pattern guidance

---

## Integration with Existing System

### Three-Layer Architecture

```
Layer 1: Skills (.claude/skills/)
- Token-efficient patterns (50-250 tokens each)
- Always loaded (descriptions only)
- Quick reference for common tasks
- Links to Layer 2

Layer 2: Agent Docs (.agent/)
- Comprehensive documentation (2-5K tokens each)
- Loaded on-demand
- Full procedures and references
- Detailed troubleshooting

Layer 3: Project Docs (docs/)
- Architecture, design decisions
- Long-form documentation
- Referenced by Layers 1 & 2
- Rarely loaded in full
```

### Workflow Integration

**No Changes to Your Workflow!**

```
Your Existing Workflow (Unchanged):
1. Read STATUS.md
2. Read DEVELOPMENT_PLAN.md
3. Complete feature
4. Update STATUS.md
5. Update DEVELOPMENT_PLAN.md
6. Commit

Enhanced (Optional):
7. /update-doc skill [topic] → Generate skill from implementation
8. Skills auto-update based on new patterns
```

### Sub-Agent Integration

**Sub-agents reference skills**:

```
explore-codebase:
- Identifies patterns
- Suggests skill creation

analyze-architecture:
- References skills for patterns
- Links to full .agent/ docs

synthesize-docs:
- Generates skills (new mode)
- Generates SOPs (existing)

map-system:
- Updates system docs
- Triggers skill refresh if patterns changed
```

---

## Implementation Checklist

### Phase 1: Create Initial Skills ✅ READY

- [ ] Create `.claude/skills/moksha-devhub/` directory
- [ ] Create `moksha-api-patterns.md`
- [ ] Create `moksha-component-patterns.md`
- [ ] Create `moksha-database-patterns.md`
- [ ] Create `moksha-testing-patterns.md`
- [ ] Create `moksha-git-workflow.md`
- [ ] Create skill index: `README.md`
- [ ] Test skill invocation
- [ ] Measure token savings
- [ ] Commit to branch

### Phase 2: Enhance Sub-Agents (LATER)

- [ ] Add "skill mode" to synthesize-docs
- [ ] Update /update-doc command for skills
- [ ] Add pattern detection to explore-codebase
- [ ] Test auto-skill generation
- [ ] Document skill creation workflow

### Phase 3: Convert SOPs to Skills (LATER)

- [ ] Create port-config skill
- [ ] Create git-workflow skill
- [ ] Create troubleshooting skills category
- [ ] Keep full SOPs for reference
- [ ] Update cross-references

### Phase 4: Token Optimization (LATER)

- [ ] Implement lazy-loading
- [ ] Measure token usage improvements
- [ ] Create skill refresh mechanism
- [ ] Document best practices

---

## Success Metrics

### Quantitative

- **Token Reduction**: Target 90%+ reduction in session start tokens
- **Context Utilization**: <5% of 200K budget at session start
- **Skill Coverage**: 80%+ of common tasks covered by skills
- **Load Time**: <1 second to load all skill descriptions

### Qualitative

- **Ease of Use**: Skills invoked automatically without user requesting
- **Consistency**: Generated code follows skills patterns
- **Completeness**: Skills cover actual codebase conventions
- **Freshness**: Skills stay current as codebase evolves

---

## Risks & Mitigations

### Risk 1: Skill Descriptions Too Generic

**Risk**: Skills don't capture actual codebase specifics

**Mitigation**:

- Generate from actual implementations
- Include codebase-specific examples
- Link to real files in repo
- Regular reviews and updates

### Risk 2: Skills Become Outdated

**Risk**: Patterns change but skills don't

**Mitigation**:

- Auto-refresh mechanism
- /update-doc refresh-skills command
- Version skills with timestamps
- Sub-agents detect pattern drift

### Risk 3: Too Many Skills = Token Bloat

**Risk**: Creating too many skills defeats the purpose

**Mitigation**:

- Focus on most common patterns
- Combine related skills
- Archive rarely-used skills
- Monitor skill invocation frequency

---

## Next Steps - IMMEDIATE

### Step 1: Create Directory Structure

```bash
mkdir -p .claude/skills/moksha-devhub
mkdir -p .claude/skills/troubleshooting
mkdir -p .claude/skills/workflows
```

### Step 2: Analyze Current API Patterns

Scan `apps/web/app/api/` to identify:

- Common route structure
- Validation patterns
- Response formats
- Error handling

### Step 3: Generate First Skill

Create `moksha-api-patterns.md` with:

- Analysis of current API routes
- Common patterns identified
- Concise skill format
- Links to full documentation

### Step 4: Test & Measure

- Invoke skill in conversation
- Measure token usage
- Compare to loading full api-catalog.md
- Verify pattern accuracy

### Step 5: Create Remaining Skills

Using same process:

- Component patterns
- Database patterns
- Testing patterns
- Git workflow

---

## Documentation Updates Required

### Update CLAUDE.md

Add section:

```markdown
## Skills

**Codebase patterns available as skills:**

- API Patterns - Standard API route implementation
- Component Patterns - React component conventions
- Database Patterns - Prisma usage patterns
- Testing Patterns - Test writing conventions
- Git Workflow - Branch and commit patterns

**Skills auto-invoke when relevant. Token cost: ~50-250 tokens each (vs 2-5K for full docs)**
```

### Update .agent/README.md

Add section:

```markdown
## Skills vs Documentation

**Skills** (.claude/skills/): Token-efficient patterns (50-250 tokens)
**Documentation** (.agent/): Comprehensive references (2-5K tokens)

Skills link to docs for details. Use skills for common patterns, docs for deep dives.
```

---

## Timeline

**Week 1 (This Week)**:

- ✅ Plan creation (DONE)
- 🔄 Phase 1 implementation (IN PROGRESS)
- Deliverable: 5 codebase skills + skill index

**Week 2**:

- Phase 2: Enhance sub-agents for skill generation
- Deliverable: /update-doc skill command working

**Week 3**:

- Phase 3: Convert critical SOPs to skills
- Deliverable: Port config & git workflow skills

**Week 4**:

- Phase 4: Token optimization
- Deliverable: Lazy-loading, metrics, documentation

---

## Resources

### Reference Materials

- `transcript_skills.md` - Original concept explanation
- `transcript_context_management.md` - Context optimization techniques
- `.agent/` - Current documentation system
- `.claude/skills/` - Example skills (from plugin)

### Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Integration guide
- [.agent/README.md](README.md) - Documentation index
- [Context Management Plan](../transcript_context_management.md)

---

## Appendix: Skill Template

````markdown
---
name: skill-name-kebab-case
description: Brief description (1-2 sentences) of when to use this skill. Include specific triggers.
triggers: ['keyword1', 'keyword2', 'phrase']
token_estimate: 150
last_updated: 2025-10-26
related_docs:
  - path/to/full/doc.md
  - path/to/related/doc.md
---

# Skill Title

## Quick Pattern

[Most common use case with minimal example]

```typescript
// Concise code example
```
````

## Our Conventions

- Convention 1
- Convention 2
- Convention 3

## Common Variations

**When X**: Do Y
**When Z**: Do W

## Full Documentation

See [Full Guide](path/to/full/doc.md) for:

- Detailed procedures
- Troubleshooting
- Advanced patterns
- Complete examples

---

**Token Cost**: ~150 tokens (vs ~2,500 in full doc)
**Coverage**: 80% of common cases

```

---

**Status**: ✅ ALL PHASES COMPLETE (2025-10-26)
**Completion Note**: Skills implemented through Master Workflow Enhancement Plan (Phases 1-5)
**Achievement**: 74-83% token reduction, 3.8x session capacity improvement
**See**: [MASTER_WORKFLOW_ENHANCEMENT_PLAN.md](MASTER_WORKFLOW_ENHANCEMENT_PLAN.md) for implementation details

**Delivered**:
- ✅ Phase 1: 7 foundational skills created
- ✅ Phase 2: Auto-skill generation system
- ✅ Phase 3: SOPs converted to skills
- ✅ Phase 4: Token optimization & metrics
- ✅ Lazy-loading documented
- ✅ Token measurement guide created
- ✅ Skill refresh mechanism (/refresh-skills command)
- ✅ Baseline metrics: 74% session start reduction, 77% cumulative reduction

**Next**: Phase 6 - Real-world testing and validation
```
