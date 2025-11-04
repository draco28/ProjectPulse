# docs: Deprecation sweep, archive completions, and guide alignment

## Summary

This PR performs a documentation-only cleanup to align everything with the new Source of Truth and reduce clutter:

- Deprecates/archives legacy and generated docs that shouldn’t be part of the active reading paths
- Aligns onboarding and workflow guides to use `STATUS.md`, `docs/README.md`, `docs/03-Architecture.md`, `docs/13-Project-Plan.md`, and `docs/12-Backlog.md`
- Preserves historical traceability by archiving rather than deleting

## Changes

- Archive agent completion files to `docs/archive/completions/2025-11/`
- Archive `docs/DEVELOPMENT_PLAN_AUDIT.md` and `week1.5_audit.md` → `docs/archive/deprecated/2025-11/`
- Stub `docs/00-INDEX.md` as [RETIRED] and point to `docs/README.md`
- Update `SESSION_START_GUIDE.md` and `SESSION_START_QUICK_GUIDE.md` to emphasize `STATUS.md` + Plan/Backlog; completion docs optional and auto-archived
- Update `STATUS.md` quick links and post-completion workflow accordingly
- Add canonical banner to `docs/WORKFLOW_ARCHITECTURE.md` and align “update” steps to `STATUS.md`
- Replace legacy references (e.g., `01-ARCHITECTURE.md`, `DEVELOPMENT_PLAN.md`) across docs and templates
- Update `docs/MIGRATION_GUIDE.md` with Archived Completions mapping
- Add audit artifacts (inventory, inbound refs, orphans, candidates) under `docs/audits/`

## Affected Paths (examples)

- `docs/archive/completions/2025-11/…` (new) — all agent completion docs
- `docs/archive/deprecated/2025-11/…` (new) — legacy audits
- `docs/00-INDEX.md` — retired stub
- `SESSION_START_GUIDE.md`, `SESSION_START_QUICK_GUIDE.md` — aligned to SoT
- `STATUS.md` — links and workflow updated
- `docs/WORKFLOW_ARCHITECTURE.md` — banner + status update step
- `docs/04-UI-ARCHITECTURE.md`, `docs/06-API/openapi.yaml`, `docs/UI_TRANSFORMATION_PLAN.md` — reference updates
- `CLAUDE.md`, `COMPLETION_TEMPLATE.md` — completion workflow clarified (optional + archived)

## Validation Checklist

- [x] No non-archive references to completion docs in active guides
- [x] No active references to `docs/DEVELOPMENT_PLAN.md` in onboarding/workflow docs
- [x] Canonical index is `docs/README.md`; legacy `docs/00-INDEX.md` is stubbed
- [x] `docs/03-Architecture.md` used instead of `01-ARCHITECTURE.md`
- [x] Migration Guide updated with archived completions table
- [x] Audit artifacts present under `docs/audits/`
- [x] Docs-only changes; no code behavior change

## How to Review

- Skim guides (`SESSION_START_*`, `STATUS.md`, `CLAUDE.md`) to confirm the SoT (STATUS + Plan + Backlog + README + 03-Architecture) is consistent
- Confirm archived files exist only under `docs/archive/*`
- Optional: run link spot-checks locally with `rg` on moved basenames

## Labels

- `docs` `chore` `deprecation`

---

> Generated from the deprecation audit: `docs/audits/docs-deprecation-audit-20251104.md`
