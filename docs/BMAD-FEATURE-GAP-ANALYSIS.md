# BMAD Feature Gap Analysis for ProjectPulse

**Version:** 1.0
**Created:** 2025-12-26
**Purpose:** Deep-dive analysis of ProjectPulse's readiness for per-feature BMAD workflows

---

## Executive Summary

**Key Insight**: ProjectPulse's onboarding system runs **once per project** (Sessions 1-3), but BMAD methodology is designed to run **per-feature**. While ProjectPulse has all the foundational components (personas, skills, workflows, tickets), it lacks explicit **per-feature planning cycles** that would enable true BMAD adoption.

| Category | Project-Level | Per-Feature | Gap Status |
|----------|--------------|-------------|------------|
| Document Generation | ✅ 15 docs (PRD, SRS, etc.) | ❌ No mini-PRD per feature | **MAJOR GAP** |
| Agent Personas | ✅ Created in Session 3 | ✅ Can invoke anytime | Working |
| Workflow Templates | ✅ Created in Session 3 | ⚠️ Generic, not BMAD-specific | **MINOR GAP** |
| Ticket Planning | ✅ Feature tickets exist | ⚠️ `_implementationContext` exists but not enforced | **MINOR GAP** |
| Traceability | ✅ FR→Backlog→Sprint | ⚠️ No per-feature validation | **MINOR GAP** |
| Progress Tracking | ✅ AgentSession exists | ✅ Works per-ticket | Working |

---

## Part 1: What's Actually Working (Verified Implementation)

### 1.1 MCP Tools Inventory (75 tools registered)

**Fully Functional for BMAD:**

| Tool Category | Count | Tools | Status |
|---------------|-------|-------|--------|
| **Ticket Management** | 10 | `ticket_create`, `ticket_bulkCreate`, `ticket_update`, `ticket_search`, `ticket_setStatus`, `ticket_addComment`, `ticket_get`, `ticket_getChildren`, `ticket_getHierarchy` | ✅ Production |
| **Agent Sessions** | 4 | `agent_session_start`, `agent_session_update`, `agent_session_end`, `agent_session_resume` | ✅ Production |
| **Context/Memory** | 6 | `context_load`, `context_lookup`, `context_update` + 3 deprecated memory tools | ✅ Production |
| **Personas** | 2 | `persona_list`, `persona_get` | ✅ Production |
| **Skills** | 2 | `skill_list`, `skill_get` | ✅ Production |
| **SOPs** | 2 | `sop_list`, `sop_get` | ✅ Production |
| **Workflows** | 7 | `workflow_list`, `workflow_start`, `workflow_executeStep`, `workflow_getStatus`, `workflow_pause`, `workflow_resume`, `workflow_complete` | ✅ Production |
| **Knowledge** | 8 | `knowledge_search`, `knowledge_create`, `knowledge_get`, `knowledge_related`, `knowledge_export`, `knowledge_import`, `knowledge_archive`, `knowledge_metrics` | ✅ Production |
| **Wiki** | 6 | `wiki_create`, `wiki_search`, `wiki_get`, `wiki_update`, `wiki_generate`, `wiki_analytics_summary` | ✅ Production |
| **Roadmap** | 5 | `roadmap_create`, `roadmap_materialize`, `roadmap_delete`, `getCurrentPosition`, `getPhaseProgress` | ✅ Production |
| **Traceability** | 2 | `traceability_generate`, `traceability_validate_documents` | ✅ Production |
| **Backlog** | 2 | `backlog_list`, `backlog_getBySprint` | ✅ Production |
| **Onboarding** | 18 | Session 1-3 tools (project-level only) | ✅ Production |
| **Batch Create** | 4 | `batch_createAgentPersonas`, `batch_createSkills`, `batch_createWorkflowTemplates`, `batch_createSOPs` | ✅ Production |

### 1.2 Database Tables (Verified in Prisma Schema)

**BMAD-Relevant Models:**

