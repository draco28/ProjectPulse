# Onboarding Session Refactor - Overview

**Project**: ProjectPulse  
**Sprint**: Sprint 9 (Phase E, Week 17)  
**Version**: 1.0.0  
**Created**: 2025-11-20  
**Status**: ✅ APPROVED - Ready for Implementation  
**Estimated Effort**: 24 story points (~7-11 hours)  
**Priority**: P0 (Critical)  
**Validated By**: Grok (95%+ accuracy confirmed)

---

## Executive Summary

### Current State (Sprints 8.5-8.7)

**What Works**:
- ✅ Session 1: 10-phase questions (96 questions), agent-side AI for executive summary
- ✅ Session 2: 15 industry documents, agent-side AI generation
- ✅ Session 3: Template-based bootstrap (personas, skills, SOPs, roadmap)
- ✅ HTTP Streamable transport (solved 30KB SSE limit bug)
- ✅ Agent-side AI pattern (privacy-first, zero OpenAI costs)

**What Needs Improvement**:
- ⚠️ Monolithic tools (all 15 doc prompts at once → risk >200K tokens)
- ⚠️ Hardcoded prompts in MCP tools (not database-driven)
- ⚠️ Nested JSONB schema (no explicit `projectContextJson` field)
- ⚠️ E2E tests: 6/10 pass together (needs isolation fix)
- ⚠️ No token budget tracking (agents can exceed limits)
- ⚠️ Automatic file writes (not opt-in)

### Refactor Goals

1. **Granular Tools**: Break monolithic tools into per-phase/per-batch operations
2. **Database-Driven Prompts**: Move hardcoded prompts to `WorkflowTemplate` table
3. **Explicit Schema**: Add `projectContextJson`, `planningAnswers`, `validationReport`, `metrics` fields
4. **Batch Processing**: Waterfall doc generation (4-5 docs at a time vs all 15)
5. **Token Budget Tracking**: `checkTokenBudget()` tool to prevent >200K overflows
6. **Observability**: Progress logging, validation reports
7. **Optional Repo Writes**: Make `claude.md`/`agents.md` generation opt-in
8. **Test Isolation**: Fix E2E suite to 10/10 pass rate

### Success Metrics

- ✅ 96 questions fully seeded in database
- ✅ 88-92% token reduction via batched/phased processing
- ✅ <500ms P95 latency for MCP tool calls
- ✅ >95% agent autonomy
- ✅ 10/10 E2E tests passing (full 3-session flow)
- ✅ Clean repositories (only optional `claude.md`/`agents.md`)

---

## Grok's Validation Summary

### ✅ What's Spot-On (95%+ Alignment)

| Aspect | Grok Validation | Spec Reference |
|--------|----------------|----------------|
| Agent-Side AI Pattern | ✅ Privacy-first, zero-cost | FR-ONBOARD-003/004 |
| Granular Tools | ✅ Per-phase/batch operations | FR-ONBOARD-001/002 |
| Database Prompts | ✅ WorkflowTemplate table | Section 5 (Schema) |
| Explicit Schema | ✅ Top-level JSONB fields | FR-ONBOARD-010 |
| HTTP Streamable | ✅ Unlimited response sizes | NFR-002 (Performance) |
| Optional Repo Writes | ✅ `repo.writeMinimal` opt-in | FR-ONBOARD-009 |
| Token Budget | ✅ New `checkTokenBudget` tool | FR-ONBOARD-013 (New) |
| Batch Processing | ✅ 4 batches × 4-5 docs | FR-ONBOARD-004 |

### 🔄 Minor Tweaks for 100% Precision

#### 1. Question Count (Grok Refinement #1)
- **Current Understanding**: 48 questions (my summary)
- **Spec Reality**: 96 questions (10 phases × 9-10 each)
- **Action**: Ensure seed script populates full 96 in `OnboardingQuestion` table
- **Reference**: FR-ONBOARD-002 validation (Zod schemas per phase)

#### 2. Bootstrap Prompt Enhancements (Grok Refinement #2)
- **Add**: Structured output schema in prompt
- **Example**: `"Output JSON with exact keys: {phases: [{title: string, order: number, sprints: [{name, weeks, points, goals[], deliverables[]}]}]}"`
- **Fallback**: `"If parse <90%, call workflow.consultExpert()"`
- **Reference**: FR-ONBOARD-006

#### 3. Token Budget Tool Spec (Grok Refinement #3)
- **Tool Name**: `projectpulse_onboarding_checkTokenBudget`
- **Input**: `{projectId: number, estimatedTokens: number}`
- **Output**: `{safe: boolean, remaining: number, tokensUsed: number, budgetLimit: 200000}`
- **Usage**: "Call before each doc batch to confirm <150K"
- **Reference**: New FR-ONBOARD-013 (Observability)

