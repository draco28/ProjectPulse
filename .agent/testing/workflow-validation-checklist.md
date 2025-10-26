# Workflow Validation Checklist

**Purpose**: Comprehensive validation of complete workflow enhancement system
**Date**: 2025-10-26
**Phases Covered**: 1-5 (Context Workflow, Specialized Agents, Auto-Skills, SOPs→Skills, Token Optimization)

---

## Quick Status

**Overall System Health**: [ ] Pass / [ ] Fail

**Phase Status**:

- [ ] Phase 1: Context File Workflow
- [ ] Phase 2: Specialized Agents
- [ ] Phase 3: Auto-Skill Generation
- [ ] Phase 4: Convert SOPs to Skills
- [ ] Phase 5: Token Optimization

---

## Phase 1: Context File Workflow

### Session Initialization

- [ ] `current-session-[timestamp].md` created automatically at session start
- [ ] File contains: current phase, goals, requirements
- [ ] Timestamp format correct: YYYYMMDD-HHMM
- [ ] File location: `.agent/task/`

### Sub-Agent Context Management

- [ ] explore-codebase reads context file before starting
- [ ] analyze-architecture reads context file before starting
- [ ] synthesize-docs reads context file before starting
- [ ] map-system reads context file before starting

### Sub-Agent Report Saving

- [ ] explore-codebase saves report to `.agent/task/explore-[topic]-[timestamp].md`
- [ ] analyze-architecture saves report to `.agent/task/architecture-[topic]-[timestamp].md`
- [ ] synthesize-docs saves documentation to appropriate location
- [ ] map-system updates `.agent/system/` documentation

### Sub-Agent Context Updates

- [ ] Sub-agents update `current-session.md` after completion
- [ ] Updates include: summary of findings, recommendations, concerns
- [ ] Parent agent reads reports before implementing
- [ ] Context persists across conversation

### File Structure

```
.agent/task/
├── current-session-20251026-1430.md  ✓
├── explore-api-patterns-20251026-1445.md  ✓
├── architecture-search-20251026-1502.md  ✓
└── synthesize-sop-20251026-1530.md  ✓
```

- [ ] All files present and correctly named
- [ ] Files contain complete information
- [ ] No information loss across context compaction

---

## Phase 2: Specialized Agents

### Agent Availability

- [ ] next-js-expert.md exists in `.claude/agents/`
- [ ] prisma-expert.md exists in `.claude/agents/`
- [ ] react-expert.md exists in `.claude/agents/`

### Agent Content Quality

- [ ] Each agent ~5,000-6,000 tokens
- [ ] Contains deep technical expertise
- [ ] Includes decision trees and patterns
- [ ] Links to official documentation
- [ ] Has specific use cases documented

### Agent Invocation

- [ ] next-js-expert invoked for App Router questions
- [ ] prisma-expert invoked for schema design
- [ ] react-expert invoked for component architecture
- [ ] Invocation happens automatically based on keywords
- [ ] No manual reminders needed

### Agent Workflow

- [ ] Expert reads `current-session.md` first
- [ ] Expert creates detailed design/implementation plan
- [ ] Expert saves plan to `.agent/task/[expert]-[topic]-[timestamp].md`
- [ ] Parent agent reads plan before implementing
- [ ] Implementation follows expert guidance

---

## Phase 3: Auto-Skill Generation

### Skill Generation Capability

- [ ] synthesize-docs has skill generation mode
- [ ] Mode activated via `/update-doc skill [topic]`
- [ ] Skill template exists and is correct
- [ ] Token limit enforced (50-280 tokens)
- [ ] Validation rules applied

### Pattern Detection

- [ ] explore-codebase has pattern detection mode
- [ ] Scans 5-10 files for patterns
- [ ] Identifies 3-5 common patterns
- [ ] Extracts conventions (imports, naming, structure)
- [ ] Creates token-efficient summary

### Skill File Format

```yaml
---
name: skill-name
description: One sentence when to use
category: api|ui|database|testing|deployment
tokens: 220
related_docs:
  - ../../.agent/sops/full-doc.md
---
# Content (50-280 tokens)
```

- [ ] YAML frontmatter present and correct
- [ ] Name is kebab-case
- [ ] Description clear and concise
- [ ] Category appropriate
- [ ] Token count documented
- [ ] Related docs linked

### Skill Generation Workflow