| Model | Purpose | BMAD Phase | Status |
|-------|---------|------------|--------|
| `Ticket` | Work items with 7 kinds (feature, task, epic, issue, bug, scanner_finding, tech_debt) | Implementation | ✅ Full |
| `Ticket.customFields._implementationContext` | Feature planning context (files, schema, blueprint) | Solutioning | ✅ Exists |
| `AgentPersona` | Specialized agents (Architect, Developer, QA, etc.) | All Phases | ✅ Full |
| `Skill` | Framework patterns, testing workflows | Implementation | ✅ Full |
| `SOP` | Standard Operating Procedures | All Phases | ✅ Full |
| `WorkflowTemplate` | Step-based workflow definitions | Orchestration | ✅ Full |
| `WorkflowRun` / `WorkflowStep` | Workflow execution tracking | Orchestration | ✅ Full |
| `KnowledgeItem` | RAG + Graph for context retrieval | Analysis | ✅ Full |
| `WikiPage` | Documentation storage | Planning/Docs | ✅ Full |
| `MemoryBank` | 5 context banks (PROJECT_BRIEF, SYSTEM_PATTERNS, etc.) | Context | ✅ Full |
| `AgentSession` | Work session tracking with plan/todos/progress | Implementation | ✅ Full |
| `BacklogItem` | Parsed backlog items for traceability | Planning | ✅ Full |
| `Document` | Onboarding-generated docs (15 docs) | Planning | ✅ Full (project-level only) |

### 1.3 API Routes (Verified)

**65+ API directories** with full CRUD operations for all major entities. Key routes:
- `/api/tickets/*` - Full ticket management
- `/api/agent-sessions/*` - Session tracking
- `/api/workflows/*` - Workflow orchestration
- `/api/knowledge/*` - Knowledge base
- `/api/context/*` - Memory bank management
- `/api/batch/*` - Bulk creation tools

---

## Part 2: BMAD Methodology Mapping

