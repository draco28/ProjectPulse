# Implementation Plan: Sprint 2 Week 3 Days 6-7 – Advanced Wiki Capabilities

**Session**: 2025-11-11 14:59 PST  
**Branch**: `feature/sprint-2-wiki-detail-enhancement`  
**Stories**: US-023 (Wiki page versioning), US-024 (Wiki full-text search), US-025 (Wiki analytics dashboard)  
**Scope**: 24 points remaining in Sprint 2 Week 3 (Days 6-7)

## Desired Outcomes
- ✅ Track every wiki edit with durable revision history and rollback support
- ✅ Deliver PostgreSQL tsvector-powered search surfaced via `/wiki/search` + MCP
- ✅ Capture view + engagement metrics and surface insights inside wiki + dashboard
- ✅ Maintain 0 TypeScript errors, 100% tests, and Mac mini parity (192.168.1.15)

## Dependencies & Guardrails
- Follow docs/03-Architecture.md + docs/02-DATABASE-SCHEMA.md (SoT)
- Preserve Server Component-first strategy (R-NEXT-001)
- No hardcoded data (pull analytics + metadata from DB)
- Update `.agent/progress.md`, `.agent/active-context.md`, docs/13-Project-Plan.md after delivery
- Tests: Jest + Playwright + API integration ≥ 80% coverage delta (R-TEST-001)

---

## Day 6 Focus – Versioning & Data Capture (US-023)

### Phase 1 – Schema & Migration (2 pts)
1. Add `WikiRevision` table (`id`, `wikiPageId`, `version`, `title`, `excerpt`, `content`, `diffSummary`, `createdBy`, `createdAt`).  
2. Extend `WikiPage` with `lastEditedBy`, `lastEditedAt`, `isLocked` (future moderation).  
3. Create database trigger or application hook to auto-insert revision rows on create/update.  
4. Seed script to backfill first revision for existing 7 pages.  
5. Migration tested locally + on Mac mini (192.168.1.15) with rollback plan.

### Phase 2 – API & MCP Plumbing (3 pts)
1. PATCH `/api/wiki/[slug]` – wrap update in transaction: create revision ➜ update page ➜ bump `version`.  
2. New route `GET /api/wiki/[slug]/history` (paged) + `POST /api/wiki/[slug]/revert` (restore revision).  
3. Enhance `wiki.update` MCP tool with optional `changelog` + ability to request revert.  
4. Log actor info (MCP API key, manual editor) for each revision for analytics.

### Phase 3 – UI Components & UX (3 pts)
1. Add `WikiRevisionTimeline` (server) + `RevisionDiffViewer` (client) under detail page.  
2. Provide revert CTA (guarded by confirmation modal).  
3. Surface metadata in `WikiHeader` (last edited by/time, version count).  
4. Update integration tests: ensure timeline renders, revert path works, SSR safe.

**Exit for Day 6**
- [x] Prisma migration applied both dev + Mac mini
- [x] Revision history visible with ≥1 entry per page
- [x] Revert endpoint + UI tested (326/326 tests passing)
- [ ] Updated docs + seeds committed

---

## Day 7 Focus – Search + Analytics (US-024, US-025)

### Phase 4 – Full-Text Search Upgrade (4 pts)
1. Add generated column `content_tsv` (`tsvector`) + `GIN` index on `WikiPage`.  
2. Background job/script to backfill `content_tsv` for legacy rows.  
3. Update GET `/api/wiki` & `/api/search` to support `query`, `ts_rank`, category boosts, pagination.  
4. Enhance MCP `wiki.search` & UI search bar (debounced) to surface ranked matches + highlighted excerpts.  
5. Tests: Prisma query unit tests, API integration, Playwright search scenario.

### Phase 5 – Analytics & Dashboard (4 pts)
1. Instrument `views`, `timeOnPage`, `feedback` writes via lightweight `WikiPageEvent` table.  
2. Nightly aggregation job (Prisma cron or server action) to roll up stats into `WikiPageAnalytics` (viewCount, avgReadTime, feedbackScore).  
3. New route `/wiki/analytics` (server) with widgets: Top Pages, Trending Tags, Feedback funnel.  
4. Component updates: `WikiContributors` shows positive/negative feedback counts; `WikiListClient` sorts by popularity.  
5. Optional MCP tool `wiki.analytics.getTopPages` if time allows (stretch).

### Phase 6 – Verification, Docs, Hand-off (3 pts)
1. Update `.agent/progress.md`, docs/13-Project-Plan.md (Week 3 Days 6-7).  
2. Append completion summary + Mac mini verification steps (API smoke).  
3. Tests: `pnpm lint`, `pnpm type-check`, `pnpm test`, targeted Playwright run.  
4. Evidence for Step 4.5 verification gate (revision restore, ranked search, analytics data).  
5. Prepare Mac mini instruction block if deployment tasks queued.

---

## Testing Matrix
- **Database**: Prisma tests for revision creation, revert, analytics rollup.  
- **API**: Supertest suite for `/api/wiki/*` new endpoints + `/api/search`.  
- **UI**: React Testing Library for new components, Playwright E2E for search + revision flows.  
- **MCP**: Unit tests for updated `wiki.*` tools using mocked HTTP client.

## Risks & Mitigation
1. **Large revision payloads** – Use `@db.Text` + optional diff summary; limit history page size.  
2. **tsvector support in Prisma** – Use raw SQL migration + computed column documented in `.agent/system/database-schema.md`.  
3. **Analytics accuracy** – Queue events via Server Action to avoid blocking SSR; fallback to `increment` queries when instrumentation fails.  
4. **Mac mini schema drift** – Run `prisma migrate deploy` on 192.168.1.15 before app start; include rollback instructions.

## Deliverables Checklist
- [ ] Prisma migration + seeds committed  
- [ ] API routes + MCP tools updated  
- [ ] UI components + pages updated  
- [ ] Tests + coverage artifacts attached  
- [ ] Documentation + progress trackers updated  
- [ ] Git commits referencing US-023/024/025  
- [ ] Step 4 checkpoints logged every 15K tokens
