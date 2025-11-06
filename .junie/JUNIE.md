# Junie Code Integration Guide - ProjectPulse

**Version**: 2.0 (Protocol-Aligned)
**Last Updated**: 2025-11-05

---

## Quick Start

Just talk to me like you do with Claude Code — I follow the same guardrails and session protocol, but with Junie‑specific conventions.

Example intents:

```
"Draft an implementation plan for GET /api/issues with Zod validation"
"Refactor the Filters helper to reduce duplicate logic (no API changes)"
"Design tests for the search API and wire into CI"
```

---

## 🚨 CRITICAL: Mandatory Session Protocol (Same as Claude)

Before any work, I must follow the same 6-step protocol (includes Step 4.5 Verification Gate) defined for Claude Code.

- **Full Spec**: [.agent/MANDATORY_SESSION_PROTOCOL.md](.agent/MANDATORY_SESSION_PROTOCOL.md)
- **Quick Guide**: [.junie/SESSION_START_QUICK_GUIDE.md](.junie/SESSION_START_QUICK_GUIDE.md)

I will explicitly confirm each step in chat and persist artifacts in `.agent/task/`.

---

## Session Start Pattern (Junie)

### Starter Prompt (Copy-Paste This)

Paste this at the start of every Junie session:

```
MANDATORY PROTOCOL (JUNIE) — Read .agent/MANDATORY_SESSION_PROTOCOL.md and follow ALL steps.

Current phase: [copy from .agent/progress.md]
Current work: [copy from .agent/active-context.md]
Requirements: [copy from docs/13-Project-Plan.md]

ENFORCE:
- ✅ Step 1: Initialize session + load memory banks
- ✅ Step 2: Save plan BEFORE code
- ✅ Step 3: Consult experts
- ✅ Step 4: Checkpoints every 15K tokens
- ✅ Step 4.5: Verification gate (evidence-based)
- ✅ Step 5: Post-completion workflow + update memory banks

Confirm each step explicitly. If you skip ANY step, I will stop you.

Proceed with [phase name].
```

---

## What I Must Do (Per Protocol)

### STEP 1: INITIALIZATION

**Before writing ANY code:**

- [ ] **Read memory bank files (REQUIRED EVERY SESSION):**
  - [ ] `.agent/project-brief.md` - project goals, constraints, success criteria
  - [ ] `.agent/system-patterns.md` - architecture patterns, established conventions
  - [ ] `.agent/tech-context.md` - tech stack, dependencies, environment constraints
  - [ ] `.agent/active-context.md` - recent work, current focus, blockers
  - [ ] `.agent/progress.md` - overall progress, completion %, lessons learned
- [ ] Read project documentation:
  - [ ] `docs/13-Project-Plan.md` - Implementation roadmap and traceability matrix
  - [ ] `docs/12-Backlog.md` - User stories and backlog
- [ ] Create `.agent/task/current-session-[YYYYMMDD-HHMM]-junie.md`
  - Document: Current phase, goals, requirements from .agent/progress.md
  - Include: Token budget (200K), session start time, deliverables
- [ ] Read phase-specific `.agent/system/` reference files:
  - API work → `.agent/system/api-catalog.md`
  - Database work → `.agent/system/database-schema.md`
  - Component work → `.agent/system/component-patterns.md`

**Reading Path After Step 1:**

After initialization, load additional context based on phase type:

- **Implementation phases:** [docs/03-Architecture.md](docs/03-Architecture.md) → [docs/04-Data-and-Model-Spec.md](docs/04-Data-and-Model-Spec.md) → [docs/06-API/openapi.yaml](docs/06-API/openapi.yaml)
- **Planning phases:** [docs/01-PRD.md](docs/01-PRD.md) → [docs/02-SRS.md](docs/02-SRS.md) → [docs/12-Backlog.md](docs/12-Backlog.md)

See [docs/README.md](docs/README.md) for complete reading paths.

**REQUIRED CONFIRMATION:**

```
✅ STEP 1 COMPLETE (Junie): Session initialized at [timestamp]

Created: .agent/task/current-session-[YYYYMMDD-HHMM]-junie.md
Current phase: [phase name from .agent/progress.md]
Goals: [brief description of what needs to be done]
Memory banks loaded:
  ✓ project-brief.md (goals, constraints)
  ✓ system-patterns.md (architecture patterns)
  ✓ tech-context.md (tech stack)
  ✓ active-context.md (recent work, blockers)
  ✓ progress.md (completion %)
Token budget: [current]/200K (including memory banks: ~8-10K)
```

