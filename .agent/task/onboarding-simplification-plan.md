# Onboarding Simplification Plan

**Status**: PAUSED - Waiting for Traceability Implementation
**Date**: 2025-12-18
**Resume When**: After traceability tool is implemented
**Scope**: Unify Session 3 to single path, update wiki guide, deprecate redundant tools

---

## Executive Summary

Simplify the onboarding flow by:
1. **Removing redundant tools**: `bootstrap`, `submitResponse` for Session 3
2. **Single canonical path**: Batch tools + `syncSession3`
3. **Wiki guide as source of truth**: Step-by-step instructions for agents
4. **Post-onboarding workflow**: Traceability → Roadmap (separate from Session 3)

---

## Current vs Target State

### Current State (Confusing)
```
Session 3 has 4 paths:
├── PATH A: bootstrap (creates everything + writes files)
├── PATH B: batch tools (creates artifacts only)
├── PATH C: syncSession3 (marks complete after batch)
└── PATH D: submitResponse (marks complete, no artifacts)

Result: Different outcomes based on agent's path choice
```

### Target State (Simple)
```
Session 3 has 1 path:
└── Batch tools + syncSession3

Post-onboarding (wiki guide explains):
├── 1. Run traceability validation
├── 2. Create roadmap
└── 3. [Optional] Generate CLAUDE.md/AGENTS.md manually
```

---

## Components to Remove

### 1. Bootstrap Endpoint
- **File**: `apps/web/app/api/onboarding/bootstrap/route.ts`
- **Reason**: Replaced by batch tools
- **Dependencies**:
  - MCP tool `bootstrapTool.ts` (remove)
  - Server action in `actions.ts` (remove reference)
  - UI page `session-3/page.tsx` (refactor)

### 2. Bootstrap MCP Tool
- **File**: `apps/mcp-server/src/tools/onboarding/bootstrapTool.ts`
- **Reason**: Calls deprecated endpoint
- **Also update**: `apps/mcp-server/src/tools/index.ts` (remove registration)

### 3. submitResponse for Session 3
- **File**: `apps/mcp-server/src/tools/onboarding/submitResponseTool.ts`
- **Option A**: Remove entirely (if only used for quick submit)
- **Option B**: Keep for Sessions 1 & 2, block Session 3 usage
- **Needs investigation**: Is submitResponse used for Sessions 1 & 2?

### 4. UI References
- **File**: `apps/web/app/onboarding/session-3/page.tsx`
- **Change**: Remove bootstrap call, show batch tools guidance instead

---

## Components to Keep (Reusable)

### Utility Functions
| Function | File | Keep For |
|----------|------|----------|
| `detectTechStack()` | `lib/onboarding/tech-stack-detection.ts` | Batch tools use this |
| `createAgentPersonas()` | `lib/onboarding/create-agent-personas.ts` | Batch persona tool |
| `createSkills()` | `lib/onboarding/create-skills.ts` | Batch skill tool |
| `createWorkflowsAndSOPs()` | `lib/onboarding/create-workflows-sops.ts` | Batch workflow/SOP tool |

### Optional: New MCP Tool for Repo Files
| Function | Could Become |
|----------|--------------|
| `generateCLAUDEmd()` | `projectpulse_generate_claude_md` |
| `generateAGENTSmd()` | `projectpulse_generate_agents_md` |

**Decision needed**: Create new tool or let agent generate manually?

---

## Wiki Guide Update

### Existing Wiki Page
- **File**: `apps/web/lib/wiki/system-templates.ts`
- **Title**: "Onboarding Guide"
- **Path**: `/${projectSlug}/onboarding-guide` (cloned to each project)
- **Current Content**: OUTDATED - references old tools and bootstrap

### Content to Rewrite

The existing content needs complete rewrite to reflect new batch-based approach:

