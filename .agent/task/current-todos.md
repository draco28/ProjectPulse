# Current Todos – Documentation Realignment (Post-MVP, Sprint 11+)

**Session**: 2025-12-10 00:04 IST  
**Status**: In Progress

## Stage 0 – Scope & Baselines ✅

- [x] Inventory `docs/` directory and identify active docs
- [x] Classify docs into layers L0–L6 (index, PRD/SRS, architecture, data/API, infra, planning, feature guides)
- [x] Confirm implementation sources of truth (`apps/web`, `apps/mcp-server`, Prisma schema, infra configs, MCP docs)

## Stage 1 – As-Built Discovery (Implementation Map)

- [ ] UI & Routes: Map all `app/**/page.tsx` routes and their primary responsibilities
- [ ] API Surface: Map all `app/api/**/route.ts` endpoints (method, path, purpose)
- [ ] MCP Tools: Catalog tools in `apps/mcp-server/src/tools/**` (name, category, backing API/Prisma operations)
- [ ] Database Schema: Snapshot key models from `schema.prisma` (fields, relations, enums, indexes)
- [ ] Infra & Runtime: Summarize dev/prod environments (localhost vs Cloudflare, ports, healthchecks)
- [ ] Tests: Identify key E2E/integration suites that validate onboarding, wiki, knowledge, tickets, health, MCP

## Stage 2 – Spec vs Implementation Gap Analysis

- [ ] PRD vs As-Built: Mark features as fully/partially/not implemented, note drift
- [ ] SRS vs As-Built: Map FRs to implementation evidence or mark as deferred
- [ ] Architecture Docs vs As-Built: Align diagrams/flows with Next.js + MCP + DB + Redis + Cloudflare
- [ ] Data/API Docs vs Prisma/OpenAPI: Align model and endpoint definitions with current code
- [ ] Infra Docs vs Reality: Fix outdated IPs/ports/flows; ensure they match Docker/Kubernetes/Cloudflare
- [ ] Planning & Feature Docs: Align backlog, project plan, and feature guides with implemented behaviour

## Stage 3 – Evidence-Based Documentation Updates

- [ ] For each doc to update, collect evidence (code, DB, HTTP, tests) and log it in session file
- [ ] Apply edits in waterfall order (PRD/SRS → Architecture → Data/API → Infra → Backlog/Features)
- [ ] Run type-check, lint, and targeted tests after major edit batches; record results

## Stage 4 – Final Consistency & Audit

- [ ] Re-scan docs index vs filesystem to ensure consistency
- [ ] Check for and resolve conflicting statements across PRD/SRS/Architecture/Data/API/Infra
- [ ] Ensure all healthcheck URLs and environment descriptions match localhost + Cloudflare reality
- [ ] Create `docs/audits/DOCUMENTATION_REALIGNMENT_2025-12-10.md` summarizing changes and open TODOs

----

## Progress Summary

- **Stages Complete**: Stage 0
- **Stages In Progress**: Stage 1
- **Pending**: Stages 2–4

----

## Notes

- This file tracks **current** documentation realignment work; previous Sprint 8.7 todos are archived in git history.