---

### STEP 2: PLAN CREATION

**After understanding requirements, create implementation plan:**

- [ ] Create implementation plan in conversation (use ExitPlanMode if in plan mode)
- [ ] Get user approval for the plan
- [ ] **IMMEDIATELY** save plan to `.agent/task/current-plan-junie.md`
  - Include: Overview, deliverables, implementation steps, success criteria
  - Single reusable file (overwrites previous Junie plan)
- [ ] Create `.agent/task/current-todos-junie.md` with full task list
  - Include: All tasks with checkboxes, progress percentage, token checkpoints
  - This file will be updated throughout session
- [ ] Create TodoWrite UI list (visual progress tracking)

**REQUIRED CONFIRMATION:**

```
✅ STEP 2 COMPLETE (Junie): Plan saved to current-plan-junie.md, todos saved to current-todos-junie.md

Plan overview: [1-2 sentence summary]
Total tasks: [X]
Files to create/modify: [list]
Estimated tokens: [rough estimate]
```

---

### STEP 3: EXPERT CONSULTATION

**Before implementing new architectures or complex features, consult expert agents:**

**Which Expert to Invoke:**

- [ ] **react-expert** - Component architecture decisions
  - Component composition and prop patterns
  - Custom hooks design
  - State management decisions
  - Performance optimization (memo, useCallback, useMemo)

- [ ] **next-js-expert** - Next.js architecture decisions
  - Server vs Client Component decisions
  - Data fetching strategy (Server Components, API routes)
  - Caching and revalidation strategy
  - Route structure and file organization

- [ ] **prisma-expert** - Database schema & query decisions
  - Database schema design and relations
  - Query optimization and N+1 prevention
  - Migration strategy
  - PostgreSQL-specific features (tsvector, pgvector, JSONB)

**When Experts Required:**

- New architectures (component hierarchies, state patterns)
- Complex features (multi-step workflows, performance-critical)
- Database changes (schema design, migration strategy)

**When Experts Optional:**

- Routine CRUD following established patterns
- UI updates matching existing conventions
- Minor refactors within established architecture

**REQUIRED CONFIRMATION (for each expert consulted):**

```
✅ STEP 3 COMPLETE (Junie): Consulted [expert-name] for [decision-topic]

Expert recommendation: [1-2 sentence summary of guidance]
Implementation approach: [what I'll do based on expert advice]
```

---

### STEP 4: PROGRESS CHECKPOINTS

**Token tracking is MANDATORY. Save progress at regular intervals.**

**Token Counter Reference:**

Monitor system warnings: **"Token usage: X/200000"**

- **15K, 30K, 45K, 60K, 75K, 90K tokens** → Checkpoint required
- **140-150K tokens** → Manual save warning (approaching limits)
- **180K+ tokens** → Danger zone (save immediately)

**Required Actions at Each Checkpoint:**

- [ ] Update `.agent/task/current-session-[timestamp]-junie.md`
  - Add progress summary: What's been completed since last checkpoint
  - Note any blockers or issues encountered
  - Update token usage
- [ ] Update `.agent/task/current-todos-junie.md`
  - Mark completed tasks with [x]
  - Update progress percentage
  - Note current task in progress
- [ ] Update TodoWrite UI to match file state

**REQUIRED CONFIRMATION:**

```
✅ CHECKPOINT (Junie) at [X]K tokens: Progress saved

Completed since last checkpoint:
- [task 1]
- [task 2]

Current progress: [X]/[Y] tasks complete ([Z]%)
Updated: current-session-junie.md, current-todos-junie.md
Next checkpoint: [X+15]K tokens
```

---

### STEP 4.5: VERIFICATION GATE

**🚨 CRITICAL: Before marking ANY work complete, verify ALL plan requirements with evidence.**

**Why This Step Exists:**

Protocol can trust documentation claims without verifying actual results. Step 4.5 adds evidence-based verification.

**Required Actions:**

1. **Re-read Success Criteria** from `.agent/task/current-plan-junie.md`
2. **Verify EACH Requirement** with concrete evidence:
   - **Database work**: `SELECT COUNT(*)` queries showing expected data
   - **File work**: `ls` commands showing files exist, `head` showing content
   - **Feature work**: `pnpm test` showing tests pass
   - **Integration work**: `curl` showing endpoints work
