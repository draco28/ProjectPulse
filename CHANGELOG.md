# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Landing page for product showcase
- Enhanced README with visual assets
- GitHub governance files (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)

## [1.0.0-alpha] - 2025-12-29

### Added

#### Core Platform
- **Agent-First Architecture**: 95% of interactions via MCP tools, 5% via web UI
- **Database as Source of Truth**: PostgreSQL-backed state management, no markdown clutter
- **Multi-Tenancy Support**: Per-project access control and data isolation

#### MCP Server (86+ Tools)
- **Context Management**: `context_load`, `context_lookup`, `context_update`
- **Agent Sessions**: `session_start`, `session_update`, `session_resume`, `session_end`
- **Ticket Management**: Full CRUD with parent-child hierarchies, bulk operations
- **Knowledge Base**: Hybrid search (semantic + full-text), graph traversal
- **Onboarding System**: 3-session guided setup generating 15 documents
- **Roadmap & Sprints**: 5-level hierarchy (Phase → Sprint → Week → Day → Task)
- **Workflow Templates**: Pre-built workflows with pause/resume support
- **Skills & SOPs**: Token-efficient lazy-loading (98% reduction)
- **Traceability**: Requirement-to-ticket coverage matrix

#### Web Application
- **Dashboard**: Real-time project overview with widgets
- **Issue Tracker**: Full-featured with comments, attachments, file linking
- **Wiki System**: Hierarchical documentation with auto-generation from JSDoc
- **Knowledge Base UI**: Semantic search interface
- **Roadmap View**: Phase timeline and sprint kanban boards
- **Agent Sessions UI**: Session management and history

#### Technical Features
- **Hybrid Search**: PostgreSQL tsvector + pgvector for semantic search
- **Local Embeddings**: Privacy-first using Transformers.js (no cloud API)
- **Token Efficiency**: Skills system with 98% reduction vs loading full docs
- **Progress Cascading**: Automatic rollup from Day → Week → Sprint → Phase

### Technical Stack
- Next.js 14 (App Router)
- TypeScript (strict mode)
- PostgreSQL 16 with pgvector
- Prisma ORM
- Tailwind CSS + shadcn/ui
- MCP SDK for Claude Code integration

### Architecture Decisions
- ADR-001: Agent-First Design
- ADR-002: Database as Single Source of Truth
- ADR-003: Hybrid Knowledge Graph
- ADR-004: Single MCP Server Architecture
- ADR-005: 5-Level Sprint Hierarchy

---

## Version History

### Pre-Release Development

#### Sprint 15 (December 2025)
- Multi-tenancy architecture refinements
- Project context injection across all pages
- Enhanced authentication flow

#### Sprint 14 (December 2025)
- Kanban board with progress cascade
- Ghost cards for parent-child visualization
- Sprint scheduling for tickets

#### Sprint 13 (December 2025)
- Ticket parent-child hierarchy
- Feature → Task relationships
- Backlog traceability

#### Sprint 12 (December 2025)
- Simplified 4-level hierarchy (removed Task model)
- Progress propagation optimization
- Session checkpoint improvements

#### Sprint 11 (December 2025)
- Self-guiding MCP architecture
- Context load with workflow hints
- Agent session lifecycle improvements

#### Sprint 10 (December 2025)
- Onboarding Session 3 (AI Workflow Bootstrap)
- Batch creation tools for personas, skills, workflows, SOPs
- Repository integration (CLAUDE.md generation)

#### Sprint 9 (December 2025)
- Onboarding Session 2 (Document Generation)
- 15 auto-generated planning documents
- Token budget management

#### Sprint 8 (November 2025)
- Onboarding Session 1 (Strategic Planning)
- 96 questions across 10 phases
- Executive summary generation

#### Sprint 7 (November 2025)
- Workflow templates and orchestration
- Pause/resume with checkpointing
- Step-by-step execution

#### Sprint 6 (November 2025)
- Knowledge base with hybrid search
- Semantic embeddings with Transformers.js
- Graph traversal for related items

#### Sprint 5 (November 2025)
- Wiki system with hierarchical pages
- Auto-generation from JSDoc
- Analytics and helpful ratings

#### Sprint 4 (October 2025)
- Skills and SOPs system
- Token-efficient lazy loading
- Persona management

#### Sprint 3 (October 2025)
- Roadmap materialization
- Phase/Sprint/Week/Day hierarchy
- Progress tracking

#### Sprint 2 (October 2025)
- MCP server foundation
- Core tools implementation
- Memory bank system

#### Sprint 1 (September 2025)
- Project setup and architecture
- Database schema design
- CI/CD pipeline

---

[Unreleased]: https://github.com/ProjectPulse/ProjectPulse/compare/v1.0.0-alpha...HEAD
[1.0.0-alpha]: https://github.com/ProjectPulse/ProjectPulse/releases/tag/v1.0.0-alpha
