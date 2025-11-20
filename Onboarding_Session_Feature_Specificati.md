# Onboarding Session Feature Specification (Option 1: Agent-Led with MCP Prompts)

**Project:** ProjectPulse  
**Feature:** Onboarding Sessions (Refactored for Full Agent Dependence)  
**Version:** 1.0.0 (Agent-Led Prompts via MCP)  
**Created:** 2025-11-20  
**Status:** Draft for Implementation  
**Standards:** IEEE 830-1998, Aligned with Agent-First Architecture (ADR-001)  

---

## Document Purpose

This specification defines the refactored Onboarding Sessions feature for ProjectPulse, implementing **Option 1: Full Dependence on User's Agent**. ProjectPulse serves as a prompt orchestrator and database gateway, providing structured MCP tools and templated instructions to guide the user's AI agent (e.g., Claude Code) through a 3-session progressive onboarding flow. The agent performs all heavy lifting—phased questioning, content generation, validation, and bootstrapping—while persisting state exclusively via MCP calls to PostgreSQL (ensuring clean repositories with only `claude.md` and `agents.md` written post-bootstrap).

**Key Philosophy Alignment:**  
- **Agent-First (95% MCP-Driven):** Agents orchestrate the flow using prompts injected with DB context (e.g., prior phases from `projectContextJson`). No server-side generation or parsing—agents handle markdown extraction, JSON validation, and hierarchy creation.  
- **Database as Source of Truth:** All artifacts (answers, docs, hierarchy) stored in tables like `OnboardingSession`, `Document`, `Phase/Sprint/...`. Web UI exposes real-time views (Wiki for docs, Development Cycle for progress).  
- **Clean Repositories:** Minimal writes: Server generates and pushes `claude.md` (MCP integration guide) and `agents.md` (persona/skills reference) via optional MCP tool after Session 3. No `.agent/` or session files.  
- **Token Efficiency:** Prompts limited to 1-2K tokens/session; phased/batched via agent logic, achieving 88-92% reductions (lazy-load via hybrid search). Sessions cap at 200K tokens total.  

**Scope:** Refactor existing onboarding code (assumed in `apps/mcp-server/src/tools/onboarding.ts` and `prisma/schema.prisma`) to emphasize MCP tools + prompts. Out of scope: Server-side LLM (Option 2); multi-agent orchestration; real-time collaboration.  

**Assumptions for Refactor (For Claude Code):**  
- Current setup: MCP server with 41 tools (extend with 8 new/updated onboarding tools); Prisma models (`OnboardingSession`, `Document`, etc.) exist but need `projectContextJson: Json?` field.  
- Refactor Target: Update `onboarding` tool category; add prompt templates to `WorkflowTemplate` table; ensure session persistence via consistent `projectId` (from memory: Fix per-test isolation with integrated E2E suite).  
- Testing: New integrated tests simulating full flow (e.g., Playwright with MCP mocks, consistent `projectId`).  

**Related Documents:**  
- [02-SRS.md](02-SRS.md): Extends FR-032–FR-056 (Workflow Orchestration).  
- [05-AgentOps-Plan.md](05-AgentOps-Plan.md): Adds to 5-Step Protocol.  
- [12-Backlog.md](12-Backlog.md): New Epic ONBOARD-001 (8 stories, 24 points, Sprint 9).  
- [13-Project-Plan.md](13-Project-Plan.md): Integrate into Phase E (Week 17).  

---

## 1. High-Level Architecture

**Flow Overview:**  
Developer creates project via Web UI → Agent connects via MCP → Agent calls `onboarding.startSession(projectId, session: 1)` → Server returns prompt template with DB context → Agent executes (questions/gen/validate) → Agent persists via MCP CRUD → Repeat for Sessions 2-3 → Server auto-writes minimal repo files.  