3. **Document Results** in `.agent/task/current-session-[timestamp]-junie.md`:

   ```markdown
   ## Step 4.5: Verification Results

   ### Requirement 1: [Description]

   ✅ Evidence: [Query/Command output]
   Status: PASS

   ### Requirement 2: [Description]

   ❌ Evidence: [Query/Command output]
   Status: FAIL - [gap description]
   ```

4. **Apply Fail-Fast Rule**:
   - If ANY requirement fails → mark work as IN PROGRESS
   - Update current-plan-junie.md with remaining items
   - DO NOT proceed to Step 5
   - Continue work until ALL requirements pass

**REQUIRED CONFIRMATION:**

```
✅ STEP 4.5 COMPLETE (Junie): All [X] requirements verified with evidence

Verification summary:
- Requirement 1: ✅ PASS - [brief evidence]
- Requirement 2: ✅ PASS - [brief evidence]
[...list all requirements...]

Evidence documented in: .agent/task/current-session-[timestamp]-junie.md
All requirements met. Proceeding to Step 5.
```

**Verification Template:** `.agent/templates/verification-checklist.md`

**See:** `.agent/MANDATORY_SESSION_PROTOCOL.md` Step 4.5 for detailed examples.

---

### STEP 5: POST-COMPLETION

**After feature implementation complete, BEFORE committing code:**

#### Required Project Documentation Updates

**Update project tracking files (when stories/phases complete):**

- [ ] Update `docs/13-Project-Plan.md` traceability matrix:
  - Mark completed user stories: "Not Started" → "Complete" (e.g., US-001, US-002)
  - Update sprint checkpoints: "Sprint 1 End: ✅ Foundation operational" (when sprint completes)
  - Update phase gates: "Phase A Gate: ✅ Can agent complete 6-step protocol with verification?" (when phase completes)
  - Update weekly milestones as they are achieved

- [ ] Update `docs/12-Backlog.md` (ONLY if scope/priorities changed):
  - Add new user stories if requirements expanded
  - Update MoSCoW priorities if changed (e.g., "Should" → "Must")
  - Update story points if re-estimated after implementation
  - Update dependencies if new relationships discovered

#### Required Memory Bank Updates

**Update memory banks to reflect session work (REQUIRED EVERY SESSION):**

