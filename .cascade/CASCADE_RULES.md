# Cascade Rules Configuration

**Purpose:** Complete .windsurfrules file content for Moksha DevHub

---

## .windsurfrules File

**Location:** `f:\Web_Projects\AI_HUB\.windsurfrules`

```markdown
# Moksha DevHub - Cascade Configuration

# Version: 1.0 | Last Updated: 2025-10-28

When asked to design UI & frontend interface:
You are superdesign, integrated into Windsurf as part of Super Design extension.
Use Flowbite library, avoid indigo/blue unless specified, MUST generate responsive designs.
Output design files in '.superdesign/design*iterations' folder as {design_name}*{n}.html.
Font: Use Google Fonts (JetBrains Mono, Inter, Roboto, etc.).
Always use tools for write/edit, never just output in message.

---

## MOKSHA DEVHUB AGENT SYSTEM

### SOURCE OF TRUTH

All agents reason from:

- docs/01-ARCHITECTURE.md - Complete system architecture
- docs/02-DATABASE-SCHEMA.md - Database schema and Prisma models
- docs/03-MCP-SPECIFICATION.md - MCP specification
- AGENTS.md - Agent rules and workflows
- .agent/ directory - Memory bank and SOPs

If conflicts exist, docs/ is authoritative.

### GOLDEN RULES (NON-NEGOTIABLE)

1. **[R-DOC-001] Documentation Authority:** All implementations align with docs/ architecture
2. **[R-DATA-001] Data-Driven Development:** No hardcoded values; use database or config
3. **[R-TS-001] Type Safety:** Strict TypeScript, no `any` types
4. **[R-NEXT-001] Server Components First:** Use React Server Components by default
5. **[R-SEC-001] Prisma Parameterized:** No raw SQL string interpolation (SQL injection prevention)
6. **[R-TEST-001] Testing Required:** All features must have tests (80%+ coverage)
7. **[R-MCP-001] MCP Pattern:** MCP server calls Next.js API (not direct database)
8. **[R-PRIVACY-001] Local-First:** All data stored locally, no cloud dependencies

### MANDATORY SESSION PROTOCOL

Every session MUST follow this 5-step protocol:

**STEP 1: INITIALIZATION (Before any code)**

- Read STATUS.md and DEVELOPMENT_PLAN.md
- Create .agent/task/current-session-[YYYYMMDD-HHMM].md
- Load relevant context from .agent/ memory bank
- CONFIRM: "✅ STEP 1 COMPLETE: Session initialized at [timestamp]"

**STEP 2: PLAN CREATION (Before implementation)**

- Create implementation plan
- Get user approval
- IMMEDIATELY save to .agent/task/current-plan.md
- Create .agent/task/current-todos.md
- CONFIRM: "✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md"

**STEP 3: EXPERT CONSULTATION (For technical decisions)**

- Invoke react-expert for component architecture
- Invoke next-js-expert for Server/Client decisions
- Invoke prisma-expert for database design
- Read agent template from memory + apply structured prompt
- Save plan to .agent/task/[expert]-[topic]-[timestamp].md
- CONFIRM: "✅ STEP 3 COMPLETE: Consulted [expert] for [topic]"

**STEP 4: PROGRESS CHECKPOINTS (Every 15K tokens)**

- At 15K, 30K, 45K, 60K, 75K, 90K tokens
- Update .agent/task/current-session.md
- Update .agent/task/current-todos.md
- CONFIRM: "✅ CHECKPOINT at [X]K tokens: Progress saved"

**STEP 5: POST-COMPLETION (Before final commit)**

- Create COMPLETION\_[PHASE].md
- Update STATUS.md and DEVELOPMENT_PLAN.md
- Invoke synthesize-docs if new patterns created
- Invoke map-system if architecture changed
- Commit documentation first, then code
- CONFIRM: "✅ STEP 5 COMPLETE: All documentation updated and committed"

### TDD WORKFLOW (MANDATORY FOR ALL TASKS)

Every feature implementation MUST follow Test-Driven Development:

1. **🔴 RED Phase:** Write failing test first
2. **🟢 GREEN Phase:** Write minimal code to pass test
3. **🔵 REFACTOR Phase:** Improve code quality while keeping tests passing

This applies to:

- API endpoints
- React components
- Database queries
- Utility functions
- ALL implementation tasks

### ARCHITECTURE PATTERNS

**Component Architecture:**

- Default: Server Components (no "use client")
- Use Client Components only for: interactivity, hooks, browser APIs, event listeners
- Hybrid pattern: Server page → Client interactive components

**Database Patterns:**

- Prisma for ALL database access
- Use select/include for optimization (only fetch needed fields)
- Parameterized queries only (no string interpolation)
- Connection pooling: PrismaClient singleton pattern

**API Patterns:**

- Zod validation for all inputs
- Standard response format: { data: T } | { error: string }
- Error handling: try-catch with proper HTTP status codes
- Pagination pattern: { page, limit, total, hasMore, data }

**Testing Patterns:**

- Jest for unit tests
- React Testing Library for components
- Playwright (via MCP) for E2E tests
- 80%+ coverage required

### GIT WORKFLOW (3-TRACK STRATEGY)

**Branch naming:**

- `api/*` - Backend/API development
- `ui/*` - Frontend/UI development
- `feature/*` - Full-stack features

**Commit format:**

- feat: New feature
- fix: Bug fix
- refactor: Code refactoring
- test: Add tests
- docs: Documentation update

**Commit order:**

1. Documentation commit FIRST
2. Code commit SECOND

### QUALITY GATES

Before marking any task complete:

- ✅ TypeScript: No errors, no `any` types
- ✅ Linting: pnpm lint passes
- ✅ Build: pnpm build succeeds
- ✅ Tests: pnpm test passes (80%+ coverage)
- ✅ Security: No SQL injection, no XSS vulnerabilities
- ✅ Documentation: Updated STATUS.md, DEVELOPMENT_PLAN.md

### SKILLS AUTO-LOADING

Based on phase keywords, automatically load relevant skills:

**Keywords → Skills mapping:**

- "API", "endpoint", "route" → .claude/skills/moksha-devhub/api-patterns.md
- "Component", "UI", "page" → .claude/skills/moksha-devhub/component-patterns.md
- "Database", "Prisma", "query" → .claude/skills/moksha-devhub/database-patterns.md
- "Test", "testing" → .claude/skills/moksha-devhub/testing-patterns.md
- "Port", "3000" → .claude/skills/moksha-devhub/port-config.md
- "Git", "branch", "commit" → .claude/skills/moksha-devhub/git-workflow.md

Load skill by reading full file content when keywords detected.

### AGENT SIMULATION

When specialized expertise needed, use agent templates from memory:

**Implementation Agents:**

- devhub-architect: "Design the X system"
- devhub-fullstack: "Implement X feature"
- devhub-testing: "Write tests for X"
- devhub-auditor: "Review X for quality"
- devhub-mcp-specialist: "Design MCP tool for X"

**Expert Agents (REQUIRED for Step 3):**

- react-expert: "Design component for X"
- next-js-expert: "Server/Client decision for X"
- prisma-expert: "Design schema for X"

**Research Agents:**

- explore-codebase: "Find all X patterns"
- analyze-architecture: "How does X work?"
- synthesize-docs: "Generate SOP for X"
- map-system: "Update system docs"

**How to invoke:**

1. Retrieve agent template from memory system
2. Apply structured prompt with current context
3. Save output to .agent/task/[agent]-[topic]-[timestamp].md
4. Return confirmation with summary

### MEMORY BANK STRUCTURE

**Core context files (.agent/):**

- project-brief.md - WHAT & WHY (requirements, goals)
- system-patterns.md - HOW we build (architecture patterns)
- tech-context.md - Tech stack and setup
- active-context.md - Current focus (READ EVERY SESSION)
- progress.md - Progress tracking and metrics

**Task tracking (.agent/task/):**

- current-session-[timestamp].md - Real-time session tracking
- current-plan.md - Approved implementation plan
- current-todos.md - Task list with progress
- [agent]-[topic]-[timestamp].md - Agent consultation reports

**System docs (.agent/system/):**

- api-catalog.md - All API endpoints
- database-schema.md - Prisma schema summary
- component-patterns.md - React conventions
- mcp-tools-guide.md - MCP usage examples

**SOPs (.agent/sops/):**

- api-route-creation.md - Standard API pattern
- server-component-data-fetching.md - Prisma optimization
- port-troubleshooting.md - Port configuration fixes
- git-workflow.md - Branch management
- [Plus 11 more procedures]

### TOKEN OPTIMIZATION STRATEGY

**Target: 70%+ reduction (from 21K baseline to ~6K)**

**Optimization techniques:**

1. Load skill frontmatter only (20 tokens per skill)
2. Read full skill content only when keyword matches
3. Use memory retrieval instead of file reading when possible
4. Agent consultations in isolated analysis (don't pollute main context)
5. Checkpoint updates minimal (200 tokens per checkpoint)

**Token budget tracking:**

- Monitor token usage continuously
- Checkpoints at 15K intervals
- Warning at 140-150K tokens (approaching 200K limit)

### FILE PERMISSIONS

**Allow:**

- Read: All files
- Write: apps/, packages/, docs/, .agent/, .cascade/
- Bash: pnpm, npm, docker, git, python

**Deny:**

- Write: node_modules/, .next/, dist/, .env
- Destructive: Commands that delete data

**Ask first:**

- git push
- docker-compose down
- prisma migrate reset
- pnpm remove

### DEBUGGING WORKFLOW

When bugs encountered:

1. Use systematic-debugging-web skill (layer isolation)
2. If complex, use root-cause-tracing-fullstack skill
3. Add regression test
4. Verify fix with testing

### COMPLETION CRITERIA

Feature complete when:

- ✅ All Golden Rules followed
- ✅ All protocol steps completed
- ✅ Quality gates passed
- ✅ Tests achieve 80%+ coverage
- ✅ Code reviewed (auditor patterns applied)
- ✅ Documentation updated
- ✅ Commits clean (docs first, code second)

---

## HOW TO USE

**Session start:**
```

User: "Start session for Phase 3 Day 5"
Cascade: [Follows Step 1 protocol automatically]

```

**During work:**
```

User: "Implement POST /api/issues"
Cascade: [TDD workflow: Red → Green → Refactor]

```

**Need expertise:**
```

User: "Need component architecture advice"
Cascade: [Invokes react-expert template from memory]

```

**Session end:**
```

User: "Complete this phase"
Cascade: [Follows Step 5 protocol: docs → commits]

```

---

## ENFORCEMENT

**Missing protocol confirmations = VIOLATION**

User must stop work and enforce:
- "You skipped Step 2. Save the plan RIGHT NOW."
- "Where's the Step 3 confirmation? Consult expert NOW."
- "You're at 50K tokens with ZERO checkpoints. Update files NOW."

Protocol is MANDATORY, not optional.

---

**This configuration ensures Cascade follows the same workflow quality as Claude Code.**
```

---

## Usage Notes

1. **Save this content** to `.windsurfrules` file in project root
2. **Restart Windsurf** to load new rules
3. **Test** by starting a session with protocol
4. **Validate** that confirmations appear for each step

The rules system will automatically enforce:

- Golden Rules compliance
- Mandatory protocol steps
- TDD workflow
- Quality gates
- Token optimization
- Documentation requirements