```
User: "/update-doc skill api-validation"
↓
1. explore-codebase detects patterns
2. synthesize-docs creates skill
3. Skill saved to .claude/skills/moksha-devhub/
4. Index updated
5. Token savings reported
```

- [ ] All steps execute automatically
- [ ] Skill file generated correctly
- [ ] Index updated with new entry
- [ ] Token savings calculated and reported

---

## Phase 4: Convert SOPs to Skills

### Troubleshooting Skills

- [ ] port-config.md exists (150 tokens)
- [ ] database-connection.md exists (180 tokens)
- [ ] Both in `.claude/skills/troubleshooting/`
- [ ] Cover common issues effectively
- [ ] Link to full SOPs

### Workflow Skills

- [ ] git-workflow.md exists (180 tokens)
- [ ] Covers 95% of daily git operations
- [ ] Includes emergency procedures
- [ ] Links to full workflow SOP

### Skill Index

- [ ] README.md in `.claude/skills/moksha-devhub/` updated
- [ ] Troubleshooting category added
- [ ] All 7 skills listed with token counts
- [ ] Token savings documented (92% overall)
- [ ] Phase tracking updated

### Skill Coverage

- [ ] API patterns (220 tokens)
- [ ] Component patterns (280 tokens)
- [ ] Database patterns (200 tokens)
- [ ] Testing patterns (240 tokens)
- [ ] Git workflow (180 tokens)
- [ ] Port config (150 tokens)
- [ ] Database connection (180 tokens)

**Total**: 1,430 tokens (vs 17,262 full docs) = **92% reduction** ✅

---

## Phase 5: Token Optimization

### Lazy-Loading Documentation

- [ ] Token Optimization section in moksha-devhub/README.md
- [ ] Three-tier system explained
- [ ] Session flow examples provided
- [ ] Keyword-based conditional loading documented
- [ ] Token budget management strategies outlined

### Token Measurement Tools

- [ ] `.claude/scripts/measure-tokens.md` created
- [ ] 3 measurement methods documented
- [ ] Test scenarios with examples
- [ ] Recording templates provided
- [ ] Key metrics defined

### Baseline Metrics

- [ ] `.agent/metrics/token-optimization-results.md` created
- [ ] 7 measurements documented
- [ ] Baseline vs Skills comparison
- [ ] Session capacity analysis (9 → 34 tasks)
- [ ] ROI analysis included
- [ ] Success metrics validated

### Skill Refresh Mechanism

- [ ] `.claude/commands/refresh-skills.md` created
- [ ] Pattern drift detection algorithm documented
- [ ] `/refresh-skills` command defined
- [ ] Thresholds documented (High >30%, Medium 10-30%, Low <10%)
- [ ] Sub-agent integration explained

### Token Savings Achievement

- [ ] Session start: 74% reduction (5,640 vs 21,662)
- [ ] Per-task: 76% reduction
- [ ] 10-task session: 77% reduction
- [ ] Session capacity: 3.8x improvement (34 vs 9 tasks)
- [ ] Token stability: <5% variance

---

## Cross-Phase Integration

### Automation (No Manual Reminders)

- [ ] Skills auto-load based on keywords
- [ ] Sub-agents auto-invoked when needed
- [ ] Experts auto-invoked for technical questions
- [ ] Context files created/updated automatically
- [ ] Reports saved automatically
- [ ] Skills unload after use automatically

### Context Persistence

- [ ] `current-session.md` created at start
- [ ] Sub-agents read context file first
- [ ] Sub-agents save reports to files
- [ ] Sub-agents update context file
- [ ] Parent agent reads reports before implementing
- [ ] Context survives conversation compaction

### Documentation Flow

```
Work completed
↓
synthesize-docs invoked
↓
SOP generated → .agent/sops/
Skill generated → .claude/skills/
↓
Indexes updated
↓
Documentation committed
```

- [ ] Flow works end-to-end
- [ ] No manual steps required
- [ ] Documentation stays current

---

## Token Usage Validation

### Session Start Tokens

**Target**: <6,000 tokens
**Actual**: ****\_\_\_**** tokens
**Status**: [ ] Pass / [ ] Fail

**Breakdown**:

- CLAUDE.md: **\_** tokens
- STATUS.md: **\_** tokens
- DEVELOPMENT_PLAN.md: **\_** tokens
- .agent/README.md: **\_** tokens
- Skill frontmatter (7 skills): **\_** tokens
- **Total**: **\_** tokens

### Per-Task Tokens (Sample Task)