---

## Architecture Overview

### Agent-First Principle (95% MCP-Driven)

**Server Role**: Lightweight orchestrator
- Provides prompt templates from database
- Injects context via hybrid search (<1,200 tokens)
- Validates and persists agent-generated content
- Tracks progress and metrics

**Agent Role**: Heavy lifting
- Asks questions conversationally
- Generates content with THEIR AI provider (Claude, GPT, etc.)
- Validates own output
- Decides when to proceed/retry

**Benefits**:
- 🔒 Privacy: User data never sent to server's AI
- 💰 Zero Cost: No OpenAI API key needed
- 🧠 Full Context: Agent gets ALL data in prompts (no token limits from server)
- 🔄 Flexibility: Works with any AI provider

### Data Flow: 3-Session Journey

```
Session 1: Strategic Planning (60-90 min, <60K tokens)
├─ Phase 1-10: 96 questions asked conversationally
├─ Agent generates executive summary with their AI
└─ Store in OnboardingSession.projectContextJson

Session 2: Documentation (30-60 min, <120K tokens)  
├─ Batch 1: PRD, SRS, Backlog, Project-Plan (4 docs)
├─ Batch 2: Architecture, Data Model, API Spec (3 docs)
├─ Batch 3: UI/UX, Security, Testing (3 docs)
├─ Batch 4: Deployment, Observability, Performance, Onboarding, Maintenance (5 docs)
└─ Store 15 docs in Document table → Wiki

Session 3: Bootstrap (15-30 min, <20K tokens)
├─ Parse 13-Project-Plan.md → JSON hierarchy
├─ Create 3-10 AgentPersonas (tech-stack-based)
├─ Create 5-15 Skills (framework-specific)
├─ Create 3 WorkflowTemplates (static)
├─ Create 5 SOPs (static)
├─ Materialize Roadmap → Phase→Sprint→Week→Day→Task
└─ Optional: Write claude.md, agents.md to repo
```

### Current vs Refactored Comparison

| Aspect | Current (Monolithic) | Refactored (Granular) |
|--------|---------------------|----------------------|
| **Session 1 Tools** | `getQuestions(phase)` | `getPhasedQuestions(phase)` (clearer name) |
| | `saveAnswers(phase, answers)` | `savePhase(phase, answers)` (matches spec) |
| | ❌ No summary prompt tool | `finalizeSummary()` → prompt template |
| **Session 2 Tools** | `getDocumentPrompts()` → ALL 15 | `getDocBatchPrompt(batch)` → 4-5 docs |
| | `storeDocument(doc)` × 15 | `storeBatch([docs])` → bulk insert |
| | ❌ No token tracking | `checkTokenBudget(est)` before each batch |
| **Session 3 Tools** | `bootstrap()` → does everything | `getBootstrapPrompt()` → instructions only |
| | Auto-creates all assets | Separate: `agentPersona.createBatch()`, etc. |
| | Auto-writes files | `repo.writeMinimal()` → opt-in |
| **Prompts** | Hardcoded in MCP tools | Stored in `WorkflowTemplate` table |
| **Schema** | Nested `response` JSONB | Explicit: `planningAnswers`, `projectContextJson` |
| **Observability** | ❌ No logging | `logStep()`, `completeSession(validationReport)` |
| **Tests** | Share projectId=3 (6/10 pass) | Unique IDs + cleanup (10/10 pass) |

---

## Key Changes Summary

### 1. MCP Tools (17 Total: 8 New, 5 Refactored, 4 Kept)

**New Tools**:
- `finalizeSummary` - Get prompt for executive summary
- `checkTokenBudget` - Prevent token overflows
- `getDocBatchPrompt` - Batched doc prompts (replaces `getDocumentPrompts`)
- `getBootstrapPrompt` - Parse instructions (replaces `bootstrap`)
- `agentPersona.createBatch` - Bulk create personas
- `skill.createBatch` - Bulk create skills
- `workflowTemplate.createBatch` - Bulk create workflows
- `sop.createBatch` - Bulk create SOPs
- `repo.writeMinimal` - Optional file writes
- `logStep` - Progress logging
- `completeSession` - Mark session complete with validation

**Refactored Tools**:
- `getQuestions` → `getPhasedQuestions` (rename)
- `saveAnswers` → `savePhase` (rename + use new schema)
- `storeDocument` → `storeBatch` (add bulk mode)
- `bootstrap` → split into separate batch creates

**Kept Unchanged**:
- `storeExecutiveSummary` (Session 1)
- `listDocuments` (Session 2)
- `roadmap.createHierarchy` (Session 3, already exists from Sprint 8.5)
- `blueprint.get` (metadata retrieval)

