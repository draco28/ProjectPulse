# TODO: Sprint 2 Week 3 Days 6-7 – Wiki Advanced Features

**Session**: 2025-11-11 14:59 PST  
**Stories**: US-023 (Versioning), US-024 (Search), US-025 (Analytics)  
**Progress**: 0/21 tasks complete (0%)

## Session Protocol Tasks
- [x] Read .agent/MANDATORY_SESSION_PROTOCOL.md and initialize session
- [ ] Save plan + todos via protocol-updater confirmation
- [x] Consult prisma-expert (tsvector + versioning schema)
- [x] Consult react-expert (analytics + revision UI)
- [x] Schedule 15K-token checkpoints + verification gate evidence

## Day 6 – Versioning & Data Capture (US-023)
1. [x] Update Prisma schema with `WikiRevision`, `lastEditedBy`, `lastEditedAt`, `isLocked`
2. [x] Generate + apply migration locally, then on Mac mini (192.168.1.15)
3. [x] Seed existing wiki pages with initial revisions + actor metadata
4. [x] Enhance PATCH `/api/wiki/[slug]` to wrap updates + write revision entries
5. [x] Add `GET /api/wiki/[slug]/history` + `POST /api/wiki/[slug]/revert`
6. [x] Update MCP `wiki.update` to pass changelog + optional revert flag
7. [x] Build `WikiRevisionTimeline` + `RevisionDiffViewer` components
8. [x] Integrate revision UI into `/wiki/[slug]` with revert CTA + confirmation dialog

## Day 7 – Search + Analytics (US-024, US-025)
9. [x] Add `content_tsv` generated column + GIN index via SQL migration
10. [x] Backfill search vectors + add script for future updates
11. [x] Upgrade `/api/wiki` + `/api/search` to support `query`, `ts_rank`, category boosts
12. [x] Update MCP `wiki.search` + client search UI to show ranked results + highlights
13. [x] Create `WikiPageEvent` + `WikiPageAnalytics` models + aggregation job
14. [x] Instrument view + feedback events (server action + API endpoint)
15. [x] Build `/wiki/analytics` page + shared components (TopPages, TrendingTags, FeedbackFunnel)
16. [x] Surface analytics snippets on list/detail (views, helpful %, popularity sort)
17. [x] (Stretch) Add MCP tool `wiki.analytics.topPages` if time remains

## Verification & Documentation
18. [ ] Run `pnpm lint`, `pnpm type-check`, `pnpm test`, targeted Playwright flows
19. [ ] Capture evidence for Step 4.5 gate (screens + API logs)
20. [ ] Update `.agent/progress.md`, `.agent/active-context.md`, docs/13-Project-Plan.md
21. [ ] Prepare Mac mini deployment/test notes + git commits referencing US-023/024/025

## Checkpoints (Step 4 – Every 15K tokens)
- [ ] 15K: Schema + migration status
- [ ] 30K: API + MCP updates
- [ ] 45K: Revision UI wired up
- [ ] 60K: Search upgrade validated
- [ ] 75K: Analytics dashboard functional
- [ ] 90K: Testing + documentation complete

## Notes
- Services hosted on Mac mini `192.168.1.15`; verify API + Next.js after migrations.
- Ensure localStorage fallbacks remain defensive in FeedbackButtons per Day 5 fixes.
- Keep TypeScript strict (no `any`); extend shared types in `apps/web/types/wiki.ts`.
