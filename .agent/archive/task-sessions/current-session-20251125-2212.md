# Session: Sprint 10 - Ticket System Implementation

**Started:** 2025-11-25 22:12
**Branch:** feature/sprint-10-ticket-system
**Phase:** Sprint 10 - Ticket System (Issue → Ticket Migration)

## Goals

1. Migrate Issue model to unified Ticket model with `kind` field
2. Enable features, tasks, epics, and issues as subtypes
3. Zero backlogs - production-ready implementation

## Approach

- **Option B (In-place migration)**: Rename Issue table → Ticket, add new fields
- **Full route migration**: `/issues` → `/tickets` with redirect
- **MCP adapter pattern**: `issue_*` tools delegate to `ticket_*`

## Key Decisions

1. ✅ Create NEW Ticket model via in-place migration (not new table)
2. ✅ Full route migration to `/tickets`
3. ✅ Rename ALL components (IssueX → TicketX)
4. ✅ Dashboard: "Open Issues" → "Open Tickets"
5. ✅ Keep `issue_*` MCP tools as adapters for backwards compatibility

## Progress

- [x] Step 1: Session initialized
- [x] Step 2: Prisma expert consultation
- [x] Week 1 Day 1-2: Schema migration complete
  - Created Ticket model with new fields (kind, source, assigneeType, assigneeId, linkedTaskId)
  - Renamed related models (Comment→TicketComment, Attachment→TicketAttachment, etc.)
  - Migration applied: `20251125221500_sprint10_ticket_system`
  - Data preserved with kind='issue' default
- [x] Week 1 Day 3: Created /api/tickets routes
- [ ] Week 1 Day 3-4: Update all Issue→Ticket references in codebase (IN PROGRESS)
- [ ] Week 1 Day 5: Zod schemas and tests
- [ ] Week 2: MCP tools + UI refactor
- [ ] Step 5: Testing and documentation

## Files Modified

**Schema:**
- `apps/web/prisma/schema.prisma` - Full Ticket model migration
- `apps/web/prisma/migrations/20251125221500_sprint10_ticket_system/migration.sql`

**Validations:**
- `apps/web/lib/validations/ticket.ts` - NEW

**API Routes (New):**
- `apps/web/app/api/tickets/route.ts`
- `apps/web/app/api/tickets/_utils.ts`
- `apps/web/app/api/tickets/[id]/route.ts`
- `apps/web/app/api/tickets/[id]/status/route.ts`
- `apps/web/app/api/tickets/[id]/comments/route.ts`
- `apps/web/app/api/tickets/bulk/route.ts`

**API Routes (Updated):**
- `apps/web/app/api/issues/route.ts` - Converted to wrapper

## TypeScript Errors to Fix

Many files still reference `prisma.issue` which no longer exists. Need to update:
- app/api/issues/[id]/*.ts
- app/api/issues/bulk/route.ts
- app/dashboard/page.tsx
- app/issues/*.tsx
- app/api/search/route.ts
- app/api/security/vulnerabilities/route.ts
- app/api/projects/route.ts

## Notes

Spec approved: /Users/draco/.factory/specs/2025-11-25-sprint-10-ticket-system-issue-ticket-migration.md