```markdown
# Onboarding Guide

## Overview
ProjectPulse uses a 3-session onboarding process followed by post-onboarding setup.

| Session | Focus | Output |
|---------|-------|--------|
| 1 | Strategic Planning | Executive summary, 96 Q&A pairs |
| 2 | Documentation | 15 industry-standard documents |
| 3 | AI Workflow Setup | Personas, skills, workflows, SOPs |
| Post | Traceability + Roadmap | Validated coverage, materialized roadmap |

---

## Session 1: Strategic Planning

### Step-by-Step Flow
1. `projectpulse_onboarding_getPhasePrompt({ phase: 1 })` - Get questions
2. Ask user the questions from each phase (1-10)
3. `projectpulse_onboarding_saveAnswers({ phase: 1, answers: {...} })` - Save
4. Repeat for phases 2-10
5. Session auto-completes after phase 10

### Tools Used
- `projectpulse_onboarding_getPhasePrompt` - Get questions for a phase
- `projectpulse_onboarding_saveAnswers` - Save phase answers

---

## Session 2: Document Generation

### Step-by-Step Flow
1. `projectpulse_onboarding_getDocBatchPrompt({ batch: 1 })` - Get prompts
2. Generate documents using YOUR AI provider
3. `projectpulse_onboarding_storeBatch({ batch: 1, documents: [...] })` - Store
4. Repeat for batches 2-4
5. Session auto-completes at 15 documents

### Batch Structure
| Batch | Documents |
|-------|-----------|
| 1 | PRD, SRS, Backlog, Project-Plan |
| 2 | Architecture, Data-Model, API-Spec |
| 3 | UI-UX, Security, Testing |
| 4 | Deployment, Observability, Performance, Team-Onboarding, Maintenance |

### Tools Used
- `projectpulse_onboarding_getDocBatchPrompt` - Get batch prompts with context
- `projectpulse_onboarding_storeBatch` - Store generated documents
- `projectpulse_onboarding_listDocuments` - Check progress

---

## Session 3: AI Workflow Setup

### Step-by-Step Flow
1. `projectpulse_batch_createPersonas({ personas: [...] })` - Create 1-10 personas
2. [Optional] `projectpulse_batch_createSkills({ skills: [...] })` - Create skills
3. [Optional] `projectpulse_batch_createWorkflows({ workflows: [...] })` - Create workflows
4. [Optional] `projectpulse_batch_createSOPs({ sops: [...] })` - Create SOPs
5. `projectpulse_onboarding_syncSession3()` - Mark session complete

### What Each Tool Creates
- **Personas**: Custom AI experts (React Expert, Prisma Expert, etc.)
- **Skills**: Reusable code patterns and conventions
- **Workflows**: Step-by-step development procedures
- **SOPs**: Standard operating procedures for common tasks

### Tools Used
- `projectpulse_batch_createPersonas` - Bulk create personas
- `projectpulse_batch_createSkills` - Bulk create skills
- `projectpulse_batch_createWorkflows` - Bulk create workflows
- `projectpulse_batch_createSOPs` - Bulk create SOPs
- `projectpulse_onboarding_syncSession3` - Mark onboarding complete

---

## Post-Onboarding Setup

After all 3 sessions complete, run these steps:

### Step 1: Validate Traceability
\`\`\`
projectpulse_traceability_validateDocuments()
\`\`\`
- Validates SRS→Backlog→Project-Plan coverage
- Identifies gaps (untraced requirements, unmapped features)
- Stores matrix as Knowledge Item

### Step 2: Create Roadmap
\`\`\`
projectpulse_roadmap_create({
  projectId: YOUR_ID,
  title: "Project Roadmap",
  materialize: true,
  phases: [...] // From Project-Plan document
})
\`\`\`
- Parses 13-Project-Plan.md structure
- Creates Phase → Sprint → Week → Day hierarchy
- Enables progress tracking

### Step 3: [Optional] Generate Repo Files
If you want CLAUDE.md and AGENTS.md in your repository:
- Use your AI's file write tools
- Reference the personas created in Session 3
- Follow your project's conventions

---

## Starting Development

After post-onboarding setup, your agent workflow is:

1. `projectpulse_context_load({ projectId: YOUR_ID })` - Load context + hints
2. `projectpulse_agent_session_start({ name: "Feature X" })` - Start work session
3. [Do your development work]
4. `projectpulse_agent_session_end({ summary: "..." })` - End session

See [[Development Workflow]] for detailed development patterns.
```

---

## Implementation Phases

### Phase 1: Analysis & Preparation
- [ ] Verify submitResponse usage for Sessions 1 & 2
- [ ] Identify all bootstrap references in codebase
- [ ] Create wiki guide template content

### Phase 2: Remove Deprecated Tools
- [ ] Delete `bootstrapTool.ts`
- [ ] Delete `bootstrap/route.ts`
- [ ] Update `tools/index.ts` (remove registration)
- [ ] Update/remove submitResponse for Session 3

### Phase 3: Update Wiki Guide
- [ ] Create/update onboarding wiki page template
- [ ] Add step-by-step instructions
- [ ] Add post-onboarding workflow

### Phase 4: UI Updates (if needed)
- [ ] Update Session 3 UI page
- [ ] Remove bootstrap references

### Phase 5: Testing
- [ ] Test complete onboarding flow with batch tools only
- [ ] Verify syncSession3 marks completion correctly
- [ ] Test wiki guide readability for agents

---

## Confirmed Decisions

| Question | Decision | Notes |
|----------|----------|-------|
| **submitResponse tool** | Keep, mark as "test only" | Update tool description to indicate test purposes |
| **Repo files** | Manual by agent | Wiki guide explains format, agent uses file write tools |
| **Wiki page location** | Existing "Onboarding Guide" | `apps/web/lib/wiki/system-templates.ts` - update content |
| **Migration** | N/A | Existing projects already onboarded; changes only affect new projects |

---

## Files Summary

### To Delete
```
apps/web/app/api/onboarding/bootstrap/route.ts
apps/mcp-server/src/tools/onboarding/bootstrapTool.ts
```

### To Modify
```
apps/mcp-server/src/tools/index.ts (remove bootstrap registration)
apps/mcp-server/src/tools/onboarding/submitResponseTool.ts (block Session 3?)
apps/web/app/onboarding/session-3/page.tsx (remove bootstrap call)
```

### To Create/Update
```
Wiki page template: Onboarding Guide
```

### To Keep (No Changes)
```
apps/web/lib/onboarding/tech-stack-detection.ts
apps/web/lib/onboarding/create-agent-personas.ts
apps/web/lib/onboarding/create-skills.ts
apps/web/lib/onboarding/create-workflows-sops.ts
apps/web/lib/onboarding/generate-repo-files.ts
apps/web/app/api/onboarding/sync-session3/route.ts
```

---

## Dependencies

**This plan depends on:**
1. ✅ Traceability tool (`projectpulse_traceability_validateDocuments`) - GPT updating spec
2. ⏳ Once traceability is implemented, resume this plan

**Order of implementation:**
1. **First**: Traceability tool (in progress with GPT)
2. **Then**: This onboarding simplification plan
3. **Finally**: Test complete flow: Onboarding → Traceability → Roadmap