**Task**: "Create POST /api/issues endpoint"
**Target**: <7,000 tokens peak
**Actual**: ****\_\_\_**** tokens
**Status**: [ ] Pass / [ ] Fail

**Breakdown**:

- Session baseline: **\_** tokens
- api-patterns skill loaded: +**\_** tokens
- Peak usage: **\_** tokens
- After unload: **\_** tokens

### Multi-Task Session (10 Tasks)

**Target**: <60,000 tokens cumulative
**Actual**: ****\_\_\_**** tokens
**Status**: [ ] Pass / [ ] Fail

**Tasks**: ********\_\_\_\_********
**Average peak per task**: **\_** tokens
**Token variance**: **\_** %
**Baseline stability**: [ ] Yes / [ ] No

---

## Skill Functionality

### Skill Auto-Loading

Test each skill triggers correctly:

- [ ] "Create API endpoint" → loads api-patterns
- [ ] "Add React component" → loads component-patterns
- [ ] "Write Prisma query" → loads database-patterns
- [ ] "Write tests" → loads testing-patterns
- [ ] "Create git branch" → loads git-workflow
- [ ] "Port 3000 not working" → loads port-config
- [ ] "Database connection error" → loads database-connection

### Skill Content Quality

For each skill, verify:

- [ ] Pattern description clear
- [ ] Steps actionable (3-5 steps)
- [ ] Example code shows structure
- [ ] Links to full docs work
- [ ] Token count accurate
- [ ] Under 280 tokens

### Skill Unloading

- [ ] Skills unload after use
- [ ] Context returns to baseline
- [ ] No token creep over multiple tasks
- [ ] Can load different skill for next task

---

## Sub-Agent Functionality

### explore-codebase

- [ ] Scans repository for patterns
- [ ] Finds all occurrences of features
- [ ] Returns concise summary (2-5K tokens)
- [ ] Reads context file first
- [ ] Saves report to file
- [ ] Updates context file

### analyze-architecture

- [ ] Traces data flow across files
- [ ] Maps dependencies and relationships
- [ ] Returns architectural insights
- [ ] Reads context file first
- [ ] Saves report to file
- [ ] Updates context file

### synthesize-docs

- [ ] Generates SOPs from implementations
- [ ] Generates skills from patterns
- [ ] Updates documentation indexes
- [ ] Reads context file first
- [ ] Saves documentation appropriately
- [ ] Updates context file

### map-system

- [ ] Scans Prisma schema
- [ ] Maps API endpoints
- [ ] Documents component patterns
- [ ] Updates system docs in .agent/system/
- [ ] Reads context file first
- [ ] Updates context file

---

## Specialized Expert Agents

### next-js-expert

- [ ] Invoked for App Router questions
- [ ] Provides Server vs Client Component guidance
- [ ] Suggests data fetching patterns
- [ ] Creates detailed implementation plans
- [ ] Saves plan to .agent/task/

### prisma-expert

- [ ] Invoked for schema design
- [ ] Suggests relation patterns
- [ ] Recommends indexes and optimizations
- [ ] Handles PostgreSQL features (pgvector, tsvector)
- [ ] Creates detailed schema design

### react-expert

- [ ] Invoked for component architecture
- [ ] Suggests hook patterns
- [ ] Recommends performance optimizations
- [ ] Guides state management decisions
- [ ] Creates component design plans

---

## Command Functionality

### /update-doc

Actions to test:

- [ ] `/update-doc initialize` - Sets up .agent/ structure
- [ ] `/update-doc after-feature` - Saves plan + generates SOP
- [ ] `/update-doc sop [topic]` - Generates specific SOP
- [ ] `/update-doc skill [topic]` - Generates skill from patterns
- [ ] `/update-doc refresh-system` - Updates system docs

### /refresh-skills

Actions to test:

- [ ] `/refresh-skills all` - Scans all skills for drift
- [ ] `/refresh-skills [skill-name]` - Scans specific skill
- [ ] Detects pattern drift correctly
- [ ] Calculates drift percentage
- [ ] Classifies drift level (high/medium/low)
- [ ] Prompts for approval before updating
- [ ] Updates skill if approved

---

## Git Integration

### Commit Message Format

- [ ] Uses conventional commits (feat/fix/docs/etc.)
- [ ] Includes scope when appropriate
- [ ] Clear, concise description
- [ ] Includes Claude Code attribution
- [ ] Co-authored by Claude

### Pre-Commit Checks

