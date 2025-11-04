# Documentation Deprecation Audit — 2025-11-04

Meta

- Owner: Cascade (assistant)
- Branch (recommended): docs/deprecation-audit-20251104
- Scope window: Active documentation that affects onboarding, workflows, and current developer experience
- Out-of-scope (archival/allowed): docs/archive/**, .agent/task/** (historical sessions), audit history

---

## 1) Executive Summary

Objective: Reduce documentation clutter by auditing and deprecating unused/obsolete files while preserving historical traceability.

Approach: Inventory all docs, build an inbound reference graph, apply deprecation criteria, map Old→New via MIGRATION_GUIDE, and execute archive/stub/delete actions with link validation.

Deliverables:

- Candidate list with proposed action (Keep/Update/Archive/Delete/Stub→Redirect)
- Migration mappings and PR checklist
- Validation checklist results (no broken links, indexes updated)

---

## 2) Source of Truth and Principles

- docs/ is authoritative for architecture and workflows (R-DOC-001)
- Replace hardcoded values and legacy references with canonical docs (R-DATA-001)
- Historical content remains in docs/archive/** and .agent/task/** (archival policy)
- MIGRATION_GUIDE.md governs Old→New mappings and must be updated for any deprecation

---

## 3) Deprecation Policy (Actions)

- Keep: Still current and referenced; may need minor updates
- Update: Current but requires link/brand fixes to align with SoT
- Archive: Move to docs/archive/deprecated/2025-11/ (preserve history); add stub if the path is commonly referenced
- Stub + Redirect: Replace file with short stub pointing to new canonical doc(s)
- Delete: Only when confirmed unreferenced, irrelevant, and archived supersets exist

Retention rules

- Historical logs/templates: keep under docs/archive/** or .agent/task/**
- Active workflows must reference STATUS.md, 13-Project-Plan.md, 12-Backlog.md, 03-Architecture.md, 01-PRD.md, 02-SRS.md

---

## 4) Criteria for Deprecation Candidates

A file is a candidate if ANY of the following are true (and no counter-indications):

- Inbound references = 0 (not linked from docs/README.md or other active docs)
- Superseded by canonical doc per MIGRATION_GUIDE Old→New mapping
- Duplicates or near-duplicates canonical docs (substantial overlap)
- Outdated directives that conflict with current Golden Rules or workflows
- Age threshold: no changes in >120 days AND zero inbound references

Counter-indications (keep/update instead of archive):

- Part of onboarding path or session protocol
- Referenced by test plans or skills that are current
- Serves as required background (explicitly referenced by STATUS.md, AGENTS.md, SESSION_* guides)

---

## 5) Methodology & Commands

Inventory (PowerShell / Windows):

```powershell
# List Markdown docs excluding archive/build artifacts
Get-ChildItem -Recurse -File -Include *.md -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\dist\\|\\coverage\\|\\docs\\archive\\' } |
  Select-Object FullName, Length, LastWriteTime | Sort-Object FullName
```

Primary scan (ripgrep style):

```bash
rg -nH --no-ignore \
  --glob '!:docs/archive/' --glob '!:node_modules/' --glob '!:dist/' --glob '!:coverage/' --glob '!:**/.next/**' \
  -e 'DEVELOPMENT_PLAN\.md|01-ARCHITECTURE\.md|00-INDEX\.md|\bPRD\.md\b|\bSRS\.md\b|\bmoksha\b'
```

Build inbound reference counts (PowerShell):

```powershell
$docs = Get-ChildItem -Recurse -File -Include *.md |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\dist\\|\\coverage\\|\\docs\\archive\\' }

$result = @()
foreach ($doc in $docs) {
  $name = [Regex]::Escape($doc.Name)
  $hits = Select-String -Path $docs.FullName -Pattern $name -SimpleMatch -Encoding UTF8 |
    Where-Object { $_.Path -ne $doc.FullName } | Measure-Object | Select-Object -ExpandProperty Count
  $result += [pscustomobject]@{
    File = $doc.FullName
    InboundRefs = $hits
    LastWrite = $doc.LastWriteTime
    Size = $doc.Length
  }
}
$result | Sort-Object InboundRefs, LastWrite | Format-Table -AutoSize
```

Age filter (PowerShell):

```powershell
Get-ChildItem -Recurse -File -Include *.md |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\dist\\|\\coverage\\|\\docs\\archive\\' -and $_.LastWriteTime -lt (Get-Date).AddDays(-120) } |
  Select-Object FullName, LastWriteTime | Sort-Object LastWriteTime
```

Duplicate similarity (optional quick signal):

```bash
# Normalize and hash to detect near duplicates (very rough signal)
for f in $(rg -l --no-ignore -g '!docs/archive/**' -g '!node_modules/**' -g '!**/.next/**' -g '!dist/**' -g '!coverage/**' -t md .); do \
  tr -s '[:space:]' ' ' < "$f" | sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}//g' | md5sum | awk -v f="$f" '{print $1, f}'; done | sort
```

---

## 6) Migration Mapping (Old → New)

- Use docs/MIGRATION_GUIDE.md as the single source for mappings
- For each candidate marked Archive/Delete, add a mapping entry and reason
- For Stubbed files, include explicit links to canonical replacements

---

## 7) Preliminary Findings (to be refined after scans)

These items are established or high-confidence based on prior remediation and policy.

- docs/DEVELOPMENT_PLAN.md — Already retired with stub pointing to STATUS + Plan + Backlog
  - Action: Keep stub; no further action

- .agent/task/** — Historical session logs (archival)
  - Action: Keep as-is (archival traceability policy)

- .agent/gemini/** — Audit and analysis artifacts
  - Action: Keep (audit history); do not alter

- Potential categories to review post-scan (examples; to confirm):
  - docs/* roadmaps predating 13-Project-Plan.md (superseded)
  - Old UI-first design docs not referenced by current workflows (if outside docs/archive/**)
  - Experimental drafts in docs/ or .claude/ not referenced by STATUS/AGENTS/SESSION_* guides
  - Redundant READMEs in apps/* that duplicate docs/ content

For all to-be-confirmed candidates, decisions will be based on inbound reference counts and MIGRATION_GUIDE mappings.

---

## 8) Proposed Actions & Workflow

1. Create branch: docs/deprecation-audit-20251104
2. Run inventory and inbound-refs scans; export results to CSV for review
3. Label each candidate with action (Keep/Update/Archive/Delete/Stub)
4. For Archive/Delete/Stub:
   - Update docs/MIGRATION_GUIDE.md (Old→New mapping + rationale)
   - Move to docs/archive/deprecated/2025-11/ (for Archive)
   - Replace with stub pointing to canonical doc(s) (for Stub)
   - Update indexes (docs/README.md, any TOCs)
5. Run link checks and spot verification
6. Open PR with docs-only label and rationale; include this report

Commit order (docs-first):

- docs commit: audit report, MIGRATION_GUIDE updates, file moves/stubs, index updates
- (Optional) code commit: only if code references changed (should be rare for docs deprecation)

---

## 9) Validation Checklist

- [ ] No broken links (rg on moved/deleted basenames)
- [ ] docs/README.md updated to reflect current structure
- [ ] MIGRATION_GUIDE.md updated with all Old→New mappings
- [ ] Only archival locations contain historical content (docs/archive/**, .agent/task/**)
- [ ] CI: lint + type-check pass; build/tests N/A for docs-only PR

---

## 10) Appendix — Ready-to-Run Commands

Primary inventory (Windows):

```powershell
Get-ChildItem -Recurse -File -Include *.md -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\dist\\|\\coverage\\|\\docs\\archive\\' } |
  Select-Object FullName, Length, LastWriteTime | Sort-Object FullName
```

Reference search (ripgrep):

```bash
rg -nH --no-ignore \
  --glob '!:docs/archive/' --glob '!:node_modules/' --glob '!:dist/' --glob '!:coverage/' --glob '!:**/.next/**' \
  -e 'DEVELOPMENT_PLAN\.md|01-ARCHITECTURE\.md|00-INDEX\.md|\bPRD\.md\b|\bSRS\.md\b|\bmoksha\b'
```

Orphan detection (PowerShell):

```powershell
$all = Get-ChildItem -Recurse -File -Include *.md |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\dist\\|\\coverage\\|\\docs\\archive\\' }

$orphans = @()
foreach ($doc in $all) {
  $n = [Regex]::Escape($doc.Name)
  $refs = Select-String -Path $all.FullName -Pattern $n -SimpleMatch -Encoding UTF8 |
    Where-Object { $_.Path -ne $doc.FullName }
  if (-not $refs) { $orphans += $doc.FullName }
}
$orphans | Sort-Object
```

Link check (simple basename heuristic):

```bash
# For each removed/moved file, ensure no references remain
for f in $(cat moved_or_deleted_basenames.txt); do \
  rg -nH --no-ignore -e "$f" -g '!:docs/archive/**' -g '!:node_modules/**' -g '!:**/.next/**' -g '!:dist/**' -g '!:coverage/**' || true; done
```

---

End of report.
---

## 11) Candidate Action List (2025-11-04)

Focus: docs/ and root onboarding guides. Excludes archives, node_modules, .agent/, .claude/.

- Keep
  - docs/README.md — Canonical docs index (inboundRefs: 312)
  - docs/03-Architecture.md — Canonical architecture (inboundRefs: 175)
  - docs/02-DATABASE-SCHEMA.md — Canonical DB schema (inboundRefs: 61)
  - docs/03-MCP-SPECIFICATION.md — Canonical MCP spec (inboundRefs: 38)
  - docs/07-QUICK-START.md — Onboarding quick start (inboundRefs: 30)
  - docs/13-Project-Plan.md — Plan (inboundRefs: 195)
  - STATUS.md — Current status (inboundRefs: 688)
  - CLAUDE.md — Integration guide (inboundRefs: 159)

- Update
  - SESSION_START_GUIDE.md — Replace legacy DEV plan directives with STATUS.md + 13-Project-Plan.md + 12-Backlog.md per MIGRATION_GUIDE. (inboundRefs: 13)
  - SESSION_START_QUICK_GUIDE.md — Streamline to new Reading Paths; link STATUS.md + docs/README.md. (inboundRefs: 17)
  - docs/WORKFLOW_ARCHITECTURE.md — Align/merge with docs/03-Architecture.md to remove overlap. (inboundRefs: 48)

- Archive
  - docs/DEVELOPMENT_PLAN_AUDIT.md → docs/archive/deprecated/2025-11/
    - Reason: Orphan; superseded by docs/MIGRATION_GUIDE.md and DEVELOPMENT_PLAN.md stub
    - Action: Move and add MIGRATION_GUIDE entry

- Keep (Audit Trail)
  - docs/audits/docs-deprecation-audit-20251104.md — This report
  - docs/audits/old-plan-references-audit-20251104.md — Supporting analysis

Artifacts:
- Candidates CSV: docs/audits/docs-deprecation-candidates-20251104.csv
- Inventory: docs/audits/docs-deprecation-inventory-20251104.csv
- Inbound refs: docs/audits/docs-deprecation-inbound-refs-20251104.csv
- Orphans: docs/audits/docs-deprecation-orphan-candidates-20251104.csv

Next:
- Approve actions above; I will execute Archive/Update steps, update MIGRATION_GUIDE, and run link checks.
