# Project Brief - Moksha DevHub

**Project Name**: Moksha DevHub
**Version**: 1.0.0
**Last Updated**: 2025-10-26

---

## Core Mission

Build a comprehensive developer hub that integrates issue tracking, knowledge management, wiki documentation, security scanning, and AI agent orchestration in a unified platform.

---

## Primary Goals

### 1. Unified Developer Experience

- Single platform for all development workflows
- Seamless integration between issues, docs, and knowledge
- AI-powered assistance through agent personas

### 2. Modern UI/UX

- Neumorphic design system with Coral theme
- Dark theme as primary design
- Glass morphism effects for depth
- Responsive across all devices

### 3. Intelligent Automation

- AI agents for specialized tasks (fullstack, testing, architecture)
- Automated documentation generation
- Context-aware suggestions and assistance

### 4. Developer-First Features

- Fast search across all entities
- Command palette (Cmd+K) for quick actions
- Keyboard shortcuts throughout
- Real-time collaboration features

---

## Target Users

**Primary**: Development teams working on complex software projects
**Secondary**: Solo developers, open-source maintainers, technical leads

**User Personas**:

- **Dev Team Lead**: Tracks issues, reviews code, manages sprints
- **Backend Developer**: Writes APIs, manages database, reviews architecture
- **Frontend Developer**: Builds UI components, implements designs
- **QA Engineer**: Writes tests, tracks bugs, verifies fixes
- **Technical Writer**: Documents features, maintains wiki, writes guides

---

## Success Criteria

### Phase 1: Foundation (Week 1)

- ✅ Docker + PostgreSQL setup complete
- ✅ Next.js 14 App Router application running
- ✅ Database schema with 17 models implemented
- ✅ Dashboard UI with real data integration

### Phase 2: UI Transformation (Week 1.5)

- ✅ Multi-theme system removed, Coral theme locked
- ✅ All dashboard components transformed to neumorphic design
- 🔄 **IN PROGRESS**: All 7 pages transformed to neumorphic design (3/7 complete)
- ⏳ Responsive design and polish

### Phase 3: Core Features (Week 2-3)

- ⏳ Issue management (create, edit, comment, status changes)
- ⏳ Knowledge base (full-text search, categories, tagging)
- ⏳ Wiki system (markdown editor, versioning, linking)
- ⏳ Security dashboard (vulnerability scanning, score tracking)

### Phase 4: AI Integration (Week 4)

- ⏳ Agent personas activation/deactivation
- ⏳ MCP server integration (25+ tools)
- ⏳ Context injection system
- ⏳ Agent communication protocols

### Phase 5: Advanced Features (Week 5-6)

- ⏳ Real-time collaboration
- ⏳ Webhook integrations
- ⏳ API documentation
- ⏳ Export/import functionality

---

## Technical Stack

**Frontend**:

- Next.js 14.1.0 (App Router)
- React 18.2.0 (Server Components + Client Components)
- TypeScript 5.x (strict mode)
- Tailwind CSS 3.4.1 (utility-first)

**Backend**:

- Next.js API Routes & Server Actions
- Prisma ORM 5.9.0
- PostgreSQL 16 with pgvector
- Zod validation

**Testing**:

- Jest (unit tests)
- React Testing Library (component tests)
- Playwright (E2E tests)

**DevOps**:

- Docker & Docker Compose
- pnpm (package management)
- ESLint & Prettier (code quality)

**AI/MCP**:

- MCP Protocol (Model Context Protocol)
- Claude Code integration
- Custom agent personas

---

## Current Status (2025-10-26)

**Overall Progress**: Week 1.5 Phase 3 (Day 3 complete - 37.5%)

**Latest Milestone**: Issues List Page Complete

- Filter by status, priority, module
- Search with debouncing
- Pagination and sorting
- Pixel-perfect match to mockup

**Current Work**: Day 4 - Issue Detail Page (waiting for mockup)
**Next Up**: Days 5-6 - Knowledge Base, Wiki, Security, Agents, Command Palette

**Branch**: `ui/theme-foundation`
**Last Commit**: `d0194e8` - feat(ui): Add Issues List page with filtering and search

---

## Quality Standards

**Code Quality**:

- Zero TypeScript errors (strict mode)
- Zero ESLint warnings
- 100% type coverage (no `any` types)
- Comprehensive JSDoc comments

**Testing**:

- Unit tests for all utilities
- Component tests for all React components
- E2E tests for all critical workflows
- 80%+ code coverage

**Design**:

- Pixel-perfect match to mockups
- Responsive across breakpoints
- Accessibility (WCAG 2.1 AA)
- Performance (Lighthouse 90+ scores)

**Git Workflow**:

- Feature branches for all work
- Descriptive commit messages
- Completion docs for all phases
- Clean merge history

---

## Key Constraints

**Technical**:

- Must use Next.js 14 App Router (no Pages Router)
- Must use PostgreSQL (no other databases)
- Must use Prisma (no other ORMs)
- Must support Docker deployment

**Design**:

- Must follow Coral neumorphic theme
- Must be dark theme first
- Must match provided mockups exactly
- Must be responsive mobile-first

**Workflow**:

- Must follow Git workflow (feature branches)
- Must create completion docs
- Must update STATUS.md and DEVELOPMENT_PLAN.md
- Must pass all quality gates before committing

---

## Documentation References

**Main Docs**:

- [STATUS.md](../STATUS.md) - Current snapshot
- [DEVELOPMENT_PLAN.md](../docs/DEVELOPMENT_PLAN.md) - Full roadmap
- [WORKFLOW_ARCHITECTURE.md](../docs/WORKFLOW_ARCHITECTURE.md) - Git workflow

**Architecture**:

- [01-ARCHITECTURE.md](../docs/01-ARCHITECTURE.md) - System design
- [02-DATABASE-SCHEMA.md](../docs/02-DATABASE-SCHEMA.md) - Prisma schema
- [04-UI-ARCHITECTURE.md](../docs/04-UI-ARCHITECTURE.md) - Component structure

**Theme/Design**:

- [THEME_GUIDE.md](../theme/THEME_GUIDE.md) - Design system
- [COMPONENTS_REFERENCE.md](../theme/COMPONENTS_REFERENCE.md) - UI patterns
- [MOCKUPS_INDEX.md](../mockups/Default theme/MOCKUPS_INDEX.md) - All mockups

---

**This file defines WHAT we're building and WHY. See system-patterns.md for HOW.**
