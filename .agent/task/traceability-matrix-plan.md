# Post-Onboarding Traceability Matrix (Document-Level)

**Date**: 2025-12-18 (FINAL)

**Feature**: Document-Based Traceability Matrix (Docs → Roadmap → Tickets)

**Status**: READY FOR IMPLEMENTATION

**Depends On**:
- Ticket hierarchy fields (✅ implemented): `parentTicketId`, `epicRef`, `backlogRefs`, `sprintNumber`
- Session 2 docs stored in `Document` table (✅ implemented)
- Ticket coverage matrix tool (✅ implemented): `projectpulse_traceability_generate`

---

## Executive Summary

Implement a **document-level traceability validator** that cross-references the Session 2 generated docs to ensure nothing is lost between planning artifacts:

**PRD → SRS → Backlog → Project Plan**

This validator generates a **Document Traceability Matrix** and stores it as a **KnowledgeItem** (`category='traceability'`) for later retrieval during sprint planning / ticket creation.

**Two Traceability Matrices (distinct):**
1. **Document Traceability** (THIS FEATURE): validates planning docs before roadmap + tickets.
2. **Ticket Coverage Traceability** (already done): validates that tickets cover expected refs using `Ticket.backlogRefs`.

---

## 1. Problem Statement

### Current Risk
Even if Session 2 generated all planning docs, gaps can still occur:
- Backlog items that don’t map to a sprint in the project plan
- SRS FRs that aren’t covered by any backlog item
- SRS PRD references that point to non-existent PRD sections

This leads to roadmap creation that silently misses work, and later development that misses requirements.

### Goal
Before roadmap creation (materialization) and before sprint execution, prove:
1. SRS requirements are valid and traced to PRD
2. Backlog covers all functional requirements
3. Project plan sprints include all backlog items (so roadmap will not miss them)

---

## 2. Canonical Data Source (Source of Truth)

**Source of truth: Session 2 `Document` records** (NOT wiki pages).

Fetch from latest completed Session 2:
- Find `OnboardingSession` where `(projectId, sessionNumber=2, status='complete')` ordered by `completedAt DESC`.
- Load these docs (match by `contains` to be robust across filename variants):
  - PRD: filename contains `01-PRD`
  - SRS: filename contains `02-SRS`
  - Backlog: filename contains `12-Backlog`
  - Project Plan: filename contains `13-Project-Plan`

Notes:
- In this repo today, Session 2 uses filenames like `01-PRD.md`, `02-SRS.md`, etc.
- We intentionally match by `contains` so we still work if a future environment stores filenames without `.md`.

If any are missing → return `MISSING_DOCUMENTS` with an explicit list.

---

## 3. Required Document Contracts (for “perfect traceability”)

### 3.1 SRS (02-SRS)
- Requirements must be labeled: `FR-###` and `NFR-###`.
- Each requirement should include a PRD trace line, e.g.:
  - `Traces to: PRD Section X.Y.Z`

### 3.2 Backlog (12-Backlog)
Hybrid ID strategy:
- Accept epics as `EPIC-###` and/or `Epic 1`.
- Accept backlog items as `US-###` (and/or `US-1.1.1`) **and/or** `Feature 1.1`.

Each backlog item must include:
- `Traces to: FR-###` (required)
- `Traces to: NFR-###` (optional)
- Sprint assignment (`Sprint: 1` or `Sprint 1 (Weeks 1-2)`)

### 3.3 Project Plan (13-Project-Plan)
To guarantee “no backlog items missing from project plan”, each sprint section must include a structured list:

```md
**Scope (Backlog Items):**
- EPIC-001 / US-003 (FR-012)
- US-004 (FR-013, NFR-002)
```

This contract is required because sprint goals/deliverables alone are not uniquely machine-matchable to backlog items.

---

## 4. NFR Handling (expert recommendation)

NFRs are cross-cutting quality constraints, not feature units.

### Policy
- **FR coverage is required and counted** in coverage %.
- **NFRs are informational by default**:
  - They are parsed and shown.
  - They are **not included in the main coverage %**.
  - Optional strict mode: `strictNfr=true` enforces that NFRs must be referenced by at least one backlog item.

### Why
- Meaningful coverage metrics should measure deliverable feature work.
- Developers still need NFR visibility (performance/security/a11y), but NFRs are not usually planned as isolated “features”.

---

## 5. API + MCP Tool

### 5.1 API Endpoint (NEW)
`POST /api/traceability/validate-documents`

Input:
- `projectId?: number`
- `force?: boolean` (default false)
- `strict?: boolean` (default true)
- `strictNfr?: boolean` (default false)

Output:
- `coverage`:
  - `frCoveragePercent`
  - `backlogItemCoveragePercent`
  - `planMappingCoveragePercent`
- `nfrSummary`: totals + referenced/unreferenced
- `gaps`: structured arrays for action
- `knowledgeItemId`

### 5.2 MCP Tool (NEW)
`projectpulse_traceability_validate_documents`
- Calls the API
- Returns concise summary + top gaps + `knowledgeItemId`.

---

## 6. Storage: Knowledge Item (IMPORTANT)

Store the matrix as a `KnowledgeItem` (`category='traceability'`).

Implementation note (schema constraint):
- In this repo, `KnowledgeItem` requires non-null `embedding` (vector) and `contentTsvector`.
- Therefore, store via **raw SQL insert + `generateEmbedding()`**, following the existing `/api/traceability/generate` implementation.

---

## 7. Project Plan Template Update (required)

Update the Session 2 Batch 1 template (the `13-Project-Plan` section) so each sprint includes:
- `**Scope (Backlog Items):**` list with backlog IDs (and optionally FR/NFR IDs).

This is required for plan↔backlog “perfect” mapping.

---

## 8. Files to Create/Modify (NO hint work)

### CREATE
- `apps/web/app/api/traceability/validate-documents/route.ts`
- `apps/web/lib/traceability/parsers.ts`
- `apps/web/lib/traceability/analysis.ts`
- `apps/web/lib/traceability/markdown.ts`
- `apps/web/lib/traceability/__tests__/validate-documents.test.ts`
- `apps/mcp-server/src/tools/traceability/validateDocumentsTool.ts`

### MODIFY
- `apps/mcp-server/src/tools/index.ts` (register tool)
- `apps/web/prisma/seeds/onboarding-prompt-templates.ts` (Session 2 template update)

---

## 9. Success Criteria

- [ ] Can validate PRD↔SRS↔Backlog↔Plan completeness using Session 2 `Document`s.
- [ ] FR coverage computed and correct.
- [ ] Plan↔Backlog mapping validated via per-sprint scope list.
- [ ] NFRs shown and optionally enforced (`strictNfr`).
- [ ] KnowledgeItem created with embedding + tsvector.
- [ ] MCP tool returns usable summary.

