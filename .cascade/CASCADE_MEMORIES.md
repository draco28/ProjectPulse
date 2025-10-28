# Cascade Memories Configuration

**Purpose:** Define all 30 memories for Moksha DevHub workflow integration

---

## Memory Creation Guide

Create each memory using create_memory tool with:

- Title, Content, Tags, CorpusNames: ["draco28/ProjectPulse"]

Total: 30 memories across 5 categories

---

## CATEGORY 1: GOLDEN RULES (8 memories)

### 1. Documentation Authority [R-DOC-001]

**Title:** Golden Rule: Documentation Authority [R-DOC-001]  
**Content:** All implementations align with docs/ architecture. Source: docs/01-ARCHITECTURE.md, docs/02-DATABASE-SCHEMA.md, docs/03-MCP-SPECIFICATION.md. Docs are authoritative.  
**Tags:** golden_rules, documentation, architecture

### 2. Data-Driven Development [R-DATA-001]

**Title:** Golden Rule: Data-Driven Development [R-DATA-001]  
**Content:** No hardcoded values. Use database or config files. Never hardcode: status values, priorities, modules, colors, business logic.  
**Tags:** golden_rules, data_driven, database

### 3. Type Safety [R-TS-001]

**Title:** Golden Rule: Type Safety [R-TS-001]  
**Content:** Strict TypeScript. No any types. Explicit return types. Props typed with interfaces. Zod for runtime validation.  
**Tags:** golden_rules, typescript, type_safety

### 4. Server Components First [R-NEXT-001]

**Title:** Golden Rule: Server Components First [R-NEXT-001]  
**Content:** Default to Server Components. Client only for: interactivity, hooks, browser APIs, events. Hybrid: Server fetches → Client renders.  
**Tags:** golden_rules, nextjs, server_components

### 5. Prisma Parameterized [R-SEC-001]

**Title:** Golden Rule: Prisma Parameterized [R-SEC-001]  
**Content:** No raw SQL string interpolation. Use parameterized Prisma queries. Never use $queryRawUnsafe. Always use $queryRaw with template literals.  
**Tags:** golden_rules, prisma, security, sql_injection

### 6. Testing Required [R-TEST-001]

**Title:** Golden Rule: Testing Required [R-TEST-001]  
**Content:** All features need tests with 80%+ coverage. Jest for unit, RTL for components, Playwright for E2E. TDD mandatory.  
**Tags:** golden_rules, testing, tdd, coverage

### 7. MCP Pattern [R-MCP-001]

**Title:** Golden Rule: MCP Pattern [R-MCP-001]  
**Content:** MCP server calls Next.js API, not direct database. Maintains separation. API endpoints are source of truth.  
**Tags:** golden_rules, mcp, api, architecture

### 8. Local-First [R-PRIVACY-001]

**Title:** Golden Rule: Local-First [R-PRIVACY-001]  
**Content:** All data stored locally. No cloud dependencies. PostgreSQL local, no external APIs for core features.  
**Tags:** golden_rules, privacy, local_first

---

## CATEGORY 2: AGENT TEMPLATES (12 memories)

### 9. Agent: devhub-architect

**Title:** Agent Template: devhub-architect  
**Content:** Architecture and design specialist. Use for: system design, database schema, MCP structure. Keywords: design, architecture, schema. Output: .agent/task/architect-[topic]-[timestamp].md. Return confirmation with summary.  
**Tags:** agent_template, architect, design

### 10. Agent: devhub-fullstack

**Title:** Agent Template: devhub-fullstack  
**Content:** Implementation specialist. Use for: coding, API routes, components. Keywords: implement, create, build. Follows TDD: Red-Green-Refactor. Output: Implemented code files.  
**Tags:** agent_template, fullstack, implementation

### 11. Agent: devhub-testing

**Title:** Agent Template: devhub-testing  
**Content:** Testing and QA specialist. Use for: test creation, coverage, E2E. Keywords: test, testing, coverage. Uses testing-patterns skill. Output: Test files in **tests**/.  
**Tags:** agent_template, testing, qa

### 12. Agent: devhub-auditor

**Title:** Agent Template: devhub-auditor  
**Content:** Code review and quality specialist. Use for: security review, performance audit, accessibility. Keywords: review, audit, security. Uses verification-before-completion skill.  
**Tags:** agent_template, auditor, quality

### 13. Agent: devhub-mcp-specialist

**Title:** Agent Template: devhub-mcp-specialist  
**Content:** MCP integration specialist. Use for: MCP tool design, resources, prompts. Keywords: MCP, tool, integration. Output: MCP specification in .agent/task/.  
**Tags:** agent_template, mcp, integration

### 14. Agent: react-expert

