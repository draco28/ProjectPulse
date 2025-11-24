# Roadmap UI - Implementation Plan

## Phase Overview

| Phase | Description | Story Points | Dependencies |
|-------|-------------|--------------|--------------|
| A | API Layer | 8 | None |
| B | Creation Wizard | 13 | Phase A |
| C | Import Functionality | 5 | Phase A |
| D | Timeline/Gantt View | 13 | Phase A |
| E | Enhanced Tree View | 5 | Phase A |
| **Total** | | **44** | |

## Dependency Graph

```
Phase A (API Layer) ──┬──► Phase B (Wizard)
                      ├──► Phase C (Import)
                      ├──► Phase D (Timeline)
                      └──► Phase E (Enhanced Tree)
```

**Note**: Phases B-E can be implemented in parallel after Phase A is complete.

---

## Phase A: API Layer (8 Story Points)

### Objective
Create RESTful API endpoints for roadmap CRUD operations.

### Tasks

- [ ] A.1: Create `/api/roadmap/route.ts` (GET list, POST create)
- [ ] A.2: Create `/api/roadmap/[id]/route.ts` (GET, PUT, DELETE)
- [ ] A.3: Create `/api/roadmap/[id]/materialize/route.ts` (POST)
- [ ] A.4: Create `/api/roadmap/import/route.ts` (POST)
- [ ] A.5: Add Zod schemas for validation
- [ ] A.6: Write integration tests

### File Structure
```
apps/web/app/api/roadmap/
├── route.ts                    # GET (list), POST (create)
├── [id]/
│   ├── route.ts               # GET, PUT, DELETE
│   └── materialize/route.ts   # POST (trigger materialization)
└── import/route.ts            # POST (import from JSON)
```

### Estimated Time: 1 day

---

## Phase B: Creation Wizard (13 Story Points)

### Objective
Multi-step wizard UI for creating roadmaps from scratch.

### Tasks

- [ ] B.1: Create wizard page at `/roadmap/create`
- [ ] B.2: Implement `RoadmapWizard.tsx` state machine
- [ ] B.3: Implement `Step1ProjectInfo.tsx` (title, date, description)
- [ ] B.4: Implement `Step2Phases.tsx` (add/edit/remove phases)
- [ ] B.5: Implement `Step3Sprints.tsx` (sprints per phase)
- [ ] B.6: Implement `Step4Preview.tsx` (full preview)
- [ ] B.7: Implement `WizardStepIndicator.tsx` and `WizardNavigation.tsx`
- [ ] B.8: Add localStorage draft recovery
- [ ] B.9: Write component tests
- [ ] B.10: Write E2E test for complete flow

### File Structure
```
apps/web/app/(authenticated)/roadmap/create/page.tsx
apps/web/components/roadmap/wizard/
├── RoadmapWizard.tsx           # Main state machine
├── WizardStepIndicator.tsx     # Progress dots
├── Step1ProjectInfo.tsx        # Title, start date
├── Step2Phases.tsx             # Add/remove phases
├── Step3Sprints.tsx            # Sprints per phase
├── Step4Preview.tsx            # Full hierarchy preview
└── WizardNavigation.tsx        # Next/Back/Create
```

### Estimated Time: 2-3 days

---

## Phase C: Import Functionality (5 Story Points)

### Objective
Enable users to import roadmaps from JSON files or paste JSON directly.

### Tasks

- [ ] C.1: Create import page at `/roadmap/import`
- [ ] C.2: Implement `JsonFileUpload.tsx` (drag-drop)
- [ ] C.3: Implement `JsonPasteArea.tsx` (textarea)
- [ ] C.4: Implement `ImportPreview.tsx` (parsed structure)
- [ ] C.5: Implement `ImportValidationErrors.tsx`
- [ ] C.6: Wire up to POST /api/roadmap/import
- [ ] C.7: Write tests for JSON parsing edge cases

### File Structure
```
apps/web/app/(authenticated)/roadmap/import/page.tsx
apps/web/components/roadmap/import/
├── RoadmapImport.tsx           # Container
├── JsonFileUpload.tsx          # Drag-drop upload
├── JsonPasteArea.tsx           # Textarea for JSON
├── ImportPreview.tsx           # Parsed preview
└── ImportValidationErrors.tsx  # Error display
```