### 2.1 BMAD's 4-Phase Methodology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BMAD 4-PHASE METHODOLOGY                          │
├───────────────┬───────────────┬───────────────┬─────────────────────────────┤
│   ANALYSIS    │   PLANNING    │  SOLUTIONING  │      IMPLEMENTATION         │
│  (Optional)   │   (Required)  │   (Required)  │        (Required)           │
├───────────────┼───────────────┼───────────────┼─────────────────────────────┤
│ • Research    │ • PRD/Spec    │ • Architecture│ • Story-driven development  │
│ • Explore     │ • Requirements│ • UX Design   │ • Continuous validation     │
│ • Brainstorm  │ • Scope       │ • Tech Design │ • PR reviews                │
└───────────────┴───────────────┴───────────────┴─────────────────────────────┘
```

### 2.2 ProjectPulse Current State vs BMAD

| BMAD Phase | Runs Once (Project) | Runs Per-Feature | Gap |
|------------|---------------------|------------------|-----|
| **Analysis** | ✅ Session 1 (96 Q&A) | ⚠️ `knowledge_search` exists | Need: Feature research workflow |
| **Planning** | ✅ Session 2 (PRD, SRS) | ❌ No mini-PRD tool | **MAJOR**: Need feature spec tool |
| **Solutioning** | ✅ Session 3 (Architecture docs) | ⚠️ `_implementationContext` exists | Need: Enforcement + prompts |
| **Implementation** | N/A | ✅ AgentSession + Tickets | Working |

---

## Part 3: Feature Gaps (Detailed)

### GAP-001: No Per-Feature Planning Cycle (MAJOR)

**Problem**: Onboarding (Sessions 1-3) generates project-level docs once. There's no equivalent for per-feature planning.

**BMAD Expectation**: Each feature should have:
1. Mini-PRD (what + why)
2. Technical spec (how)
3. Implementation plan (steps)
4. Acceptance criteria

**Current State**:
- `Ticket.customFields._implementationContext` can store this, but:
  - No MCP tool to generate/populate it
  - No prompt templates for feature planning
  - No enforcement workflow

**Solution**:
```typescript
// NEW MCP Tool: projectpulse_feature_plan_generate
{
  name: "projectpulse_feature_plan_generate",
  description: "Generate BMAD-style planning for a feature ticket",
  inputs: {
    ticketId: number,          // Feature ticket to plan
    analysisDepth: "quick" | "full",  // Quick = just steps, Full = mini-PRD
    includeArchitecture: boolean,     // Generate file/schema analysis
  },
  output: {
    miniPRD: string,           // Generated mini-PRD
    implementationContext: {   // Structured context
      filesToModify: [...],
      filesToCreate: [...],
      schemaChanges: {...},
      implementationBlueprint: string,
    }
  }
}
```

**Implementation Effort**: ~3 days
- New MCP tool + API route
- Prompt template for feature planning
- Auto-populate `_implementationContext`

---

### GAP-002: No BMAD-Specific Workflow Templates (MINOR)

**Problem**: `WorkflowTemplate` exists but no pre-seeded BMAD workflows.

**Current Workflows** (from onboarding):
- Generic "Feature Development Workflow" - not BMAD-structured

**BMAD Expectation**: Pre-built workflow templates for:
1. **BMAD Feature Workflow** (4 phases)
2. **BMAD Bug Fix Workflow** (abbreviated)
3. **BMAD Tech Debt Workflow** (with impact analysis)

**Solution**: Seed BMAD workflow templates:

```typescript
// Example: BMAD Feature Development Workflow Template
{
  name: "BMAD Feature Development",
  category: "development",
  steps: [
    { name: "Analysis", action: "invoke_persona", persona: "analyst", description: "Research existing patterns, dependencies" },
    { name: "Planning", action: "generate_feature_plan", description: "Create mini-PRD and acceptance criteria" },
    { name: "Architecture", action: "invoke_persona", persona: "architect", description: "Design technical approach, file changes" },
    { name: "Review Plan", action: "human_approval", description: "Get human approval on plan" },
    { name: "Implementation", action: "agent_session", description: "Implement with checkpoints every 15K tokens" },
    { name: "Testing", action: "invoke_persona", persona: "qa", description: "Verify implementation" },
    { name: "Documentation", action: "update_wiki", description: "Update relevant docs" },
    { name: "PR Review", action: "invoke_persona", persona: "reviewer", description: "Code review" },
  ]
}
```

**Implementation Effort**: ~1 day
- Add seed data for 3 BMAD workflow templates
- No code changes needed (WorkflowTemplate model already supports this)

---

### GAP-003: No Feature Analysis Tool (MINOR)

**Problem**: BMAD Phase 1 (Analysis) requires codebase exploration before planning.

**Current Tools**:
- `knowledge_search` - searches existing knowledge, not codebase
- `knowledge_related` - graph traversal, not file analysis

**Missing**:
- No tool to analyze codebase for feature impact
- No tool to identify related files/modules

**BMAD Expectation**: Before planning a feature, agent should:
1. Identify related existing code
2. Find similar patterns already implemented
3. Detect potential conflicts

**Solution**: Add codebase analysis integration:

```typescript
// Option A: Use existing file context from ticket creation
// Ticket.context.files already supports file linking