### 2. Database Schema

**OnboardingSession Table**:
```prisma
// NEW explicit fields (replace nested response JSONB)
planningAnswers    Json?  @db.JsonB // {phase1: {...}, phase2: {...}, ...}
projectContextJson Json?  @db.JsonB // Merged: {metadata, techStack, executiveSummary}
validationReport   Json?  @db.JsonB // Agent validation: {complete: true, gaps: []}
metrics            Json?  @db.JsonB // {tokensUsed, phasesComplete, duration}

// DEPRECATED (backward compat)
response           Json?  @db.JsonB // Remove Sprint 10
```

**WorkflowTemplate Table (New)**:
```prisma
model WorkflowTemplate {
  id             String  @id @default(cuid())
  projectId      Int?    // NULL = global, Int = project-specific
  name           String  // 'onboarding-session-1-phase-N'
  category       String  // 'onboarding'
  sessionNumber  Int?    // 1-3
  phase          Int?    // 1-10 (Session 1)
  batch          Int?    // 1-4 (Session 2)
  systemPrompt   String  @db.Text
  userPrompt     String  @db.Text
  variables      Json    @db.JsonB
  temperature    Float   @default(0.7)
  maxTokens      Int     @default(2000)
  isActive       Boolean @default(true)
}
```

### 3. Prompt Migration

**Before** (Hardcoded):
```typescript
// apps/mcp-server/src/tools/onboarding/getQuestionsTool.ts
const prompt = `Ask these questions: ${questions.map(q => q.text).join('\n')}`;
```

**After** (Database-Driven):
```typescript
// Fetch from WorkflowTemplate table
const template = await prisma.workflowTemplate.findUnique({
  where: { name: 'onboarding-session-1-phase-1' }
});

// Inject variables
const prompt = template.userPrompt
  .replace('{projectId}', projectId.toString())
  .replace('{questions}', JSON.stringify(questions));
```

### 4. Token Efficiency

**Current Risk**:
- Session 1: All 96 Q&A in one prompt → ~80K tokens
- Session 2: All 15 doc prompts at once → Risk >200K tokens
- No tracking → Agent can exceed limits

**Refactored Safety**:
- Session 1: Phased (10 × 6-8K = 60-80K total) ✅
- Session 2: Batched (4 × 30-40K = 120-160K total) ✅
- `checkTokenBudget()` before each operation ✅
- 88-92% reduction in peak memory usage ✅

---

## Related Documents

This overview links to detailed specifications:

1. **[Schema Changes](./02-schema-changes.md)** - Database migrations, Prisma models, seed scripts
2. **[MCP Tools](./03-mcp-tools.md)** - All 17 tool specifications with input/output schemas
3. **[Implementation Plan](./04-implementation-plan.md)** - Week-by-week tasks, file changes, timelines
4. **[Migration & Testing](./05-migration-testing.md)** - Data migration, backward compat, E2E test fixes

---

## Quick Start for Implementation

### Step 1: Read This Overview
- Understand current state vs refactored goals
- Review Grok's validation points
- Familiarize with 3-session architecture

### Step 2: Database Setup
- Read [Schema Changes](./02-schema-changes.md)
- Run Prisma migration
- Seed 96 questions + workflow templates

### Step 3: MCP Tools Refactor
- Read [MCP Tools](./03-mcp-tools.md)
- Update/create 17 tools following signatures
- Register in MCP server index

### Step 4: Follow Implementation Plan
- Read [Implementation Plan](./04-implementation-plan.md)
- Execute Week 1: Schema + Session 1 tools
- Execute Week 2: Session 2 & 3 tools
- Execute Week 3: Observability + tests

### Step 5: Validate
- Read [Migration & Testing](./05-migration-testing.md)
- Run E2E tests: 10/10 passing
- Measure token efficiency: 88-92% reduction
- Demo full 3-session flow

---

## Key Principles (Don't Compromise)

1. **Agent-Side AI**: Server NEVER generates content (only provides prompts)
2. **Database as Truth**: All state in PostgreSQL, UI reads from DB
3. **Clean Repos**: Only 2 optional files (`claude.md`, `agents.md`)
4. **Token Efficiency**: Phased/batched to stay <200K per session
5. **Backward Compat**: Legacy tools redirect during Sprint 9
6. **Observability**: Log every step, track metrics, validate reports

---

## Questions or Clarifications?

If anything is unclear:
1. Check related documents (02-05) for details
2. Refer to original spec: `Onboarding_Session_Feature_Specificati.md`
3. Review current implementation: `apps/mcp-server/src/tools/onboarding/`
4. Consult Grok's validation table above

**Status**: Ready for implementation (Sprint 9 Week 1 start)
