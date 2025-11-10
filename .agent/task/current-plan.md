# Sprint 2 Day 3: Wiki Editor UI + MCP Tools

**Session**: 2025-11-10 14:55 IST
**User Stories**: US-018, US-020, US-021, US-022 (16 points)
**Goal**: Implement wiki editor with TipTap + 3 MCP tools

## Implementation Phases

### Phase 1: Wiki Editor UI (4-5 hours)
1. Install TipTap dependencies (@tiptap/react, @tiptap/starter-kit)
2. Create /wiki/new/page.tsx (new wiki page route)
3. Create WikiEditor.tsx component (Client Component with split view)
4. Create /wiki/[slug]/edit/page.tsx (edit wiki page route)
5. Add Zod validation schemas

### Phase 2: API Routes (2-3 hours)
6. Create POST /api/wiki endpoint
7. Create PATCH /api/wiki/[slug] endpoint
8. Create POST /api/wiki/search endpoint

### Phase 3: MCP Tools (2-3 hours)
9. Create wiki.create MCP tool
10. Create wiki.search MCP tool
11. Create wiki.update MCP tool
12. Register tools in MCP server

### Phase 4: Testing (1-2 hours)
13. Test wiki editor UI (create + edit flows)
14. Test MCP tools end-to-end
15. Verify zero TypeScript errors
16. Test on Mac mini

## Success Criteria (Step 4.5 Verification)
- [ ] TipTap dependencies installed (check package.json)
- [ ] /wiki/new/page.tsx exists and renders
- [ ] /wiki/[slug]/edit/page.tsx exists and loads content
- [ ] WikiEditor.tsx component functional (split view)
- [ ] Zod schemas created
- [ ] API routes created (POST /api/wiki, PATCH /api/wiki/[slug], POST /api/wiki/search)
- [ ] 3 MCP tools registered (wiki.create, wiki.search, wiki.update)
- [ ] Manual test: Create wiki page via UI → Success
- [ ] Manual test: Edit wiki page via UI → Success
- [ ] Manual test: Search wiki pages → Results
- [ ] Zero TypeScript errors (pnpm type-check)
- [ ] Mac mini verification (HTTP 200 on all routes)

## Token Budget
- Phase 1: ~40K tokens
- Phase 2: ~25K tokens
- Phase 3: ~20K tokens
- Phase 4: ~15K tokens
- Total: ~100K tokens

## Checkpoints (Step 4)
- 15K: Phase 1 progress
- 30K: Phase 1 complete, Phase 2 started
- 45K: Phase 2 progress
- 60K: Phase 2 complete, Phase 3 started
- 75K: Phase 3 progress
- 90K: Phase 4 testing started