**Mermaid Diagram (For Claude Code Implementation):**  
```mermaid
sequenceDiagram
    participant U as User/Agent (Claude Code)
    participant S as ProjectPulse MCP Server
    participant D as PostgreSQL DB
    participant R as User Repo
    
    U->>S: onboarding.startSession(projectId, session:1)
    S->>D: Create OnboardingSession {projectId, sessionNumber:1, status:'in_progress'}
    D-->>S: sessionId
    S->>U: Prompt: "Phased questions for Session 1... Inject: {}"
    loop For each phase (1-10)
        U->>U: Ask user questions (48 total, batched)
        U->>S: onboarding.savePhase(projectId, phase:1, answers:{...})
        S->>D: Update OnboardingSession {planningAnswers: {phase1: {...}}}
    end
    U->>S: onboarding.finalizeSummary(projectId)
    S->>U: Prompt: "Generate executive summary from projectContextJson"
    U->>U: Generate summary
    U->>S: document.store(projectId, 'executive-summary.md', content)
    S->>D: Create Document {filename, content, category:'planning'}
    Note over U,S: Session 1 Complete (UI: Wiki shows summary)
    
    U->>S: onboarding.startSession(projectId, session:2)
    S->>U: Prompt: "Generate 15 docs in batches... Inject: projectContextJson + prior docs"
    loop Batches of 4-5 docs (waterfall: PRD→SRS→...)
        U->>U: Generate doc (e.g., PRD)
        U->>U: Validate against prior (e.g., trace to summary)
        U->>S: document.storeBatch(projectId, batch:['PRD.md', content[]])
        S->>D: Create Documents xN
    end
    Note over U,S: Session 2 Complete (UI: Wiki categories populated)
    
    U->>S: onboarding.startSession(projectId, session:3)
    S->>U: Prompt: "Bootstrap from 13-Project-Plan.md... Create personas/skills/hierarchy"
    U->>U: Parse markdown → JSON hierarchy
    U->>U: Generate 3-10 personas, 5-15 skills, 3 workflows, 5 SOPs
    U->>S: agentPersona.createBatch(projectId, personas[])
    U->>S: skill.createBatch(projectId, skills[])
    U->>S: workflowTemplate.createBatch(projectId, templates[])
    U->>S: sop.createBatch(projectId, sops[])
    U->>S: roadmap.createHierarchy(projectId, hierarchyJson)
    S->>D: Populate Phase/Sprint/Week/Day/Task tables (cascade)
    S->>R: Optional: repo.writeMinimal(projectId, ['claude.md', 'agents.md'])
    Note over U,S: Session 3 Complete (UI: Dev Cycle shows hierarchy; Skills/Personas pages live)
```

**Data Flow:** Agent → MCP Tool Call (HTTP JSON-RPC) → Server Validates/Persists → DB Update → SSE Stream Response (e.g., "Phase 1 saved: 85% complete") → UI Real-Time Refresh (via Server-Sent Events).  

---

## 2. Functional Requirements (FR-ONBOARD-001 to FR-ONBOARD-012)

**Priority:** P0 (Critical for MVP Onboarding).  
**Dependencies:** FR-032 (Workflow Start), FR-001 (Hierarchy Create).  

#### FR-ONBOARD-001: Session Initialization  
**Description:** Agent starts a session; server creates `OnboardingSession` record and returns initial prompt template.  
**Inputs (MCP Tool: `onboarding.startSession`):**  
- `projectId: number` (required, from Web UI creation).  
- `session: number` (1-3).  
**Outputs:**  
- `sessionId: number`.  
- `prompt: string` (templated, e.g., "Begin Session 1: Ask phased questions...").  
- Injected Context: `{ priorSessions: [summaries], projectContextJson: {} }` (lazy-loaded via pgvector if exists).  
**Validation:** Ensure `projectId` exists; status='in_progress'. Enforce single active session per project (lock via DB transaction).  
**Agent Guidance:** Prompt includes: "Use phased batches to stay under 200K tokens; call `savePhase` after each."  
**Traceability:** US-ONBOARD-001 (2 points); TEST-ONBOARD-001 (E2E: Init → Save).  

#### FR-ONBOARD-002: Phased Questioning and JSON Persistence (Session 1)  
**Description:** Agent fetches/retrieves questions per phase; saves answers to build `projectContextJson`.  
**Inputs (MCP Tool: `onboarding.getPhasedQuestions`):**  
- `projectId: number`.  
- `phase: number` (1-10, ~4-5 questions/phase, total 48).  
**Outputs:** Questions array: `[{id:1, text:"Project vision?", type:"text"}]`.  
**Inputs (MCP Tool: `onboarding.savePhase`):**  
- `projectId: number`.  
- `phase: number`.  
- `answers: Json` (validated Zod schema: e.g., `vision: z.string(), techStack: z.array(z.string())`).  
**Outputs:** Updated `projectContextJson: Json` (merge prior phases).  
**Validation:** Zod on answers; ensure completeness (e.g., required fields per phase). Roll-up progress: 10% per phase (FR-002).  
**Agent Guidance:** Prompt: "Ask one phase at a time; validate user answers; call `savePhase` then proceed. After phase 10, call `finalizeSummary`."  
**DB Update:** `OnboardingSession { planningAnswers: { [phase]: answers }, projectContextJson: mergedJson }`.  
**Traceability:** US-ONBOARD-002 (3 points); TEST-ONBOARD-002 (Unit: Zod validation).  

