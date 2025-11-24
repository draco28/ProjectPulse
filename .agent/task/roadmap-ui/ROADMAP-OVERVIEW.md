# Standalone Roadmap UI Feature - Overview

**Feature**: Standalone Roadmap UI
**Status**: Planning Complete
**Story Points**: 44 (across 5 phases)
**Sprint**: Post-Sprint 9 (decoupled feature)

---

## Executive Summary

Enable users to create, import, and manage development roadmaps **WITHOUT** requiring the onboarding process. Add both tree and timeline/Gantt visualization views.

## Problem Statement

Currently, ProjectPulse roadmaps can only be created through the 3-session onboarding process:
1. Session 1: Executive Summary
2. Session 2: Document Generation (includes 13-Project-Plan.md)
3. Session 3: Bootstrap (parses plan, creates roadmap)

This forces users to complete the full onboarding just to create a roadmap, even if they already have a project plan or want to start fresh.

## Solution

Decouple roadmap creation from onboarding by providing:
1. **Creation Wizard** - Step-by-step UI to define phases/sprints
2. **Import Functionality** - Upload/paste JSON roadmap structure
3. **Timeline View** - Horizontal Gantt-style visualization
4. **Enhanced Tree View** - Inline editing capabilities

## Current State

### What Already Exists
- **Database Models**: Roadmap, Phase, Sprint, Week, Day, Task (5-level hierarchy)
- **UI Components**: 11 components in `/components/roadmap/`
- **Tree View**: `/roadmap` page with collapsible hierarchy
- **MCP Tool**: `projectpulse_roadmap_materialize` for JSON→records conversion
- **Decoupling**: Sprint 9 already decoupled data layer (bootstrap skips roadmap creation)

### Gaps to Fill
- No UI path to create roadmap without onboarding
- No JSON import functionality
- No timeline/Gantt visualization
- `EmptyRoadmapState` only shows "Complete Onboarding" CTA
- No inline editing in tree view

## User Stories

### US-1: Create Roadmap via Wizard
**As a** project manager
**I want to** create a roadmap using a step-by-step wizard
**So that** I can define my project phases and sprints without going through onboarding

### US-2: Import Roadmap from JSON
**As a** developer with an existing project plan
**I want to** import my roadmap structure from a JSON file
**So that** I can quickly set up tracking without manual data entry

### US-3: View Roadmap as Timeline
**As a** stakeholder
**I want to** see the roadmap as a horizontal timeline
**So that** I can visualize project duration and phase overlaps

### US-4: Inline Edit Roadmap Items
**As a** project manager
**I want to** edit roadmap items directly in the tree view
**So that** I can quickly update progress and status without navigating away

## Scope

### In Scope
- API endpoints for CRUD operations
- 4-step creation wizard
- JSON file upload and paste
- Timeline/Gantt visualization with toggle
- Inline editing (title, description, progress, status)
- Neumorphic design consistency

### Out of Scope (Deferred)
- Drag-drop reordering
- Dashboard integration
- Export to PDF/PNG
- Dependency visualization
- Resource allocation views

## Success Metrics

- [ ] User can create roadmap via UI wizard without onboarding
- [ ] User can import roadmap from JSON file
- [ ] User can toggle between tree and timeline views
- [ ] User can inline-edit roadmap items
- [ ] Materialization works for all creation paths
- [ ] `EmptyRoadmapState` shows "Create Roadmap" option

## Dependencies

- Existing Prisma models (Roadmap, Phase, Sprint, Week, Day)
- `materializeRoadmap()` function from `@projectpulse/roadmap-tools`
- Current `/roadmap` page and components
- Neumorphic design system

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Timeline performance with large roadmaps | Medium | Medium | Virtual scrolling, lazy rendering |
| Date/timezone handling issues | Medium | Low | Use date-fns consistently, store UTC |
| Complex wizard state management | Low | Medium | Use react-hook-form + Zod |