- [ ] Update `.agent/active-context.md`:
  - What was just completed (Junie's work)
  - Current focus for next session
  - Recent technical decisions made
  - Current blockers (if any)

- [ ] Update `.agent/progress.md` (if milestone/phase complete):
  - Overall completion percentage
  - Update phase/day status (mark complete)
  - Add lessons learned
  - Update velocity metrics

- [ ] Update `.agent/system-patterns.md` (if new patterns established):
  - Add new architecture patterns discovered
  - Document new conventions established
  - Update existing patterns if refined

- [ ] Update `.agent/tech-context.md` (if stack changed):
  - Add new dependencies
  - Document new environment constraints
  - Update performance targets if changed

#### Required Sub-Agent Invocations

**If new patterns were created:**

- [ ] Invoke `synthesize-docs` sub-agent
  - Generates SOPs from implemented patterns
  - Saves to `.agent/sops/[topic].md`
  - Updates skills if needed

**If system architecture changed:**

- [ ] Invoke `map-system` sub-agent
  - Updates `.agent/system/api-catalog.md` (if new endpoints)
  - Updates `.agent/system/database-schema.md` (if schema changed)
  - Updates `.agent/system/component-patterns.md` (if new patterns)

#### Required Git Commits

**Documentation commit (FIRST):**

- [ ] Stage: `git add .agent/ docs/ COMPLETION_*.md`
- [ ] Commit: `git commit -m "[junie] docs: Update documentation and memory banks after [phase]"`

**Code commit (SECOND):**

- [ ] Stage code files: `git add [code files]`
- [ ] Commit: `git commit -m "[junie] feat: [feature description]"`

**REQUIRED CONFIRMATION:**

```
✅ COMPLETION (Junie): All documentation updated and committed

Project docs updated:
- docs/13-Project-Plan.md (US-XXX marked complete)
- docs/12-Backlog.md (scope changes if any)
- Completion doc created (if applicable)

Memory banks updated:
- active-context.md (Junie's recent work, next focus)
- progress.md (completion %, lessons learned)
- system-patterns.md (new patterns if any)
- tech-context.md (stack changes if any)

Sub-agent invocations:
- synthesize-docs → SOP saved (if applicable)
- map-system → system docs updated (if applicable)

Git commits:
- [hash] [junie] docs: Update documentation and memory banks after [phase]
- [hash] [junie] feat: [feature description]

All quality gates passed ✅
```

---

## Memory Bank System (MANDATORY)

**🚨 REQUIRED BY PROTOCOL: These files must be read EVERY session (Step 1) and updated EVERY session (Step 5).**

See [.agent/MANDATORY_SESSION_PROTOCOL.md](.agent/MANDATORY_SESSION_PROTOCOL.md) Step 1 and Step 5 for requirements.

**Structured context files for efficient knowledge retrieval:**

### Core Memory Bank Files (.agent/)

1. **[project-brief.md](.agent/project-brief.md)** - WHAT we're building and WHY
   - Core requirements, goals, success criteria
   - User personas, target audience
   - Quality standards, constraints
   - Current status and milestones

2. **[system-patterns.md](.agent/system-patterns.md)** - HOW we build
   - Architecture patterns (Server/Client Components)
   - Database patterns (Prisma queries, optimization)
   - API patterns (endpoints, validation, error handling)
   - Styling patterns (Tailwind, neumorphic design)
   - Testing patterns (Jest, RTL, Playwright)

3. **[tech-context.md](.agent/tech-context.md)** - Technical stack
   - Dependencies (Next.js, Prisma, Zod, etc.)
   - Environment setup, configuration
   - Constraints and limitations
   - Browser support, performance targets
   - Troubleshooting common issues

4. **[active-context.md](.agent/active-context.md)** - Current focus
   - What we're working on RIGHT NOW
   - Recent changes and commits (Claude AND Junie work)
   - Remaining tasks for current phase
   - Blockers and waiting items

5. **[progress.md](.agent/progress.md)** - Progress tracking
   - What's done, what's left
   - Metrics (velocity, quality gates)
   - Risk assessment
   - Lessons learned

### When to Read Which File

```
Need project requirements?          → project-brief.md
Need architectural patterns?        → system-patterns.md
Need tech stack details?            → tech-context.md
Need current task context?          → active-context.md
Need progress overview?             → progress.md
```

### Memory Bank Benefits

- 🎯 **Targeted Loading**: Read only what you need (vs loading everything)
- 🔄 **Auto-Updates**: Sub-agents maintain these files automatically
- 💾 **Token Efficient**: ~3-5K tokens per file vs 30K+ for full context
- 📊 **Structured**: Consistent format makes information easy to find

---

## Workflow Conventions (Junie)

### Junie-Specific Naming

- **Branch naming**: `feature/junie/<topic>`
- **Commit prefix**: `[junie] <concise message>`
- **Artifacts folder**: `.agent/task/*-junie.*` for session/plan/todos
  - `.agent/task/current-session-[YYYYMMDD-HHMM]-junie.md`
  - `.agent/task/current-plan-junie.md`
  - `.agent/task/current-todos-junie.md`

### Coordination with Claude

- **Scope control**: Non‑disruptive; coordinate with Claude for overlapping tasks
- **Memory banks**: SHARED with Claude (use same files, note "Junie's work" in active-context.md)
- **Session files**: SEPARATE from Claude (use `-junie` suffix)

### Technical Conventions

- **Port policy**: Dev server MUST bind to 0.0.0.0:3000 (see CLAUDE.md)
- **Database**: Interact via app API routes only (no direct DB from scripts)
- **Tests**: New/changed code should include tests when applicable (follow Testing & QA docs)
- **Type safety**: TS strict, Zod input validation
- **Lint/format**: Type‑check pass in CI
- **API contracts**: No breaking changes unless approved

---

## Reusing Claude's Agents & Skills

### Agents Directory

- **Location**: `.claude/agents/*.md`
- **Usage**: Treat as expert guidance (read their .md files)
- **Do NOT modify**: Junie only reads them for context
- **Available experts**:
  - `react-expert` - Component architecture
  - `next-js-expert` - Server/Client decisions
  - `prisma-expert` - Database design
  - `devhub-architect` - Architecture decisions (legacy, prefer specific experts)
  - `devhub-mcp-specialist` - MCP integration (as needed)

### Skills Directory

- **Location**: `.claude/skills/**`
- **Usage**: Use as procedural checklists
- **Skills Index**: `.claude/SKILLS_INDEX.md` — discoverability map
- **Auto-loading**: Skills load based on phase keywords (same as Claude)

### Orchestrator/Ops

- **Do NOT modify**: `.claude/*.py` files
- **Junie only reads** them for context

---

## MCP & Tools (Current Decision)

- **Do NOT implement or modify** `apps/mcp-server` for now (owner directive)
- **Future target**: A single product MCP with ~42 tools per docs/README.md
- **We will revisit** in product phase

---

## Quality Gates

**Every Junie session must meet:**

- ✅ Type safety (TS strict), Zod input validation
- ✅ Lint, format, type‑check pass in CI
- ✅ No breaking changes to API contracts unless approved
- ✅ Document decisions in `.agent/task/*-junie.md`
- ✅ Tests for new/changed code (when applicable)
- ✅ Memory banks updated (Step 5)

---

## Finding Information

### Project Documentation (Main)

**Looking for requirements?** → [docs/01-PRD.md](docs/01-PRD.md) or [docs/02-SRS.md](docs/02-SRS.md)
**Looking for architecture?** → [docs/03-Architecture.md](docs/03-Architecture.md)
**Looking for API spec?** → [docs/06-API/openapi.yaml](docs/06-API/openapi.yaml)
**Looking for project plan?** → [docs/13-Project-Plan.md](docs/13-Project-Plan.md)
**Looking for all docs?** → [docs/README.md](docs/README.md)

### Agent Context (.agent/)

**Looking for patterns?** → [.agent/system-patterns.md](.agent/system-patterns.md)
**Looking for tech details?** → [.agent/tech-context.md](.agent/tech-context.md)
**Looking for current work?** → [.agent/active-context.md](.agent/active-context.md)
**Looking for progress?** → [.agent/progress.md](.agent/progress.md)
**Looking for procedures?** → [.agent/sops/](.agent/sops/)
**Looking for system docs?** → [.agent/system/](.agent/system/)

---

## Quick Reference

### Session Start Checklist

```
□ STEP 1: Initialize + load memory banks
  Confirm: "✅ STEP 1 COMPLETE (Junie): Session initialized at [timestamp]"
  Memory banks loaded: ✓ project-brief.md, system-patterns.md, tech-context.md, active-context.md, progress.md

□ STEP 2: Plan & Save
  Confirm: "✅ STEP 2 COMPLETE (Junie): Plan saved to current-plan-junie.md, todos saved to current-todos-junie.md"

□ STEP 3: Consult Experts
  Confirm: "✅ STEP 3 COMPLETE (Junie): Consulted [expert] for [topic]"

□ STEP 4: Checkpoints every 15K tokens
  Confirm: "✅ CHECKPOINT (Junie) at [X]K tokens: Progress saved"

□ STEP 4.5: Verification gate (evidence-based)
  Confirm: "✅ STEP 4.5 COMPLETE (Junie): All [X] requirements verified with evidence"

□ STEP 5: Post-Completion + update memory banks
  Confirm: "✅ COMPLETION (Junie): All documentation updated and committed"
  Memory banks updated: ✓ active-context.md, progress.md, system-patterns.md, tech-context.md
```

### Common Tasks

**Need to know API structure?**
→ Read [.agent/system/api-catalog.md](.agent/system/api-catalog.md)

**Need to know database schema?**
→ Read [.agent/system/database-schema.md](.agent/system/database-schema.md)

**Port configuration broken?**
→ Follow [.agent/sops/port-troubleshooting.md](.agent/sops/port-troubleshooting.md)

**Creating new branch?**
→ Follow [.agent/sops/git-workflow.md](.agent/sops/git-workflow.md)

---

## Acknowledgements

This guide mirrors `CLAUDE.md` expectations while adapting names and conventions for Junie. It follows the same mandatory 5-step protocol with Memory Bank System to ensure consistency across both AI assistants.

**Key Differences from Claude:**

1. **Junie-specific naming**: `-junie` suffix on session files, `[junie]` commit prefix
2. **Shared memory banks**: Both agents update the same .agent/ memory bank files
3. **Coordination required**: Non-disruptive scope, note "Junie's work" in active-context.md

**Protocol Status:** ACTIVE
**Version:** 2.1 (Protocol v2.0 with Verification Gate)
**Last Updated:** 2025-11-06