#### FR-ONBOARD-003: Executive Summary Generation (Session 1 Close)  
**Description:** Agent finalizes summary from full `projectContextJson`.  
**Inputs (MCP Tool: `onboarding.finalizeSummary`):**  
- `projectId: number`.  
**Outputs:** Prompt: "Synthesize 96 answers into 500-word executive summary. Output markdown."  
**Agent Action:** Generate → Call `document.store` for 'executive-summary.md' (category: 'planning').  
**Validation:** Word count 400-600; semantic similarity >0.8 to JSON via pgvector (optional fallback).  
**Agent Guidance:** "Inject full projectContextJson; ensure traceable to phases (e.g., 'Vision from Phase 1')."  
**UI Visibility:** Auto-render in Wiki (searchable via tsvector).  
**Traceability:** US-ONBOARD-003 (2 points); TEST-ONBOARD-003 (Integration: JSON → Doc).  

#### FR-ONBOARD-004: Batched Document Generation (Session 2)  
**Description:** Agent generates 15 docs in waterfall batches (4-5/docs, PRD/SRS first).  
**Inputs (MCP Tool: `onboarding.getDocBatchPrompt`):**  
- `projectId: number`.  
- `batch: string[]` (e.g., ['01-PRD.md', '02-SRS.md']).  
**Outputs:** Prompt per doc: "Generate {filename} using {projectContextJson} + {priorDocs}. Ensure traceability (e.g., SRS refs PRD sections)." Injected: Prior docs via hybrid search (<1,200 tokens).  
**Inputs (MCP Tool: `document.storeBatch`):**  
- `projectId: number`.  
- `batch: [{filename: string, content: string, category: 'planning'|'architecture'|...}]`.  
**Outputs:** Bulk create `Document` records.  
**Validation:** Inter-doc links (e.g., regex check "See PRD Section 4"); batch progress roll-up (20% per batch).  
**Agent Guidance:** "Waterfall: Generate PRD → Validate → Store → Confirm tokens <150K → Next batch. Use `checkTokenBudget` before each."  
**Doc List (Categories):**  
| Category | Filenames (15 Total) | Dependencies |  
|----------|----------------------|--------------|  
| Planning | 01-PRD.md, 02-SRS.md, 12-Backlog.md, 13-Project-Plan.md | Executive Summary |  
| Architecture | 03-Architecture.md, 04-Data-and-Model-Spec.md, 05-API-Spec.md | PRD/SRS |  
| Implementation | 06-UI-UX.md, 07-Security.md, 08-Testing.md, 14-Team-Onboarding.md, 15-Maintenance.md | Architecture |  
| Operations | 09-Deployment.md, 10-Observability.md, 11-Performance.md | All Prior |  
**Traceability:** US-ONBOARD-004 (5 points); TEST-ONBOARD-004 (E2E: Batch 1 → Links).  

#### FR-ONBOARD-005: Session 2 Validation and Completion  
**Description:** Agent validates full doc set; server updates session status.  
**Inputs (MCP Tool: `onboarding.completeSession`):**  
- `projectId: number`.  
- `session: 2`.  
- `validationReport: Json` (agent-generated: {complete: true, gaps: []}).  
**Outputs:** Status='complete'; SSE: "Session 2 done: 15 docs stored."  
**Validation:** Ensure 15 docs exist; cross-refs valid (e.g., Backlog traces to SRS FRs).  
**Agent Guidance:** "Review all docs for consistency; report gaps before completing."  
**UI:** Wiki auto-indexes by category; Dev Cycle shows "Docs: 100%".  
**Traceability:** US-ONBOARD-005 (1 point); TEST-ONBOARD-005.  

