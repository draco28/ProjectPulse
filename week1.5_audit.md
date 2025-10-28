Week 1.5 (UI Theme Transformation) — Code vs Plan Audit
Below is a precise crosscheck of what’s built vs what’s left for Week 1.5, using docs/DEVELOPMENT_PLAN.md as source plus actual code in apps/web and prisma/schema.prisma. I’ve included exact file evidence and highlighted contradictions.

Findings
[Plan status claims conflict]
DEVELOPMENT*PLAN.md: Marks “Days 5–6: Five Remaining Pages ✅” as completed and Testing & QA “In Progress” (lines 121–140).
STATUS.md: Simultaneously says “Phase 3 Days 5–6 Complete! 🎉” and “🔴 BLOCKED — Testing revealed incomplete implementation” with 25 TypeScript errors and schema mismatches (lines 52–90).
Conclusion: Documentation claims completion, but code is partially implemented and currently non-functional due to schema and import mismatches.
[Theme lock to Coral]
Implemented:
apps/web/lib/theme-provider.tsx
locks data-theme="coral" and forces dark mode (lines 40–60).
apps/web/app/layout.tsx
wraps with
ThemeProvider
and loads Font Awesome CDN (lines 15–26).
apps/web/app/globals.css
defines Coral theme tokens, neumorphic effects, scrollbars, animations (entire file).
Matches plan (Phase 1).
[Dashboard component transformation]
Implemented components exist per transformation summary:
components/Header.tsx, components/Sidebar.tsx, components/dashboard/* (StatCard, IssueCard, WelcomeBanner, QuickActionsWidget, AgentPersonasWidget).
Dashboard completion doc: DASHBOARD*TRANSFORMATION_COMPLETE.md.
Matches plan (Phase 2).
[Routes/pages inventory]
Present pages:
Dashboard: app/dashboard/page.tsx
Issues List:
app/issues/page.tsx
(server component) — uses prisma.issue queries
Issue Detail: app/issues/[id]/page.tsx — uses prisma.issue + rich UI
Knowledge:
app/knowledge/page.tsx
— uses prisma.knowledgeItem
Wiki: app/wiki/[slug]/page.tsx and not-found.tsx
Security:
app/security/page.tsx
— uses prisma.securityFinding
Agents:
app/agents/page.tsx
— uses prisma.agentPersona
Command Palette: components/CommandPalette.tsx
Present API routes:
Issues: app/api/issues/[id]/comments/route.ts, app/api/issues/[id]/status/route.ts
Knowledge:
app/api/knowledge/route.ts
Search:
app/api/search/route.ts
Wiki: app/api/wiki/[slug]/route.ts
Security:
app/api/security/score/route.ts
,
app/api/security/vulnerabilities/route.ts
Misc: app/api/preferences/route.ts
E2E specs present: apps/web/tests/e2e/*.spec.ts for agents/dashboard/issue-detail/knowledge/security/wiki.
Matches plan (Phase 3 breadth), but see gaps below.
Critical Gaps and Discrepancies
[Prisma schema mismatch (BLOCKER)]
Actual prisma file is minimal: only UserPreferences exists (prisma/schema.prisma), no Issue, Comment, KnowledgeItem,
WikiPage
, SecurityFinding, AgentPersona.
Code references non-existent models in many places:
Issues List:
app/issues/page.tsx
uses prisma.issue.groupBy, prisma.issue.findMany.
Issue Detail: app/issues/[id]/page.tsx uses prisma.issue.
Knowledge:
app/knowledge/page.tsx
uses prisma.knowledgeItem.
Wiki: app/wiki/[slug]/page.tsx and api/wiki/[slug]/route.ts use prisma.wikiPage (and junctions).
Security:
app/security/page.tsx
and api/security/_ use prisma.securityFinding.
Agents:
app/agents/page.tsx
and
app/agents/actions.ts
use prisma.agentPersona.
Result: Prisma client cannot compile/generate these types; all dependent pages/routes will fail at build/runtime.
[Missing/incorrect imports (BLOCKER)]
Several files import a nonexistent
/lib/db
:
Knowledge page:
app/knowledge/page.tsx
line 2.
Wiki page: app/wiki/[slug]/page.tsx line 2.
Security page:
app/security/page.tsx
line 1.
Agents page:
app/agents/page.tsx
line 1.
Knowledge API:
app/api/knowledge/route.ts
line 2.
Wiki API: app/api/wiki/[slug]/route.ts line 2.
Security APIs:
app/api/security/score/route.ts
line 2, .../vulnerabilities/route.ts line 2.
Only
/lib/prisma
exists (apps/web/lib/prisma.ts). Some files correctly import this, others don’t. This inconsistency will break the build.
[Missing validation/types files referenced by code (BLOCKER)]
app/api/issues/[id]/comments/route.ts imports
/lib/validations/issue
(not present).
app/api/issues/[id]/status/route.ts imports
/lib/validations/issue
(not present).
app/issues/[id]/page.tsx imports
/types/issue
(not present).
Plan’s Day 0 mentions app/api/\_lib/validation.ts, but such central validation file doesn’t exist.
Result: Type errors and runtime failures for these routes/pages.
[Schema vs code property mismatch (BLOCKER)]
Agents domain:
Code expects AgentPersona.isActive, expertise: string[], personality?: string (e.g.,
app/agents/page.tsx
,
app/agents/actions.ts
).
docs/02-DATABASE-SCHEMA.md’s AgentPersona has different fields (skills, tools, autoActivate, isBuiltIn, etc.) and lacks isActive and expertise.
Wiki domain:
api/search/route.ts
expects WikiPage.category (selected in search results), but schema doesn’t define that field.
api/wiki/[slug]/route.ts uses relatedFrom → to naming; schema uses PageLink with sourcePage/targetPage via outgoingLinks/incomingLinks relations. Names don’t match code in a few places.
Knowledge domain:
Plan mentions KnowledgeArticle/KnowledgeCategory; code and schema consistently use KnowledgeItem + tags/category. The plan naming differs, but code -> docs/02 are aligned on KnowledgeItem. The main blocker is schema not applied.
[Testing status discrepancy]
E2E specs exist for 6 flows, and one unit test for CommandPalette exists (components/**tests**/CommandPalette.test.tsx), which aligns with STATUS.md claim of unit test passing for CommandPalette.
However, STATUS.md records E2E 0% passing and 25 TS errors—consistent with the schema/import errors above. Testing cannot proceed until failures are resolved.
[Plan vs implementation nuance]
Plan (Days 5–6) calls for API endpoints and E2E for all five pages; code shows intended endpoints present, but functionality is blocked by schema/imports/types.
Plan mentions “Server Actions pattern” for Agents and toggles. Code uses server actions (good), but also plan expects /api/agents endpoints; those routes are not present (code chose server actions instead of REST).
What’s Completed (and builds once schema/imports are aligned)
Theme foundation and UI system
Coral theme lock (
ThemeProvider
), global CSS, neumorphic effects, Font Awesome CDN.
Dashboard components + layout
Header, Sidebar, StatCard, IssueCard, WelcomeBanner, QuickActionsWidget, AgentPersonasWidget.
Completion doc: DASHBOARD_TRANSFORMATION_COMPLETE.md.
Page scaffolds and intended data-fetching
Issues List: filtering/sorting/pagination structure present.
Issue Detail: layout + comments/attachments/sidebars with client components.
Knowledge: search + tag filters + article cards.
Wiki: TOC extraction + content rendering + related pages sidebar + not-found.
Security: score meter + filters + vulnerabilities list.
Agents: cards + header + toggles (server actions).
Command Palette: full component with keyboard navigation.
API endpoints (stubs/logic)
Knowledge, Search, Wiki, Security (score + vulnerabilities), Issues (comments + status).
Pagination/metadata patterns included.
Tests
E2E spec files for 6 areas + CommandPalette unit test exists.
What’s Left (to make Week 1.5 truly complete)
[P1] Apply and generate the actual Prisma schema
Replace minimal
prisma/schema.prisma
with the real schema in
docs/02-DATABASE-SCHEMA.md
(models: Issue, Comment, Attachment, KnowledgeItem, WikiPage + PageLink, SecurityFinding, AgentPersona, etc.).
Run migrations and generate client. Seed minimum viable data for all entities referenced by pages.
This single change unblocks almost every page/API.
[P1] Fix import inconsistencies
Standardize on
/lib/prisma
(or create
/lib/db.ts
alias that re-exports the same singleton).
Update files currently importing
/lib/db
to the correct path.
[P1] Provide missing validation/types files
Add
/lib/validations/issue
(Zod schemas referenced by Issues API).
Add
/types/issue
(serializer and types referenced by Issue Detail page).
Or refactor imports to the centrally planned app/api/\_lib/validation.ts and put schemas there (but then update all imports accordingly).
[P1] Align code properties with schema
Agents: Either add isActive, expertise, personality to the schema, or update UI/server-actions to use the documented fields (autoActivate, skills, tools, etc.). Keep plan/docs and code in sync.
Wiki: Remove category references from code or add it to the schema (docs currently don’t include it). Fix relation naming (relatedFrom vs incomingLinks/outgoingLinks) to match Prisma.
Adjust search route selections accordingly.
[P2] Testing & QA
After schema + imports + validation/types are corrected:
Re-run unit tests and E2E; address remaining failing tests.
Add missing component tests where needed to approach 80%+ coverage (per [R-TEST-001]).
[P2] Documentation sync
Update DEVELOPMENT_PLAN.md “CURRENT STATUS” to reflect work actually complete (don’t mark Days 5–6 as fully “✅” until schema/imports/types are fixed).
Update STATUS.md to remove contradictions and accurately reflect blockers and progress.
[P3] Phase 4: Responsive & Polish
Not started yet per plan. After functionality/stability is ensured, implement responsive polish, pixel checks, and minor UX refinements.
Evidence Map (files proving the gaps)
Schema missing models
Actual schema:
prisma/schema.prisma
(only UserPreferences).
Plan schema:
docs/02-DATABASE-SCHEMA.md
(full models, lines 63–586).
Code references non-existent models:
apps/web/app/issues/page.tsx
→ prisma.issue.groupBy/findMany.
apps/web/app/issues/[id]/page.tsx → prisma.issue.
apps/web/app/knowledge/page.tsx
→ prisma.knowledgeItem.
apps/web/app/wiki/[slug]/page.tsx and apps/web/app/api/wiki/[slug]/route.ts → prisma.wikiPage (+ link relations).
apps/web/app/security/page.tsx
and apps/web/app/api/security/_ → prisma.securityFinding.
apps/web/app/agents/page.tsx
and
apps/web/app/agents/actions.ts
→ prisma.agentPersona.
Broken imports (db vs prisma)
Non-existent
/lib/db
used in:
Knowledge page, Wiki page, Security page, Agents page, Knowledge API, Wiki API, Security APIs.
Existing:
apps/web/lib/prisma.ts
.
Missing validations/types
Referenced but not found:
/lib/validations/issue
in Issues APIs.
/types/issue
in Issue Detail page.
Plan file mentioned: app/api/\_lib/validation.ts (not present).
Property mismatches
Agents: isActive, expertise, personality expected by code vs schema’s skills, tools, etc.
Wiki: category referenced in
api/search/route.ts
selection for wiki (schema doesn’t define).
Recommended Actions
[Do now — unblock build]
[schema] Replace prisma/schema.prisma with the schema from docs/02-DATABASE-SCHEMA.md. Run migrations, generate client, and seed minimum data.
[imports] Create apps/web/lib/db.ts that re-exports prisma from
prisma.ts
, or update all
/lib/db
imports to
/lib/prisma
. Choose one pattern and apply consistently.
[validations/types] Add:
apps/web/lib/validations/issue.ts containing the Zod schemas used in issues API (CommentSchema, StatusUpdateSchema).
apps/web/types/issue.ts containing IssueDetail types and serializeIssueDetail() as referenced by the Issue Detail page.
[Schema/code alignment]
Decide on AgentPersona fields (keep code semantics: isActive/expertise/personality, or adopt docs’ skills/autoActivate/isBuiltIn). Update one side to match the other and adjust code/seed accordingly.
Wiki link relation names: align code selections with documented outgoingLinks/incomingLinks structure. Remove category from wiki if not adding to schema.
[Testing]
Re-run tests after fixes; resolve failing E2E, add missing component tests to approach 80% coverage.
Ensure CommandPalette unit test continues to pass.
[Docs sync]
Update DEVELOPMENT_PLAN.md “CURRENT STATUS” to reflect that Days 5–6 pages are scaffolded with logic but blocked by schema/validation/import issues.
Keep STATUS.md and DEVELOPMENT_PLAN.md in perfect sync per maintenance protocol.
Snapshot: Plan Items vs Code
Phase 1 (Theme): Implemented.
Phase 2 (Components): Implemented (dashboard widgets and layout).
Phase 3 (Pages):
Issues List: Implemented (blocked by schema).
Issue Detail: Implemented (blocked by missing types/issue and schema).
Knowledge: Implemented (blocked by
/lib/db
and schema).
Wiki: Implemented + not-found (blocked by
/lib/db
and schema + link naming).
Security: Implemented (blocked by
/lib/db
and schema).
Agents: Implemented with server actions (blocked by schema field mismatch).
Command Palette: Implemented (component and unit test OK).
Phase 4 (Responsive & Polish): Not started.
Conclusion
The UI theme and all target pages/components are largely implemented, matching Week 1.5 scope structurally and stylistically.
The core blocker is a missing real Prisma schema and missing validation/types modules, plus import inconsistency (
/lib/db
vs
/lib/prisma
). These cause 25+ TS errors and prevent tests from passing.
After applying the documented schema, fixing imports, and adding the referenced validation/types files, Week 1.5 can be brought to “functionally complete,” after which responsive/polish (Phase 4) and the 80%+ testing target can be finalized.
Task Status
Analysis complete. I crosschecked DEVELOPMENT_PLAN.md with code and STATUS.md, listed concrete gaps with file evidence, and provided a prioritized fix plan.