**Title:** Agent Template: react-expert  
**Content:** React 18+ component specialist. Use for: component architecture, hooks, performance. Keywords: component, React, hooks. Required for Step 3 protocol. Read current-session.md first. Output: .agent/task/react-[topic]-[timestamp].md with detailed plan. Return: Consulted react-expert for [topic].  
**Tags:** agent_template, react, expert, components

### 15. Agent: next-js-expert

**Title:** Agent Template: next-js-expert  
**Content:** Next.js 14 App Router specialist. Use for: Server/Client decisions, data fetching, routing. Keywords: Next.js, server, routing. Required for Step 3 protocol. Output: .agent/task/nextjs-[topic]-[timestamp].md.  
**Tags:** agent_template, nextjs, expert, app_router

### 16. Agent: prisma-expert

**Title:** Agent Template: prisma-expert  
**Content:** Database and Prisma specialist. Use for: schema design, query optimization, migrations. Keywords: database, Prisma, schema, query. Required for Step 3 protocol. Output: .agent/task/prisma-[topic]-[timestamp].md with schema recommendations.  
**Tags:** agent_template, prisma, expert, database

### 17. Agent: explore-codebase

**Title:** Agent Template: explore-codebase  
**Content:** Codebase scanning specialist. Use for: find patterns, scan repo. Keywords: find all, scan. Uses grep_search extensively. Output: .agent/task/explore-[topic]-[timestamp].md with findings summary.  
**Tags:** agent_template, explore, research, codebase

### 18. Agent: analyze-architecture

**Title:** Agent Template: analyze-architecture  
**Content:** System flow analysis specialist. Use for: trace data flow, how does X work. Keywords: how does, trace, analyze. Reads multiple files to understand flows. Output: .agent/task/architecture-[topic]-[timestamp].md with flow diagrams.  
**Tags:** agent_template, analyze, architecture, research

### 19. Agent: synthesize-docs

**Title:** Agent Template: synthesize-docs  
**Content:** Documentation generation specialist. Use for: SOP creation after features. Invoked in Step 5 protocol if new patterns created. Reviews implementation, extracts patterns, generates markdown SOPs. Output: .agent/sops/[topic].md.  
**Tags:** agent_template, documentation, sops, synthesis

### 20. Agent: map-system

**Title:** Agent Template: map-system  
**Content:** System documentation maintenance specialist. Use for: update API catalog, database schema docs, component patterns. Invoked in Step 5 if architecture changed. Scans Prisma schema, API routes, components. Updates .agent/system/ files.  
**Tags:** agent_template, mapping, system_docs, maintenance

---

## CATEGORY 3: SKILLS INDEX (1 memory)

### 21. Skills Keyword Mapping

**Title:** Skills Index - Keyword to File Mapping  
**Content:**  
API keywords → .claude/skills/moksha-devhub/api-patterns.md  
Component keywords → .claude/skills/moksha-devhub/component-patterns.md  
Database keywords → .claude/skills/moksha-devhub/database-patterns.md  
Testing keywords → .claude/skills/moksha-devhub/testing-patterns.md  
Port keywords → .claude/skills/moksha-devhub/port-config.md  
Git keywords → .claude/skills/moksha-devhub/git-workflow.md  
Animation keywords → .claude/skills/moksha-devhub/animation-patterns.md  
UI keywords → .claude/skills/moksha-devhub/ui-generation-workflow.md  
SuperDesign keywords → .claude/skills/moksha-devhub/superdesign-ui-generator.md  
Debugging keywords → .claude/skills/debugging/systematic-debugging-web.md  
TDD keywords → .claude/skills/testing/test-driven-development-web.md  
Validation keywords → .claude/skills/validation/verification-before-completion.md  
Defense keywords → .claude/skills/validation/defense-in-depth-web.md  
**Tags:** skills_index, auto_loading, keywords

---

## CATEGORY 4: PROJECT CONTEXT (5 memories)

### 22. Project Brief

**Title:** Moksha DevHub - Project Brief  
**Content:** WHAT: Full-stack web app for managing dev tasks, issues, knowledge, wiki, security scans. WHY: Streamline dev workflow with AI integration. STACK: Next.js 14, PostgreSQL 16, Prisma, TypeScript. GOALS: Local-first, type-safe, tested, MCP-integrated. STATUS: Week 1.5 Phase 3 (UI transformation). Current: 37.5% complete.  
**Tags:** project_context, brief, requirements, goals

### 23. System Patterns

**Title:** Moksha DevHub - System Architecture Patterns  
**Content:** Server Components default. Prisma for all DB access with select/include optimization. API format: {data: T} or {error: string}. Zod validation. PrismaClient singleton. Pagination: {page, limit, total, hasMore, data}. Neumorphic Coral theme (locked). Git: 3-track strategy (api/_, ui/_, feature/\*).  
**Tags:** project_context, patterns, architecture, conventions

### 24. Tech Context