// Option B: NEW MCP Tool for deep analysis
{
  name: "projectpulse_feature_analyze",
  description: "Analyze codebase impact for a feature",
  inputs: {
    featureDescription: string,
    targetModules: string[],   // ["API", "UI", "Database"]
  },
  output: {
    relatedFiles: string[],
    existingPatterns: string[],
    potentialConflicts: string[],
    suggestedApproach: string,
  }
}
```

**Implementation Effort**: ~2 days (if building analysis) or ~0 days (if using existing context.files)

---

### GAP-004: No Enforcement of Planning Before Implementation (MINOR)

**Problem**: Agents can skip directly to implementation without planning.

**BMAD Expectation**: Workflow should enforce:
1. Feature ticket MUST have `_implementationContext` before work starts
2. AgentSession should validate ticket has planning context
3. Checkpoint should warn if no plan exists

**Current State**:
- `agent_session_start` accepts any ticketId without validation
- No check for `_implementationContext` presence

**Solution**: Add validation layer:

```typescript
// In agent_session_start tool:
if (ticket.kind === 'feature' && !ticket.customFields?._implementationContext) {
  return {
    warning: "Feature ticket has no implementation plan. Consider running projectpulse_feature_plan_generate first.",
    proceed: true, // Non-blocking warning
  };
}
```

**Implementation Effort**: ~0.5 day
- Add validation in `agent_session_start`
- Return warning (not error) to maintain backward compatibility

---

### GAP-005: No Per-Feature Traceability Validation (MINOR)

**Problem**: `traceability_validate_documents` validates project-level docs, not per-feature.

**BMAD Expectation**: Each feature should trace back to:
- Original requirement (FR-xxx)
- Backlog item
- Sprint assignment

**Current State**:
- `Ticket.backlogRefs` exists - ✅
- `Ticket.sprintNumber` exists - ✅
- No tool to validate a specific feature's traceability

**Solution**: Add per-feature traceability check:

```typescript
// NEW MCP Tool: projectpulse_feature_validate_traceability
{
  name: "projectpulse_feature_validate_traceability",
  inputs: { ticketId: number },
  output: {
    hasBacklogRefs: boolean,
    hasSprintAssignment: boolean,
    hasImplementationPlan: boolean,
    hasAcceptanceCriteria: boolean,
    completenessScore: number, // 0-100
    gaps: string[],
  }
}
```

**Implementation Effort**: ~1 day

---

## Part 4: What's Already Working for Per-Feature BMAD

### 4.1 Immediate BMAD Workflow (No Code Changes)

You can run BMAD per-feature TODAY using existing tools:

```
# PHASE 1: ANALYSIS
projectpulse_context_load(projectId: 6)                    # Load project context
projectpulse_knowledge_search(query: "authentication patterns")  # Research existing
projectpulse_persona_get(slug: "architect")                # Load architect persona

# PHASE 2: PLANNING  
projectpulse_ticket_create({
  kind: "feature",
  title: "Add OAuth2 authentication",
  description: "...",
  customFields: {
    "_implementationContext": {
      "implementationBlueprint": "# Plan\n1. Add OAuth provider\n2. Create middleware...",
      "filesToModify": [...],
      "schemaChanges": {...}
    }
  }
})

# PHASE 3: SOLUTIONING (via ticket update)
projectpulse_ticket_update({
  ticketId: 100,
  customFields: {
    "_implementationContext": {
      "phaseSprintRef": { "displayName": "Phase 1 / Sprint 2" },
      "filesToCreate": [{ "path": "src/auth/oauth.ts", "purpose": "OAuth handler" }],
      ...
    }
  }
})

