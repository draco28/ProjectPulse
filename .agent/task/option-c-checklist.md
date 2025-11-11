# Option C Reconciliation Checklist

Created: 2025-11-11 20:05 IST
Status: IN PROGRESS

## Phase 1: Preparation
- [ ] Backup branch created: docs/option-c-reconciliation (pushed)
- [x] Checklist file created (.agent/task/option-c-checklist.md)

## Phase 2: Core Docs
- [ ] docs/12-Backlog.md
  - [ ] EPIC-002 story range US-026..050 → US-032..050 (19 stories)
  - [ ] Insert EPIC-003 Onboarding System (US-026..031 = 24 pts)
  - [ ] Renumber EPIC-002 table rows US-026..031 → US-032..037 (FRs + deps updated)
  - [ ] Insert EPIC-003 table (6 rows)
  - [ ] Traceability + Epic summary updated
- [ ] docs/13-Project-Plan.md
  - [x] Phase A story points 182 → 206 (87 + 24 + 95)
  - [x] Sprint 3 points 56 → 71; US range US-032..050 confirmed
  - [ ] Adjust EPIC numbering references if needed (Issues → EPIC-004)
- [ ] docs/02-SRS.md
  - [ ] Insert FR-026..031 (Onboarding)
  - [ ] Renumber FR-026..050 → FR-032..056

## Phase 3: Secondary Docs
- [ ] docs/07-UI-UX.md (workflow US/TEST ranges)
- [ ] docs/09-Testing-and-QA.md (TEST-026..031 added; renumber 032..056)
- [ ] Memory banks (.agent/active-context.md, .agent/progress.md, .agent/project-brief.md)

## Phase 4: Validation
- [ ] grep validations (US/FR/TEST references) clean

## Phase 5: Commit & Report
- [ ] Commit with detailed message
- [ ] Completion report at .agent/task/option-c-completion-report.md
- [ ] Push branch and open PR (optional)

Notes:
- Reference plan: .agent/task/option-c-reconciliation-plan.md
- Mac mini services healthy: http://192.168.1.15:3000/api/health