#### FR-ONBOARD-006: Blueprint-Driven Bootstrapping (Session 3)  
**Description:** Agent parses `13-Project-Plan.md` into JSON hierarchy; creates assets.  
**Inputs (MCP Tool: `onboarding.getBootstrapPrompt`):**  
- `projectId: number`.  
**Outputs:** Prompt: "Parse 13-Project-Plan.md markdown into JSON: {phases: [{title, order, sprints: [{name, weeks, points, goals, deliverables}]}]}. Validate structure. Then generate 3-10 personas (e.g., 'Backend Expert'), 5-15 skills (e.g., 'prisma-queries'), 3 workflows, 5 SOPs based on tech stack from projectContextJson."  
**Agent Action:** Parse → Generate → Batch-create via MCP (e.g., `agentPersona.createBatch`).  
**Validation:** Agent self-validates JSON keys (prompt: "Ensure unique weekNumbers, positive points"); server checks FK integrity on persist.  
**Agent Guidance:** "Extract via structured output; fallback to manual fixes if parse <90%; commit hierarchy before assets."  
**Traceability:** US-ONBOARD-006 (5 points); TEST-ONBOARD-006 (Parse 10 synthetic plans).  

#### FR-ONBOARD-007: Hierarchy Materialization  
**Inputs (MCP Tool: `roadmap.createHierarchy`):**  
- `projectId: number`.  
- `hierarchyJson: Json` (agent-parsed: {phases: [...]}).  
**Outputs:** Cascade create: `Roadmap` → `Phase` → `Sprint` → `Week` → `Day` (7 days/week) → `Task` (1 initial per day, status='NOT_STARTED'). Auto-init progress=0.0 (FR-001).  
**Validation:** Unique constraints (e.g., `Sprint.name` per `Phase`); soft-delete on error.  
**UI:** Development Cycle visualizes roll-up (e.g., Phase progress avg of sprints).  
**Traceability:** US-ONBOARD-007 (3 points); TEST-ONBOARD-007.  

#### FR-ONBOARD-008: Asset Batch Creation (Personas, Skills, etc.)  
**Inputs (MCP Tools):**  
- `agentPersona.createBatch(projectId, [{name: 'Backend Expert', description: '...', activationTriggers?: string[]}]`.  
- `skill.createBatch(projectId, [{name: 'prisma-queries', content: '...'}])`.  
- `workflowTemplate.createBatch(projectId, [{name: 'feature-dev', steps: [...]}])`.  
- `sop.createBatch(projectId, [{name: 'git-workflow', content: '...'}])`.  
**Outputs:** Bulk inserts; indexes rebuilt for search.  
**Validation:** Duplicates prevented; embeddings generated (Ollama text-embedding-3-small).  
**Agent Guidance:** "Tailor to techStack (e.g., React → 'react-patterns' skill); limit to 10 personas."  
**Traceability:** US-ONBOARD-008 (3 points); TEST-ONBOARD-008.  

#### FR-ONBOARD-009: Minimal Repo Writes  
**Description:** Post-Session 3, server generates/writes 2 files to repo (optional).  
**Inputs (MCP Tool: `repo.writeMinimal`):**  
- `projectId: number`.  
- `repoPath: string` (agent-provided).  
**Outputs:** `claude.md`: "MCP Integration: Connect via stdio; use tools like progress.update." `agents.md`: "Personas: Backend Expert (triggers: DB queries)...".  
**Validation:** Git-safe (no hooks); fallback: Store in `Document` (category: 'repo').  
**Agent Guidance:** Prompt: "Provide repoPath only if clean-write approved."  
**Traceability:** US-ONBOARD-009 (1 point); TEST-ONBOARD-009 (Mock git).  

#### FR-ONBOARD-010: Cross-Session Persistence  
**Description:** Ensure consistent `projectId` across sessions (from memory: Fix test isolation).  
**Validation:** All tools require `projectId`; query prior sessions for context injection.  
**Agent Guidance:** "Always include projectId; resume from last status."  
**Traceability:** US-ONBOARD-010 (1 point); Integrated E2E Suite.  

#### FR-ONBOARD-011: Observability and Progress Roll-Up  
**Description:** Log metrics; update Dev Cycle.  
**Inputs (MCP Tool: `onboarding.logStep`):**  
- `projectId, step: string, metrics: {tokensUsed: number}`.  
**Outputs:** `AgentAction` insert; progress= (sessions complete / 3) * 100.  
**UI:** Dashboard: "Onboarding: Session 2/3, 67%".  
**Traceability:** NFR-011; US-ONBOARD-011 (2 points).  

#### FR-ONBOARD-012: Error Handling and Recovery  
**Description:** Graceful failures (e.g., invalid JSON → agent retry prompt).  
**Validation:** Transactions rollback; SSE errors: "Phase 1 failed—retry with corrected answers."  
**Agent Guidance:** Prompts include: "If error, consult workflow.consultExpert()."  
**Traceability:** NFR-008; US-ONBOARD-012 (1 point).  

---

## 3. MCP Tools Catalog (New/Updated: 8 Tools)