# PHASE 4: IMPLEMENTATION
projectpulse_agent_session_start({
  name: "Implementing OAuth2",
  plan: "...",
  todos: [...],
  activeTicketIds: [100]
})
# ... work with checkpoints ...
projectpulse_agent_session_end({ sessionId, progress: "Completed OAuth2" })
```

### 4.2 Existing BMAD-Compatible Features

| Feature | How It Maps to BMAD | Functional? |
|---------|---------------------|-------------|
| `_implementationContext.implementationBlueprint` | Planning phase output | ✅ Yes |
| `_implementationContext.filesToModify/Create` | Solutioning phase output | ✅ Yes |
| `AgentSession.plan` + `AgentSession.todos` | Implementation tracking | ✅ Yes |
| `persona_get` + invoke persona | Specialized agent consultation | ✅ Yes |
| `workflow_start` with custom workflow | Orchestrated BMAD cycle | ✅ Yes (needs template) |
| `ticket_getHierarchy` | Feature → Tasks breakdown | ✅ Yes |

---

## Part 5: Recommended Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)

| Item | Effort | Impact |
|------|--------|--------|
| Seed BMAD workflow templates (GAP-002) | 4h | High |
| Add planning validation warning in `agent_session_start` (GAP-004) | 4h | Medium |

### Phase 2: Core BMAD Tools (3-5 days)

| Item | Effort | Impact |
|------|--------|--------|
| `projectpulse_feature_plan_generate` tool (GAP-001) | 2d | **Critical** |
| `projectpulse_feature_validate_traceability` tool (GAP-005) | 1d | Medium |
| Feature planning prompt templates | 1d | High |

### Phase 3: Advanced (Optional, 3-5 days)

| Item | Effort | Impact |
|------|--------|--------|
| `projectpulse_feature_analyze` codebase analysis (GAP-003) | 2d | Medium |
| Per-feature mini-PRD document generation | 2d | Medium |
| BMAD dashboard in web UI | 3d | Low |

---

## Part 6: Summary

### What ProjectPulse Has (Working)

✅ **75 MCP tools** covering all BMAD phases
✅ **Ticket hierarchy** (Feature → Task) with `_implementationContext`
✅ **Agent personas** (Architect, Developer, QA, etc.)
✅ **Workflow orchestration** (start, execute, pause, resume, complete)
✅ **Knowledge base** with hybrid search
✅ **Memory banks** for context management
✅ **Agent sessions** for work tracking
✅ **Traceability** at project level

### What's Missing for Full BMAD Adoption

❌ **No dedicated feature planning tool** - agents must manually populate `_implementationContext`
❌ **No pre-seeded BMAD workflow templates** - need to create manually
❌ **No planning enforcement** - agents can skip planning
❌ **No per-feature traceability validation** - only project-level exists

### Bottom Line

**ProjectPulse is 80% ready for BMAD**. The infrastructure exists, but the "glue" tools that make BMAD a first-class workflow are missing. With ~5 days of implementation:

1. **Day 1-2**: Seed BMAD workflow templates + add planning validation
2. **Day 3-4**: Build `feature_plan_generate` tool
3. **Day 5**: Build `feature_validate_traceability` tool + prompt templates

After this, agents can run full BMAD cycles per-feature using:
```
projectpulse_workflow_start(templateId: "bmad-feature-development")
```

---

## Appendix A: Existing `_implementationContext` Schema

Already supported in `Ticket.customFields`:

```typescript
interface ImplementationContext {
  phaseSprintRef?: {
    displayName: string;  // "Phase 1 / Sprint 2"
    phaseId?: string;
    sprintId?: string;
  };
  filesToModify?: Array<{
    path: string;
    estimatedChanges: "minor" | "moderate" | "major";
    reason: string;
  }>;
  filesToCreate?: Array<{
    path: string;
    purpose: string;
    template?: "component" | "api" | "test";
  }>;
  schemaChanges?: {
    required: boolean;
    migrationName?: string;
    models: string[];
    description: string;
  };
  implementationBlueprint?: string;  // Markdown plan
}
```

## Appendix B: Recommended BMAD Workflow Template

```json
{
  "name": "BMAD Feature Development",
  "description": "4-phase BMAD methodology for feature development",
  "category": "development",
  "steps": [
    {
      "name": "1. Analysis",
      "description": "Research existing patterns and dependencies",
      "action": "manual",
      "guidance": "Use knowledge_search and context_load to understand existing codebase"
    },
    {
      "name": "2. Planning",
      "description": "Create feature specification",
      "action": "manual",
      "guidance": "Create ticket with title, description, and initial implementationContext"
    },
    {
      "name": "3. Solutioning", 
      "description": "Design technical approach",
      "action": "manual",
      "guidance": "Populate filesToModify, filesToCreate, schemaChanges, implementationBlueprint"
    },
    {
      "name": "4. Plan Review",
      "description": "Get human approval on plan",
      "action": "human_approval",
      "guidance": "Present plan to user, wait for approval before proceeding"
    },
    {
      "name": "5. Implementation",
      "description": "Execute plan with checkpoints",
      "action": "agent_session",
      "guidance": "Use agent_session_start, update every 15K tokens, end when complete"
    },
    {
      "name": "6. Verification",
      "description": "Verify all acceptance criteria",
      "action": "manual",
      "guidance": "Run tests, verify each requirement with evidence"
    },
    {
      "name": "7. Documentation",
      "description": "Update relevant documentation",
      "action": "manual", 
      "guidance": "Use wiki_update to document new feature"
    },
    {
      "name": "8. Completion",
      "description": "Mark feature complete",
      "action": "manual",
      "guidance": "Use ticket_setStatus to close, agent_session_end to finalize"
    }
  ]
}
```