**Title:** Moksha DevHub - Technology Stack  
**Content:** Next.js 14.1.0 (App Router), React 18.2.0, TypeScript 5.x strict, PostgreSQL 16 + pgvector, Prisma 5.9.0, Tailwind 3.4.1, shadcn/ui, Jest, RTL, Playwright. Docker Compose for local dev. pnpm package manager. Port 3000 required. Node 18+.  
**Tags:** project_context, tech_stack, dependencies, setup

### 25. Active Context

**Title:** Moksha DevHub - Active Context (Current Phase)  
**Content:** PHASE: Week 1.5 Phase 3 Day 4 - Issue Detail Page. NEXT TASK: Implement issue detail page with Server Components, comment system, timeline, status controls. WAITING: Mockup from user. COMPLETED: Dashboard (100%), Issues List (100%). REMAINING: 5 pages (Knowledge, Wiki, Security, Personas, Command Palette). Update this after each phase completion.  
**Tags:** project_context, active, current_phase, wip

### 26. Progress Tracking

**Title:** Moksha DevHub - Progress and Metrics  
**Content:** Week 1: 100% complete (5 days, ~17 hours). Week 1.5: 37.5% complete (3/8 days). Velocity: 57% faster than estimated. Quality: 0 TS errors, 0 lint warnings, 91/91 E2E tests passing. Coverage: ~60% (target 80%). Token optimization: 74% reduction via skills. Next milestone: Complete Phase 3 (5 pages).  
**Tags:** project_context, progress, metrics, velocity

---

## CATEGORY 5: SESSION PROTOCOL (4 memories)

### 27. Protocol Step 1: Initialize

**Title:** Session Protocol - Step 1: Initialize  
**Content:** BEFORE any code: Read STATUS.md and DEVELOPMENT_PLAN.md. Create .agent/task/current-session-[YYYYMMDD-HHMM].md with phase, goals, token budget. Load relevant .agent/ context files. MUST CONFIRM: ✅ STEP 1 COMPLETE: Session initialized at [timestamp]. If missing confirmation, user stops work.  
**Tags:** protocol, step_1, initialization, session

### 28. Protocol Step 2: Plan and Save

**Title:** Session Protocol - Step 2: Plan and Save  
**Content:** Create implementation plan. Get user approval. IMMEDIATELY save to .agent/task/current-plan.md (overwrites previous). Create .agent/task/current-todos.md with task list. MUST CONFIRM: ✅ STEP 2 COMPLETE: Plan saved to current-plan.md, todos saved to current-todos.md. If confirmation missing, user stops work and enforces save.  
**Tags:** protocol, step_2, planning, persistence

### 29. Protocol Step 3: Expert Consultation

**Title:** Session Protocol - Step 3: Expert Consultation  
**Content:** REQUIRED before technical decisions. Invoke react-expert for components, next-js-expert for architecture, prisma-expert for database. Load agent template from memory, apply structured prompt, read current-session.md, save plan to .agent/task/[expert]-[topic]-[timestamp].md. MUST CONFIRM: ✅ STEP 3 COMPLETE: Consulted [expert] for [topic]. Include summary.  
**Tags:** protocol, step_3, experts, consultation

### 30. Protocol Step 4-5: Checkpoints and Completion

**Title:** Session Protocol - Steps 4-5: Checkpoints and Completion  
**Content:** STEP 4: Every 15K tokens (15K, 30K, 45K, 60K, 75K, 90K), update current-session.md and current-todos.md. CONFIRM: ✅ CHECKPOINT at [X]K tokens: Progress saved. STEP 5 (before final commit): Create COMPLETION\_[PHASE].md, update STATUS.md and DEVELOPMENT_PLAN.md, invoke synthesize-docs and map-system, commit docs first then code. CONFIRM: ✅ STEP 5 COMPLETE: All documentation updated.  
**Tags:** protocol, step_4, step_5, checkpoints, completion

---

## Creation Script

Save all 30 memories using this pattern:

```javascript
// Repeat for each memory above
create_memory({
  Title: '[Memory Title]',
  Content: '[Memory Content - can be multi-paragraph]',
  Tags: ['tag1', 'tag2', 'tag3'],
  CorpusNames: ['draco28/ProjectPulse'],
  UserTriggered: false,
});
```

**Estimated time:** 15-20 minutes to create all 30 memories

**Validation:** After creation, test retrieval:

- Search for "Golden Rule"
- Search for "Agent Template"
- Search for "Protocol Step"
- Verify all memories accessible

---

## Next Steps After Memory Creation

1. Update .windsurfrules with complete rules (see CASCADE_RULES.md)
2. Create session starter template (see CASCADE_TEMPLATES.md)
3. Test foundation with sample session
4. Validate agent invocation works
5. Proceed to Phase 2 of integration plan