| Tool Name | Category | Inputs | Outputs | Description |  
|-----------|----------|--------|---------|-------------|  
| onboarding.startSession | Workflow | projectId, session | sessionId, prompt | Init session with template. |  
| onboarding.getPhasedQuestions | Onboarding | projectId, phase | questions[] | Fetch 48 questions (phased). |  
| onboarding.savePhase | Onboarding | projectId, phase, answers | updatedJson | Merge to projectContextJson. |  
| onboarding.finalizeSummary | Onboarding | projectId | prompt | Gen summary prompt. |  
| onboarding.getDocBatchPrompt | Onboarding | projectId, batch[] | prompts[] | Batched doc prompts w/ context. |  
| document.storeBatch | Document | projectId, batch[] | docIds[] | Bulk doc storage. |  
| onboarding.getBootstrapPrompt | Onboarding | projectId | prompt | Session 3 blueprint w/ parse instr. |  
| repo.writeMinimal | Repo | projectId, repoPath | success | Write claude.md/agents.md. |  

**Implementation Note (Claude Code):** Extend `apps/mcp-server/src/tools/onboarding.ts` with these signatures (TypeScript + Zod). Use `@modelcontextprotocol/sdk` for JSON-RPC; add SSE for prompts/metrics.  

---

## 4. Prompt Templates (Stored in WorkflowTemplate Table)

**Session 1 Phased Prompt Example (Per Phase):**  
```
You are the Onboarding Agent for ProjectPulse. Project ID: {projectId}. Current Phase: {phase}/10.

Questions for Phase {phase}: {questions}.

Instructions:
1. Ask user one question at a time, conversationally.
2. Collect answers; validate (e.g., techStack must be array of strings).
3. After all questions in phase, call onboarding.savePhase(projectId, {phase}, {answersJson}).
4. Confirm: "Phase {phase} complete. Proceed to {nextPhase}?"
5. Stay under 20K tokens/phase. Context: {priorPhasesJson}.

Goal: Build projectContextJson progressively for Session 2 docs.
```

**Session 2 Batch Prompt Example:**  
```
Generate Batch {batchNum}/4 for Project {projectId}.

Docs to Generate: {batch: ['01-PRD.md']}.

Instructions (Waterfall):
1. For each doc: Use template "{filename} structure: [standard outline]". Inject: projectContextJson={json}, priorDocs={summaries/excerpts via hybrid search}.
2. Ensure traceability: E.g., PRD Section 4 → SRS FR-001.
3. Generate markdown (2000+ words/doc); validate internally (e.g., complete sections?).
4. After each: Call document.storeBatch; checkTokenBudget() <150K.
5. Confirm: "Doc {filename} complete. Tokens used: {est}. Proceed?"

Prior Context: {execSummary}, {generatedDocs: 3/15}.
```

**Session 3 Bootstrap Prompt:**  
```
Bootstrap Session 3 for Project {projectId}. Fetch 13-Project-Plan.md via knowledge.retrieve('13-Project-Plan.md').

Instructions:
1. Parse markdown to JSON hierarchy: Extract phases (title, order), sprints (name, weeks, points, goals, deliverables). Use structured output: {phases: [{title, order, sprints: [{...}]}]}.
2. Validate: Unique IDs, positive points, 5-7 weeks/sprint.
3. Generate Assets (tailored to techStack from projectContextJson):
   - 3-10 AgentPersonas: [{name, description, activationTriggers? (optional array)}] e.g., 'React Specialist'.
   - 5-15 Skills: [{name, content (frontmatter + markdown)}] e.g., 'nextjs-routing'.
   - 3 WorkflowTemplates: [{name, steps: [array]}] e.g., 'feature-dev'.
   - 5 SOPs: [{name, content}] e.g., 'pr-review'.
4. Batch-Create: Call agentPersona.createBatch, etc., then roadmap.createHierarchy(hierarchyJson).
5. If parse fails (>10% incomplete), fix manually or call workflow.consultExpert().
6. Final: Call onboarding.completeSession(3); provide repoPath for minimal writes?

Context: {allDocsExcerpts}, {projectContextJson}. Goal: Materialize trackable workflow.
```

**Implementation Note:** Seed `WorkflowTemplate` with these (JSON field: {prompt, variables: ['projectId', 'phase']}). MCP injects via string replace + hybrid search.  

---

## 5. Database Model Updates (Prisma Schema)

