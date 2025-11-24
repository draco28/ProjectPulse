# Roadmap UI Feature - Status Tracker

**Feature**: Standalone Roadmap UI
**Total Story Points**: 44
**Status**: 📋 PLANNING COMPLETE - Ready for Implementation

---

## Phase Status Overview

| Phase | Description | Points | Status | Progress |
|-------|-------------|--------|--------|----------|
| A | API Layer | 8 | ⬜ Not Started | 0% |
| B | Creation Wizard | 13 | ⬜ Not Started | 0% |
| C | Import Functionality | 5 | ⬜ Not Started | 0% |
| D | Timeline/Gantt View | 13 | ⬜ Not Started | 0% |
| E | Enhanced Tree View | 5 | ⬜ Not Started | 0% |

**Legend**: ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⏸️ Blocked

---

## Phase A: API Layer (8 pts)

| Task | Status | Notes |
|------|--------|-------|
| A.1: Create `/api/roadmap/route.ts` | ⬜ | GET list, POST create |
| A.2: Create `/api/roadmap/[id]/route.ts` | ⬜ | GET, PUT, DELETE |
| A.3: Create `/api/roadmap/[id]/materialize/route.ts` | ⬜ | POST trigger |
| A.4: Create `/api/roadmap/import/route.ts` | ⬜ | POST import |
| A.5: Add Zod schemas | ⬜ | Validation |
| A.6: Write integration tests | ⬜ | |

---

## Phase B: Creation Wizard (13 pts)

| Task | Status | Notes |
|------|--------|-------|
| B.1: Create wizard page | ⬜ | /roadmap/create |
| B.2: Implement RoadmapWizard.tsx | ⬜ | State machine |
| B.3: Implement Step1ProjectInfo.tsx | ⬜ | Title, date |
| B.4: Implement Step2Phases.tsx | ⬜ | Add/edit phases |
| B.5: Implement Step3Sprints.tsx | ⬜ | Sprints per phase |
| B.6: Implement Step4Preview.tsx | ⬜ | Full preview |
| B.7: Implement step indicator + nav | ⬜ | |
| B.8: Add localStorage draft recovery | ⬜ | |
| B.9: Write component tests | ⬜ | |
| B.10: Write E2E test | ⬜ | |

---

## Phase C: Import Functionality (5 pts)

| Task | Status | Notes |
|------|--------|-------|
| C.1: Create import page | ⬜ | /roadmap/import |
| C.2: Implement JsonFileUpload.tsx | ⬜ | Drag-drop |
| C.3: Implement JsonPasteArea.tsx | ⬜ | Textarea |
| C.4: Implement ImportPreview.tsx | ⬜ | Preview |
| C.5: Implement ImportValidationErrors.tsx | ⬜ | Errors |
| C.6: Wire up to API | ⬜ | |
| C.7: Write tests | ⬜ | |

---

## Phase D: Timeline View (13 pts)

| Task | Status | Notes |
|------|--------|-------|
| D.1: Implement RoadmapTimeline.tsx | ⬜ | Container |
| D.2: Implement TimelineHeader.tsx | ⬜ | Date scale |
| D.3: Implement TimelineRow.tsx | ⬜ | Rows |
| D.4: Implement TimelineBar.tsx | ⬜ | Progress bars |
| D.5: Implement TimelineTooltip.tsx | ⬜ | Hover |
| D.6: Implement TimelineLegend.tsx | ⬜ | Legend |
| D.7: Implement ViewToggle.tsx | ⬜ | Tree/Timeline switch |
| D.8: Update /roadmap page | ⬜ | Integrate toggle |
| D.9: Add responsive behavior | ⬜ | |
| D.10: Write visual tests | ⬜ | |

---

## Phase E: Enhanced Tree View (5 pts)

| Task | Status | Notes |
|------|--------|-------|
| E.1: Implement InlineEditForm.tsx | ⬜ | Reusable |
| E.2: Implement ProgressSlider.tsx | ⬜ | |
| E.3: Implement StatusDropdown.tsx | ⬜ | |
| E.4: Update PhaseCard.tsx | ⬜ | Add edit |
| E.5: Update SprintCard.tsx | ⬜ | Add edit |
| E.6: Update WeekCard.tsx | ⬜ | Add edit |
| E.7: Add double-click behavior | ⬜ | |
| E.8: Write tests | ⬜ | |

---

## Deferred Items

| Item | Reason | Future Sprint |
|------|--------|---------------|
| Drag-drop reordering | Complexity | TBD |
| Dashboard integration | User preference | TBD |
| Export to PDF/PNG | Low priority | TBD |
| Dependency visualization | Complex | TBD |

---

## Blockers & Issues

| Issue | Status | Resolution |
|-------|--------|------------|
| None yet | - | - |

---

## Session Log

| Date | Session | Progress |
|------|---------|----------|
| 2025-11-25 | Planning | Created spec docs, plan approved |

---

## Files Created

### Spec Documents
- [x] `ROADMAP-OVERVIEW.md`
- [x] `ROADMAP-IMPLEMENTATION-PLAN.md`
- [x] `ROADMAP-API-SPEC.md`
- [x] `ROADMAP-UI-COMPONENTS.md`
- [x] `ROADMAP-TIMELINE-DESIGN.md`
- [x] `ROADMAP-STATUS.md` (this file)

### Implementation Files
_To be created during implementation_

---

## Next Steps

1. Start Phase A: API Layer
2. Read critical files:
   - `apps/web/prisma/schema.prisma`
   - `packages/roadmap-tools/src/materializeRoadmap.ts`
   - `apps/web/types/roadmap.ts`
   - `apps/web/components/roadmap/RoadmapTree.tsx`
   - `apps/web/app/api/phases/route.ts`