### Estimated Time: 1 day

---

## Phase D: Timeline/Gantt View (13 Story Points)

### Objective
Add horizontal timeline visualization with toggle between tree and timeline views.

### Tasks

- [ ] D.1: Implement `RoadmapTimeline.tsx` container
- [ ] D.2: Implement `TimelineHeader.tsx` (date scale)
- [ ] D.3: Implement `TimelineRow.tsx` (phase/sprint rows)
- [ ] D.4: Implement `TimelineBar.tsx` (progress bars)
- [ ] D.5: Implement `TimelineTooltip.tsx` (hover details)
- [ ] D.6: Implement `TimelineLegend.tsx` (status colors)
- [ ] D.7: Implement `ViewToggle.tsx` (tree/timeline switch)
- [ ] D.8: Update `/roadmap` page with view toggle
- [ ] D.9: Add responsive behavior
- [ ] D.10: Write visual regression tests

### File Structure
```
apps/web/components/roadmap/timeline/
├── RoadmapTimeline.tsx         # Main container
├── TimelineHeader.tsx          # Date scale (Month/Week)
├── TimelineRow.tsx             # Phase/Sprint row
├── TimelineBar.tsx             # Horizontal progress bar
├── TimelineTooltip.tsx         # Hover details
└── TimelineLegend.tsx          # Status colors

apps/web/components/roadmap/
├── ViewToggle.tsx              # [Tree] [Timeline] buttons
└── FilterableRoadmapView.tsx   # Wrapper for both views
```

### Estimated Time: 2-3 days

---

## Phase E: Enhanced Tree View (5 Story Points)

### Objective
Add inline editing and improved interaction to existing tree view.

### Tasks

- [ ] E.1: Implement `InlineEditForm.tsx` component
- [ ] E.2: Implement `ProgressSlider.tsx` component
- [ ] E.3: Implement `StatusDropdown.tsx` component
- [ ] E.4: Update `PhaseCard.tsx` with inline edit
- [ ] E.5: Update `SprintCard.tsx` with inline edit
- [ ] E.6: Update `WeekCard.tsx` with inline edit
- [ ] E.7: Add double-click to edit behavior
- [ ] E.8: Write tests for edit flows

### File Structure
```
apps/web/components/roadmap/edit/
├── InlineEditForm.tsx          # Reusable edit component
├── ProgressSlider.tsx          # Quick progress update
└── StatusDropdown.tsx          # Quick status change
```

### Estimated Time: 1 day

---

## Implementation Order

1. **Phase A** (API Layer) - Foundation, required for all others
2. **Phase B** (Creation Wizard) - Highest user value
3. **Phase C** (Import) - Quick win, reuses wizard patterns
4. **Phase D** (Timeline View) - Major visual feature
5. **Phase E** (Enhanced Tree) - Polish and optimization

---

## Testing Strategy

### Phase A
- Unit tests for Zod schemas
- Integration tests for each endpoint (happy path + errors)
- Test authorization (project ownership)

### Phase B
- Component tests for each wizard step (React Testing Library)
- E2E test for complete wizard flow (Playwright)
- Test draft recovery from localStorage

### Phase C
- Unit tests for JSON parsing/validation
- Test malformed JSON inputs
- E2E test for file upload flow

### Phase D
- Visual regression tests for timeline rendering
- Test date calculations with various timezones
- Test responsive behavior at breakpoints

### Phase E
- Test inline edit save/cancel flows
- Test optimistic update rollback on error

---

## Critical Files to Read Before Starting

1. `apps/web/prisma/schema.prisma` - Roadmap, Phase, Sprint, Week, Day models
2. `packages/roadmap-tools/src/materializeRoadmap.ts` - Materialization logic
3. `apps/web/types/roadmap.ts` - Type definitions
4. `apps/web/components/roadmap/RoadmapTree.tsx` - Existing tree component
5. `apps/web/app/api/phases/route.ts` - API pattern reference