- [ ] On feature branch (not master)
- [ ] Code tested locally
- [ ] No debug code
- [ ] No secrets in code
- [ ] Linting passes

---

## Memory MCP Integration

### Entities Created

- [ ] AI_HUB Project
- [ ] AI_HUB Session Start Pattern
- [ ] AI_HUB Sub-Agent Auto-Invocation Rules
- [ ] AI_HUB Critical Reminders
- [ ] AI_HUB Specialized Expert Agents

### Observations Added

- [ ] Context file workflow rules
- [ ] Skill auto-loading patterns
- [ ] Token optimization strategies
- [ ] Pattern drift detection
- [ ] Expert agent invocation triggers

### Memory Persistence

- [ ] Reminders appear at session start
- [ ] Rules enforced automatically
- [ ] Patterns recognized consistently
- [ ] No manual reminders needed

---

## File Structure Validation

### .claude/ Directory

```
.claude/
├── agents/          ✓ (7 agents)
├── skills/          ✓ (moksha-devhub + troubleshooting + workflows)
├── commands/        ✓ (update-doc, refresh-skills)
└── scripts/         ✓ (measure-tokens)
```

- [ ] All directories exist
- [ ] All expected files present
- [ ] No orphaned or duplicate files

### .agent/ Directory

```
.agent/
├── README.md                 ✓
├── MASTER_WORKFLOW_ENHANCEMENT_PLAN.md  ✓
├── SKILLS_ENHANCEMENT_PLAN.md  ✓
├── task/                     ✓ (context files + reports)
├── system/                   ✓ (api, database, components)
├── sops/                     ✓ (procedures)
├── metrics/                  ✓ (optimization results)
└── testing/                  ✓ (test scenarios + checklists)
```

- [ ] All directories exist
- [ ] All expected files present
- [ ] Documentation up to date

---

## Performance Metrics

### Token Efficiency

- [ ] 74%+ reduction at session start
- [ ] 76%+ reduction per task
- [ ] 77%+ reduction for 10-task session
- [ ] 92%+ overall reduction (skills vs full docs)

### Session Capacity

- [ ] Can complete 30+ tasks before 200K limit
- [ ] Actual: **\_** tasks tested
- [ ] Token variance <5%
- [ ] No token creep observed

### Response Time

- [ ] Skill loading: <1 second
- [ ] Sub-agent invocation: <30 seconds
- [ ] Expert agent response: <1 minute
- [ ] Drift detection: <2 minutes

---

## User Experience

### Automation Level

- [ ] 0 manual reminders needed for skills
- [ ] 0 manual reminders needed for sub-agents
- [ ] 0 manual reminders needed for experts
- [ ] 0 manual reminders needed for context files
- [ ] 100% automatic workflow

### Documentation Quality

- [ ] Skills cover common patterns
- [ ] SOPs comprehensive and clear
- [ ] System docs accurate and current
- [ ] Examples work correctly
- [ ] Links not broken

### Error Handling

- [ ] Graceful degradation if skill missing
- [ ] Falls back to full SOP when needed
- [ ] Clear error messages
- [ ] Recovery suggestions provided

---

## Failure Recovery

### Test Failure Scenarios

- [ ] Skill doesn't auto-load → Manual fallback works
- [ ] Sub-agent fails → Error message clear, recovery path obvious
- [ ] Context file missing → Creates new one automatically
- [ ] Token limit approached → Warning provided, context management suggested
- [ ] Pattern drift high → Skill refresh prompted

---

## Final Validation

### System Completeness

- [ ] All 5 phases implemented
- [ ] All documentation created
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Ready for production use

### Success Criteria Met

- [ ] 74-83% token reduction achieved
- [ ] 3.8x session capacity improvement
- [ ] 100% automation (no manual reminders)
- [ ] Context persists across compaction
- [ ] All target metrics met or exceeded

### Documentation Complete

- [ ] User-facing documentation updated
- [ ] Technical documentation complete
- [ ] Test scenarios documented
- [ ] Troubleshooting guide available
- [ ] Examples provided

---

## Sign-Off

**Tested By**: **************\_\_\_**************
**Date**: **************\_\_\_**************
**Overall Status**: [ ] **PASS** / [ ] **FAIL**

**Notes**:

---

---

---

**Blockers** (if any):

---

---

**Recommendations**:

---

---

---

**Status**: Ready for Use
**Next**: Execute real-world testing, record actual results, compare to projections
