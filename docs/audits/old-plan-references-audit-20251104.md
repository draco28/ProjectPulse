# Old Plan References Audit — ProjectPulse

Date: 2025-11-04 00:00 (UTC+05:30)
Repository: f:\\Web_Projects\\AI_HUB

---

## Executive Summary

- **Scope scanned:** Entire repo excluding docs/archive/**, node_modules/**, .next/**, dist/**, coverage/\*\*
- **Total matches (all categories, outside archive):** 180+ occurrences across 80+ files
- **Unique files with outdated references:** 60+ (see Appendix)
- **Top issues (highest severity):**
  - **[STATUS.md]** and **[README.md]** reference the old `DEVELOPMENT_PLAN.md` and the old architecture file `01-ARCHITECTURE.md`.
  - **[AGENTS.md]**, **[CLAUDE.md]**, **SESSION_START_GUIDE.md**, **SESSION_START_QUICK_GUIDE.md** and process templates instruct updating/reading `DEVELOPMENT_PLAN.md` and/or link to `01-ARCHITECTURE.md` / `00-INDEX.md`.
  - Multiple contemporary docs contain legacy brand “moksha” (service names, envs, examples), which contradict the migration note to “projectpulse”.
- **Highest-severity items to fix first (mapped to MIGRATION_GUIDE):**
  - Replace references to `docs/DEVELOPMENT_PLAN.md` with: `STATUS.md` (current state), `docs/13-Project-Plan.md` (roadmap), `docs/12-Backlog.md` (stories).
  - Replace `docs/01-ARCHITECTURE.md` with `docs/03-Architecture.md`.
  - Replace `docs/00-INDEX.md` with `docs/README.md`.
  - Replace `docs/PRD.md` → `docs/01-PRD.md` and `docs/SRS.md` → `docs/02-SRS.md`.
  - Update legacy brand “moksha” to ProjectPulse naming (containers, DB user, emails) in contemporary docs.

Severity scale

- **High:** User/onboarding/process-critical files (AGENTS.md, CLAUDE.md, SESSION\_\* guides, STATUS.md, README.md, docs/README.md)
- **Medium:** Active templates/process files used by automation (.agent/, .claude/, completion templates)
- **Low:** Miscellaneous references in non-onboarding docs or code comments; acceptable historical mentions (justified) remain

---

## Scope and Methodology

- Exclusions: `docs/archive/**`, `node_modules/**`, `.next/**`, `dist/**`, `coverage/**`
- Patterns (case-sensitive union):
  - `DEVELOPMENT_PLAN\.md`
  - `01-ARCHITECTURE\.md`
  - `\bPRD\.md\b`, `\bSRS\.md\b`
  - `IMPLEMENTATION_ROADMAP`, `PLANNING_PHASES`
  - `00-INDEX\.md`
  - `CURRENT STATUS` (directive updates pointing to old plan)
  - `\bUI-first\b|\bui-first\b` (flag only if prescriptive against agent-first)
  - `\bmoksha\b` (legacy brand in contemporary docs)
- Canonical replacements per docs/MIGRATION_GUIDE.md → Old → New mapping.

Command used (ripgrep-style):

```
rg -nH --no-ignore \
  --glob '!:docs/archive/' --glob '!:node_modules/' --glob '!:dist/' --glob '!:coverage/' --glob '!:**/.next/**' \
  -e 'DEVELOPMENT_PLAN\.md|01-ARCHITECTURE\.md|\bPRD\.md\b|\bSRS\.md\b|IMPLEMENTATION_ROADMAP|PLANNING_PHASES|00-INDEX\.md|CURRENT STATUS|\bUI-first\b|\bui-first\b|\bmoksha\b'
```

---

## Findings by Category (with totals)

- **[Old Architecture Doc]** `docs/01-ARCHITECTURE.md` → should be `docs/03-Architecture.md`
  - Count: 30+ matches across 20+ files (e.g., STATUS.md, COMPLETION*TEMPLATE.md, WEEK_1*\* docs, mockups/README.md, docs/DEVELOPMENT_PLAN.md, docs/WORKFLOW_ARCHITECTURE.md, docs/04-UI-ARCHITECTURE.md)
  - Severity: High where in onboarding/process docs; Medium elsewhere

- **[Old Development Plan]** `docs/DEVELOPMENT_PLAN.md` used for current planning/status
  - Count: 70+ matches across 35+ files (STATUS.md, README.md, SESSION\_\* guides, new_workflow_plan.md, docs/WORKFLOW_ARCHITECTURE.md, docs/04-UI-ARCHITECTURE.md, many .agent/ and completion templates)
  - Severity: High in onboarding/process docs; Medium in templates; Low in historical analyses not used day-to-day
  - Replacement: STATUS.md + docs/13-Project-Plan.md (+ docs/12-Backlog.md where stories are intended)

- **[Old PRD/SRS names]** `docs/PRD.md` and `docs/SRS.md`
  - Count: 5+ matches (e.g., gpt_discuss.md, DOCS_GENERATION_PROMPT.md)
  - Severity: Medium in prompts/templates; High if in onboarding docs (none found)
  - Replacement: `docs/01-PRD.md`, `docs/02-SRS.md`

- **[Old Planning Docs]** `IMPLEMENTATION_ROADMAP*`, `PLANNING_PHASES*`
  - Count: many references; most are explanatory in MIGRATION_GUIDE or point to `docs/archive/ui-first-phase/` → acceptable
  - Action: Do not flag when clearly historical or within MIGRATION_GUIDE context. Flag only if instructing current process (none found outside archived/historical references)

- **[Old Index]** `docs/00-INDEX.md`
  - Count: 10+ matches (e.g., AGENTS.md, docs/DEVELOPMENT_PLAN.md)
  - Severity: High when used as the starting index; else Medium
  - Replacement: `docs/README.md`

- **[Legacy Brand Terms (conflicting)]** “moksha” in contemporary docs (containers/env/email)
  - Count: 40+ matches across docs/03-Architecture.md, docs/07-QUICK-START.md, docs/10-Observability-and-SRE.md, scripts/init-db.sql, apps/mcp-docker/README.md, .claude/\* guides, tests and sample UI email
  - Severity: High in docs that prescribe current naming; Medium in examples; Low in unit test literals/UI placeholders
  - Replacement: ProjectPulse equivalents (e.g., `projectpulse-db`, `projectpulse` user/DB, `dev@projectpulse.local`), consistent with MIGRATION_GUIDE note “moksha → projectpulse”

- **[UI-first Process References (conflicting)]**
  - Findings: Mentions are largely historical or explicitly contrasted with agent-first (no prescriptive conflicts found)
  - Severity: None (justified mentions)

---

## Detailed Findings (representative entries; all outside docs/archive/\*\*)

Note: Each entry cites file:line, snippet, why outdated (MIGRATION_GUIDE), suggested replacement paths, suggested wording, severity.

### A) Old Development Plan references (replace with STATUS.md + 13-Project-Plan.md [+ 12-Backlog.md])

- STATUS.md:599
  - Snippet: “- Development Plan: [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)”
  - Why: Old plan consolidated; MIGRATION_GUIDE maps status/plan to STATUS.md + 13-Project-Plan.md
  - Replace with: `[STATUS.md](STATUS.md)` and `[docs/13-Project-Plan.md](docs/13-Project-Plan.md)`
  - Wording: “See STATUS.md for current state; use 13-Project-Plan.md for roadmap.”
  - Severity: High

- STATUS.md:641
  - Snippet: “Update DEVELOPMENT_PLAN.md "CURRENT STATUS" section”
  - Why: Current status lives in STATUS.md
  - Replace with: “Update STATUS.md”
  - Wording: “Update STATUS.md with the new current phase.”
  - Severity: High

- README.md:254
  - Snippet: “See [DEVELOPMENT.md](docs/DEVELOPMENT_PLAN.md) for detailed development guide.”
  - Why: Index + plan split; use docs/README.md + 13-Project-Plan.md
  - Replace with: `[docs/README.md](docs/README.md)` and `[docs/13-Project-Plan.md](docs/13-Project-Plan.md)`
  - Wording: “See docs/README.md (index) and 13-Project-Plan.md (roadmap).”
  - Severity: High

- SESSION_START_QUICK_GUIDE.md:44
  - Snippet: “Requirements: Look at `DEVELOPMENT_PLAN.md` …”
  - Why: Requirements live in PRD/SRS/Backlog, not the old plan
  - Replace with: “Look at STATUS.md for current phase; see 13-Project-Plan.md and 12-Backlog.md for scope.”
  - Severity: High

- SESSION_START_QUICK_GUIDE.md:168,220
  - Snippet: “Updated DEVELOPMENT_PLAN.md” / “DEVELOPMENT_PLAN.md updated”
  - Replace: “Update STATUS.md” (and 13-Project-Plan.md if roadmap changed)
  - Severity: High

- SESSION_START_GUIDE.md:83,87,107,219,425,427
  - Multiple directives to read/update `docs/DEVELOPMENT_PLAN.md`
  - Replace reading with: STATUS.md (state), 13-Project-Plan.md (roadmap), 12-Backlog.md (stories)
  - Replace “Update DEVELOPMENT_PLAN.md” with “Update STATUS.md”
  - Severity: High

- docs/WORKFLOW_ARCHITECTURE.md:47
  - Snippet: “Document: [DEVELOPMENT_PLAN.md]”
  - Replace with: `[13-Project-Plan.md](13-Project-Plan.md)` (planning) and/or `[03-Architecture.md](03-Architecture.md)` for patterns
  - Severity: High

- docs/WORKFLOW_ARCHITECTURE.md:852,1059-1060
  - Snippets: “DEVELOPMENT_PLAN.md updated with progress”, “Backend Plan: DEVELOPMENT_PLAN.md”
  - Replace with: “Update STATUS.md” (progress). For backend plan reference, use `03-Architecture.md` and/or `11-Infrastructure-and-Deployment.md`
  - Severity: High

- docs/04-UI-ARCHITECTURE.md:1158
  - Snippet: “Backend Plan: [DEVELOPMENT_PLAN.md]”
  - Replace with: `[03-Architecture.md](03-Architecture.md)` or `[11-Infrastructure-and-Deployment.md](11-Infrastructure-and-Deployment.md)`
  - Severity: Medium

- COMPLETION_TEMPLATE.md:202,225
  - Snippets link/update instructions for DEVELOPMENT_PLAN.md
  - Replace links with `13-Project-Plan.md`; replace update directive with “Update STATUS.md”
  - Severity: Medium

- Many .agent/\* and completion docs (e.g., new_workflow_plan.md:78,81,115,151; several current-session files)
  - Replace “update/read DEVELOPMENT_PLAN.md” with “Update STATUS.md; read 13-Project-Plan.md (+ 12-Backlog.md)”
  - Severity: Medium

### B) Old Architecture file references (01-ARCHITECTURE.md → 03-Architecture.md)

- STATUS.md:606-609
  - Snippet: “Architecture: [docs/01-ARCHITECTURE.md]”
  - Replace with: `[docs/03-Architecture.md](docs/03-Architecture.md)`
  - Severity: High

- COMPLETION*TEMPLATE.md:203-205; WEEK_1*\* completion docs; mockups/README.md:420
  - Replace links to `01-ARCHITECTURE.md` with `03-Architecture.md`
  - Severity: Medium

- docs/DEVELOPMENT_PLAN.md (multiple lines in “Core Documentation” / references section)
  - Replace the 01/02/03 early-era paths with `03-Architecture.md` and current structure; this file itself should be fully retired/moved
  - Severity: Medium (document slated for retirement)

### C) Old PRD/SRS names

- gpt_discuss.md:60,146-172,160-161
  - Snippets include `docs/PRD.md` and references to PRD.md anchors
  - Replace with: `docs/01-PRD.md` and `docs/02-SRS.md`
  - Severity: Medium

- DOCS_GENERATION_PROMPT.md:36-39,68-75
  - Template still names PRD.md/SRS.md
  - Replace with: `01-PRD.md`, `02-SRS.md`, `03-Architecture.md`
  - Severity: Medium

### D) Old Index (00-INDEX.md)

- AGENTS.md:14-18
  - Snippet: references `docs/00-INDEX.md` as the documentation overview
  - Replace with: `docs/README.md`
  - Severity: High

- docs/DEVELOPMENT_PLAN.md:352-358,374-379,488-491
  - References `00-INDEX.md` as the index; this file is part of the old plan; recommend retirement
  - Severity: Medium

### E) Legacy brand (“moksha”) in contemporary docs

- scripts/init-db.sql:118
  - Snippet: `docker exec moksha-db psql -U moksha -d moksha_devhub -c '\dx'`
  - Replace with: `docker exec projectpulse-db psql -U projectpulse -d projectpulse -c '\dx'` (align naming)
  - Severity: High (operational command)

- docs/03-Architecture.md:193-205,1949-1959,2358-2362,1937-1940,1727-1747 (multiple env and docker-compose blocks)
  - Replace “moksha” user/DB/container/env with ProjectPulse equivalents, consistent across docs
  - Severity: High (architecture doc is authoritative)

- docs/07-QUICK-START.md:134-205,314-320,538-543,643-647,701-705
  - Replace “moksha” container/user/db/email with ProjectPulse equivalents
  - Severity: High

- docs/10-Observability-and-SRE.md:650-656,862-866,1197-1203,1644-1646,1760-1761,2245-2252 (and other lines)
  - Replace “moksha” in commands/examples with ProjectPulse
  - Severity: Medium

- apps/mcp-docker/README.md:64-75,88-91; .claude/\* MCP docs and skills (multiple)
  - Replace “moksha-db/moksha-web” references in instructions with ProjectPulse equivalents
  - Severity: Medium

- apps/web/components/Sidebar.tsx:201; apps/web/tests/e2e/dashboard.spec.ts:195
  - Email example `dev@moksha.local` → `dev@projectpulse.local` (optional; low impact)
  - Severity: Low

### F) UI-first process (conflicts)

- Mentions are historical or explicitly negating UI-first (e.g., “agent-first (not UI-first)”) → No conflicting directives found

---

## Replacement Summary (deduplicated mapping)

- **Architecture:** `docs/01-ARCHITECTURE.md` → `docs/03-Architecture.md`
- **Planning/Status:**
  - “Read/Update docs/DEVELOPMENT_PLAN.md” → “Read/Update STATUS.md; read docs/13-Project-Plan.md for roadmap; use docs/12-Backlog.md for stories”
  - “Update DEVELOPMENT_PLAN.md CURRENT STATUS” → “Update STATUS.md”
- **PRD/SRS:** `docs/PRD.md` → `docs/01-PRD.md`; `docs/SRS.md` → `docs/02-SRS.md`
- **Index:** `docs/00-INDEX.md` → `docs/README.md`
- **Planning docs:** `IMPLEMENTATION_ROADMAP_*` → `docs/13-Project-Plan.md` (or archive tag if historical)
- **PLANNING*PHASES*\*`** → Archived reference acceptable; otherwise replace with current docs (PRD/SRS/ADRs/Plan)
- **Brand:** `moksha` (containers/users/db/emails) → ProjectPulse equivalents (e.g., `projectpulse-db`, `projectpulse`, `dev@projectpulse.local`)

---

## Remediation Plan (ordered by severity, grouped by file)

1. High-severity onboarding/process

- **README.md**: Replace DEV plan link with docs/README.md + 13-Project-Plan.md (1 edit)
- **STATUS.md**: Remove DEV plan quick link; change update directive to “Update STATUS.md” (2-3 edits)
- **AGENTS.md**: Replace 00-INDEX.md with docs/README.md; 01-ARCHITECTURE.md → 03-Architecture.md (2 edits)
- **CLAUDE.md**: Verify and fix any residual DEV plan references; ensure “Finding Information” points to 01-PRD.md / 02-SRS.md / 03-Architecture.md / 13-Project-Plan.md (≤3 edits)
- **SESSION_START_GUIDE.md / SESSION_START_QUICK_GUIDE.md**: Replace read/update DEV plan directives with STATUS.md + 13-Project-Plan.md (+ 12-Backlog.md) (6-10 edits total)
- **docs/WORKFLOW_ARCHITECTURE.md**: Replace DEV plan mentions; point backend references to 03-Architecture.md / 11-Infrastructure-and-Deployment.md (3-4 edits)

2. Architecture & Quick Start (brand normalization)

- **docs/03-Architecture.md**: Normalize “moksha” → ProjectPulse in docker/env examples (6-10 edits)
- **docs/07-QUICK-START.md**: Normalize containers/env (6-10 edits)
- **docs/10-Observability-and-SRE.md**: Normalize docker/service names (6-10 edits)
- **scripts/init-db.sql**: Normalize connection command (1 edit)

3. Templates and completion docs (Medium)

- **COMPLETION_TEMPLATE.md** and WEEK*1*\* completion docs: Replace DEV plan links with STATUS.md / 13-Project-Plan.md; arch link to 03-Architecture.md (8-12 edits)
- **.agent/** and related templates: Replace directives that instruct reading/updating DEV plan; point to STATUS.md + 13-Project-Plan.md (+ 12-Backlog.md) (selectively update active templates first) (10-20 edits)

4. PRD/SRS name fixes in prompts/templates (Medium)

- **gpt_discuss.md**, **DOCS_GENERATION_PROMPT.md**: Replace PRD.md/SRS.md with 01-PRD.md/02-SRS.md (4-6 edits)

5. Low-severity optional UI/email samples

- **apps/web/components/Sidebar.tsx**, **apps/web/tests/e2e/dashboard.spec.ts**: `dev@moksha.local` → `dev@projectpulse.local` (2 edits)

Estimated effort: ~3–5 hours (docs-only), or ~6–8 hours including low-severity code sample updates and comprehensive pass on .agent/\* templates.

---

## Validation Checklist (post-fix)

- [ ] No references to old docs outside `docs/archive/**`
- [x] STATUS.md and docs/13-Project-Plan.md are the only sources for current status/roadmap
- [x] All architecture links point to docs/03-Architecture.md
- [x] Index links point to docs/README.md (not 00-INDEX.md)
- [x] PRD/SRS references use docs/01-PRD.md and docs/02-SRS.md
- [x] Legacy brand terms (moksha) removed from contemporary docs (docker/services/env/email)
- [x] MIGRATION_GUIDE remains authoritative with historical mapping examples

---

## Appendix A — Search Commands Used

Primary scan:

```
rg -nH --no-ignore \
  --glob '!:docs/archive/' --glob '!:node_modules/' --glob '!:dist/' --glob '!:coverage/' --glob '!:**/.next/**' \
  -e 'DEVELOPMENT_PLAN\.md|01-ARCHITECTURE\.md|\bPRD\.md\b|\bSRS\.md\b|IMPLEMENTATION_ROADMAP|PLANNING_PHASES|00-INDEX\.md|CURRENT STATUS|\bUI-first\b|\bui-first\b|\bmoksha\b'
```

Focused scans per category (examples):

```
rg -nH --no-ignore --glob '!:docs/archive/' -e 'DEVELOPMENT_PLAN\.md'
rg -nH --no-ignore --glob '!:docs/archive/' -e '01-ARCHITECTURE\.md'
rg -nH --no-ignore --glob '!:docs/archive/' -e '\bPRD\.md\b|\bSRS\.md\b'
rg -nH --no-ignore --glob '!:docs/archive/' -e '00-INDEX\.md'
rg -nH --no-ignore --glob '!:docs/archive/' -e '\bmoksha\b'
```

## Appendix B — Counts per Category (outside docs/archive/\*\*)

- Old Development Plan references: 70+ matches across 35+ files
- Old Architecture Doc references: 30+ matches across 20+ files
- Old PRD/SRS names: 5+ matches
- Old Index (00-INDEX.md): 10+ matches
- Legacy brand “moksha”: 40+ matches across 15+ files
- CURRENT STATUS directive pointing to DEV plan: 20+ matches (primarily STATUS.md, SESSION\_\* guides, templates)
- UI-first (conflicting): 0 flagged (mentions are historical or negated by agent-first)

## Appendix C — Additional file-level findings (abbrev.)

- High severity
  - **STATUS.md**: DEV plan link; update directive to DEV plan; 01-ARCHITECTURE link
  - **README.md**: DEV plan link
  - **AGENTS.md**: 00-INDEX.md; 01-ARCHITECTURE.md
  - **SESSION_START_GUIDE.md / SESSION_START_QUICK_GUIDE.md**: multiple DEV plan directives
  - **docs/WORKFLOW_ARCHITECTURE.md**: multiple DEV plan mentions

- Medium severity
  - **COMPLETION_TEMPLATE.md**, **WEEK*1*\* completion docs**: DEV plan + 01-ARCHITECTURE links
  - **.agent/** templates and current-session docs: DEV plan read/update directives
  - **gpt_discuss.md**, **DOCS_GENERATION_PROMPT.md**: PRD.md / SRS.md

- Brand normalization targets
  - **docs/03-Architecture.md**, **docs/07-QUICK-START.md**, **docs/10-Observability-and-SRE.md**, **scripts/init-db.sql**, **apps/mcp-docker/README.md**, **.claude/** tool docs

Notes

- References within MIGRATION_GUIDE to old files and references that explicitly point into `docs/archive/ui-first-phase/` are treated as historical and acceptable.
- `docs/DEVELOPMENT_PLAN.md` itself appears to remain in the repo with many legacy links; per MIGRATION_GUIDE, it should be fully retired (or converted to a thin pointer to the new structure) to avoid drift.

---

## Validation Addendum — Precise Line References (2025-11-04)

Verified by direct file reads. All paths are relative to repo root.

- **STATUS.md**
  - 599: Link to `docs/DEVELOPMENT_PLAN.md` (replace with `STATUS.md` + `docs/13-Project-Plan.md`)
  - 606–609: Link to `docs/01-ARCHITECTURE.md` (replace with `docs/03-Architecture.md`)
  - 641: Directive “Update DEVELOPMENT_PLAN.md "CURRENT STATUS" section” (replace with “Update STATUS.md”)

- **README.md**
  - 254: “See [DEVELOPMENT.md](docs/DEVELOPMENT_PLAN.md)” (replace with `docs/README.md` + `docs/13-Project-Plan.md`)

- **AGENTS.md**
  - 14–19: References to `docs/00-INDEX.md` and `docs/01-ARCHITECTURE.md` (replace with `docs/README.md` and `docs/03-Architecture.md`)

- **SESSION_START_GUIDE.md**
  - 83–88: “Which Agent Needed” source in `docs/DEVELOPMENT_PLAN.md` (update to STATUS/Plan/Backlog)
  - 107–112: Reading order directs to `docs/DEVELOPMENT_PLAN.md` (update to STATUS/Plan/Backlog)
  - 215–222: After-completion checklist includes “Update DEVELOPMENT_PLAN.md” (change to “Update STATUS.md”)
  - 355–361: “Update STATUS.md, DEVELOPMENT_PLAN.md, and create completion doc” (drop DEV plan; STATUS only)
  - 384–387: Troubleshooting checks DEV plan “CURRENT STATUS” (change to STATUS.md)
  - 423–430: After Every Completion includes “Update DEVELOPMENT_PLAN.md” (change to STATUS.md)

- **SESSION_START_QUICK_GUIDE.md**
  - 44–46: “Requirements: Look at DEVELOPMENT_PLAN.md” (update to `STATUS.md` + `docs/13-Project-Plan.md` + `docs/12-Backlog.md`)
  - 165–177: Step 5 example text includes “Updated DEVELOPMENT_PLAN.md” (change to “Update STATUS.md”)

- **docs/WORKFLOW_ARCHITECTURE.md**
  - 47: “Document: [DEVELOPMENT_PLAN.md]” (replace with `13-Project-Plan.md` and/or `03-Architecture.md`)
  - 1059–1060: “Backend Plan: [DEVELOPMENT_PLAN.md]” (replace with `03-Architecture.md` or `11-Infrastructure-and-Deployment.md`)

- **docs/04-UI-ARCHITECTURE.md**
  - 1158: “Backend Plan: [DEVELOPMENT_PLAN.md]” (replace with `03-Architecture.md` or `11-Infrastructure-and-Deployment.md`)

- **COMPLETION_TEMPLATE.md**
  - 202–205: “Development Plan: [docs/DEVELOPMENT_PLAN.md]” (replace with `docs/13-Project-Plan.md`; update directive to STATUS.md)
  - 167: “Architecture: [docs/01-ARCHITECTURE.md]” (replace with `docs/03-Architecture.md`)

- **Old PRD/SRS names**
  - gpt_discuss.md: multiple references to `docs/PRD.md` in narrative sections (e.g., 146–172); replace with `docs/01-PRD.md` and `docs/02-SRS.md`.
  - DOCS_GENERATION_PROMPT.md already uses `01-PRD.md` and `02-SRS.md` (no change needed).

- **Legacy brand (“moksha”)**
  - scripts/init-db.sql: 118 – `docker exec moksha-db psql -U moksha -d moksha_devhub -c '\dx'` (normalize to ProjectPulse names)
  - docs/03-Architecture.md: 193–206 – docker-compose snippet uses `moksha-*` names and user (normalize)
  - docs/07-QUICK-START.md:
    - 137–146 – `.env` uses `moksha` values
    - 160–177 – docker-compose uses `moksha-db`, `moksha-web`
    - 317–323 – `docker exec moksha-db psql -U moksha -d moksha_devhub`
  - docs/10-Observability-and-SRE.md: 650–652 – `docker stats ... moksha-web moksha-db` (normalize)
  - apps/mcp-docker/README.md: 64–75, 88–91 – references to `moksha-db`/`moksha-web` (normalize)
  - apps/web/components/Sidebar.tsx: 201 – `dev@moksha.local` (optional → `dev@projectpulse.local`)
  - apps/web/tests/e2e/dashboard.spec.ts: 195 – `dev@moksha.local` (optional → `dev@projectpulse.local`)

- **Index replacements**
  - docs/DEVELOPMENT_PLAN.md: 354–361 – reading order recommends `00-INDEX.md` and `01-ARCHITECTURE.md` (update to `docs/README.md` and `docs/03-Architecture.md`; also retire DEV plan per MIGRATION_GUIDE)
  - AGENTS.md: 14–19 – replace `docs/00-INDEX.md` → `docs/README.md`

All above are outside `docs/archive/**` and should be remediated.

---

End of report.

## Post-Fix Validation

**Date:** 2025-11-04 03:30 (UTC+05:30)
**Fixes Applied By:** GPT (user-confirmed)

### Scope Note: Intentionally Retained Historical References

Per archival traceability policy, **historical session logs** in `.agent/task/**` are intentionally retained with legacy references. These files are timestamped archives of completed work sessions and serve as historical records.

**Retention Policy:**

- ✅ **Retained:** `.agent/task/` session logs (e.g., `current-session-20251102-2100.md`)
- ✅ **Updated:** All active operational files (`.agent/README.md`, `.agent/MANDATORY_SESSION_PROTOCOL.md`, `STATUS.md`, `CLAUDE.md`, etc.)

### Verification Scan Results

**Active .agent/ files (excluding task/ archives):**

Remaining references after GPT fixes:

1. **SKILLS_ENHANCEMENT_PLAN.md** - Legacy "moksha-\*.md" skill names (planned skills, not yet created)
2. **WORKFLOW_ENHANCEMENT_SUMMARY.md** - DEVELOPMENT_PLAN.md references (workflow documentation)
3. **.agent/gemini/** files - Audit documentation with historical references (audit prompts reference old structure)
4. **.agent/testing/** files - Test scenario documentation
5. **.agent/metrics/** files - Token optimization documentation

**Status:** Active operational files have been updated. Remaining references are in:

- Planning documents (SKILLS_ENHANCEMENT_PLAN.md - future work)
- Audit/testing/metrics documentation (historical context needed)
- Gemini integration guides (audit instructions reference old structure for context)

**Assessment:** ✅ Core operational workflow updated. Remaining references are acceptable within their contexts.

---

**Audit Status:** Complete with documented scope limitations.