**Add/Extend Models (For Claude Code: Run `prisma migrate dev --name onboarding-refactor`):**  
```prisma
model OnboardingSession {
  id                Int      @id @default(autoincrement())
  projectId         Int
  sessionNumber     Int      // 1-3
  status            String   // 'in_progress' | 'complete' | 'failed'
  planningAnswers   Json?    // Session 1: {phase1: {...}, ...}
  projectContextJson Json?   // Merged phases + summary
  validationReport  Json?    // Agent-provided
  metrics           Json?    // {tokensUsed: number, phasesComplete: number}
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  documents         Document[] // One-to-many
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, sessionNumber])
}

model Document {
  // Existing + 
  onboardingSessionId Int?
  onboardingSession   OnboardingSession? @relation(fields: [onboardingSessionId], references: [id])
  
  @@index([onboardingSessionId])
}

// Existing Roadmap/Phase/... unchanged; ensure cascade in createHierarchy
```

**Seed Data:** Initial questions (48) in JSON seed script: `prisma db seed` populates `OnboardingQuestion` table (new: {phase, text, type}).  

---

## 6. UI and Observability Integration

**Web UI Views:**  
- **Onboarding Dashboard (New Page: /onboarding/{projectId}):** Real-time progress (e.g., "Session 1: Phase 3/10"); editable `projectContextJson` (JSON editor); preview docs mid-batch.  
- **Wiki Enhancements:** Auto-categorize onboarding docs; search "onboarding:session=2".  
- **Dev Cycle:** Post-Session 3, visualize hierarchy (progress bars roll-up from tasks).  

**Observability (NFR-011):**  
- Log MCP calls to `AgentAction` (e.g., "savePhase: Phase 1, tokens: 5K").  
- Metrics: Prometheus: `onboarding_sessions_complete{projectId}`; Grafana dashboard: Session funnel (Start → Complete).  

---

## 7. Implementation Guidance for Claude Code Refactor

**Step-by-Step Plan (1 Sprint, 24 Points):**  
1. **Week 1 (Setup, 8 points):** Update Prisma (add fields/migrations); seed questions/templates. Implement 4 core tools (`startSession`, `getPhasedQuestions`, `savePhase`, `finalizeSummary`). Test: Unit (Zod) + integrated E2E (consistent projectId, full Session 1).  
2. **Week 2 (Sessions 2-3, 10 points):** Add batch tools (`getDocBatchPrompt`, `storeBatch`, `getBootstrapPrompt`, `createHierarchy`, `createBatch` variants). Flesh prompts; simulate agent parse (mock JSON). Test: E2E batches + hierarchy cascade.  
3. **Week 3 (Polish, 6 points):** `writeMinimal`, `logStep`, error hooks. UI stubs (e.g., dashboard via Next.js page). Observability: Add to `AgentAction`. Deploy: `docker-compose up`; verify MCP streaming (from memory: Use Streamable HTTP).  

**Code Snippets (Starting Points):**  
- Tool Handler:  
```typescript
// apps/mcp-server/src/tools/onboarding/startSession.ts
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

export const startSession = async ({ projectId, session }: { projectId: number; session: number }) => {
  const onboarding = await prisma.onboardingSession.create({
    data: { projectId, sessionNumber: session, status: 'in_progress' }
  });
  const template = await prisma.workflowTemplate.findUnique({ where: { name: `onboarding-session-${session}` } });
  const context = await getPriorContext(projectId); // Hybrid search
  const prompt = template.prompt.replace('{projectId}', projectId.toString()).replace('{context}', JSON.stringify(context));
  return { sessionId: onboarding.id, prompt };
};
```
- Prompt Injection Helper: Use `knowledge.retrieveRelevant` for <1,200 tokens.  

**Success Criteria:**  
- 95% agent autonomy: Full flow via Claude Code (no server gen).  
- Token: <200K total.  
- Tests: 80% coverage; E2E passes with mocked agent.  
- Traceability Matrix:  

| FR-ONBOARD-ID | PRD Section | Backlog US | Tests | Sprint |  
|---------------|-------------|------------|--------|--------|  
| 001-003      | 1.2.5      | US-001-003 | TEST-001-003 | 9 W1 |  
| 004-005      | 4.2.2      | US-004-005 | TEST-004-005 | 9 W2 |  
| 006-009      | 4.2.8      | US-006-009 | TEST-006-009 | 9 W2 |  
| 010-012      | 5.5        | US-010-012 | TEST-010-012 | 9 W3 |  

This spec equips Claude Code for a seamless refactor—agent-led, DB-persistent, repo-clean. Ready for handover; let's iterate if needed!