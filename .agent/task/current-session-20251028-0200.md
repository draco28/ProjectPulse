# Current Session: Next.js Architecture for 5 Pages

**Created**: 2025-10-28 02:00
**Type**: Expert Consultation (next-js-expert)
**Phase**: Week 1.5 Phase 3 Days 5-6 - Remaining Pages Implementation

## Context

User requests Next.js 14 App Router architecture guidance for implementing 5 complex pages:

1. **Knowledge Base Page** - Article listing with category filtering and full-text search
2. **Wiki Page** - Dynamic [slug] route with markdown rendering and scroll spy TOC
3. **Security Page** - Real-time security score dashboard with vulnerability filtering
4. **Agent Personas Page** - Agent cards with toggle switches and optimistic UI
5. **Command Palette** - Global keyboard shortcut (Cmd+K) with fuzzy search

## Current Project State

**Completed**:

- Dashboard page (Phase 2) with neumorphic components
- Issues List page (Day 3) with filtering, search, pagination
- Issue Detail page (Day 4) with comments, attachments, status updates

**Established Patterns** (from existing codebase):

- Server Components for pages (`app/issues/page.tsx`)
- Client Components for interactivity (`"use client"`)
- URL state management with searchParams + useRouter
- Debounced search with custom hooks
- Neumorphic design system (glass-dark, coral-gradient, neu-raised)
- Zod validation for API routes
- Server Actions with `revalidatePath()`
- Type-safe serialization (Date → ISO string)

**Technical Stack**:

- Next.js 14.1.0 App Router
- React 18.2
- TypeScript strict mode
- Tailwind CSS + neumorphic design system
- Prisma ORM + PostgreSQL 16
- Zod validation

## User Questions Addressed

### 1. Knowledge Base

✅ Server Component for initial page load? **YES - with force-dynamic**
✅ How to handle filters? **searchParams in URL (shareable)**
✅ Caching strategy? **force-dynamic (always fresh for search)**
✅ Separate route for search? **Same page, URL params**

### 2. Wiki

✅ generateStaticParams? **YES - all wiki slugs at build time**
✅ ISR vs SSR? **ISR with 3600s revalidate (docs change infrequently)**
✅ Revalidation time? **1 hour (3600s) with on-demand option**
✅ Handle 404 slugs? **notFound() + custom not-found.tsx**

### 3. Security

✅ Server Component for aggregations? **YES - with force-dynamic**
✅ Revalidation strategy? **force-dynamic (real-time vulnerability data)**
✅ Filters in URL params? **YES - consistent with Issues pattern**

### 4. Agent Personas

✅ Server Actions pattern? **YES - best for toggle mutations**
✅ API routes vs Server Actions? **Server Actions (simpler, optimistic UI)**
✅ revalidatePath() vs revalidateTag()? **revalidatePath('/agents')**
✅ Optimistic UI? **useOptimistic hook for instant feedback**

### 5. Command Palette

✅ Mount location? **layout.tsx via CommandPaletteProvider**
✅ API routes vs Server Actions? **API routes (Client Component needs fetch)**
✅ Parallel data fetching? **Promise.all() across 4 entities (issues, knowledge, wiki, agents)**

## Technical Decisions Summary

### Rendering Strategies

| Page            | Strategy      | Revalidate | Reason                         |
| --------------- | ------------- | ---------- | ------------------------------ |
| Knowledge       | force-dynamic | N/A        | Search changes frequently      |
| Wiki            | ISR           | 3600s      | Docs change infrequently       |
| Security        | force-dynamic | N/A        | Real-time vulnerability data   |
| Agents          | force-dynamic | N/A        | Activation state changes often |
| Command Palette | Client-side   | N/A        | Modal, no server render        |

### Component Strategies

**Knowledge Base**:

- Server: Page layout, data fetching, filter counts
- Client: SearchBar (debounced), CategoryFilter (URL state), ArticleCard

**Wiki**:

- Server: Page layout, markdown rendering, related articles
- Client: TableOfContents (IntersectionObserver scroll spy)

**Security**:

- Server: Page layout, aggregation queries, vulnerability list
- Client: SecurityScoreMeter (animated SVG), VulnerabilityFilter

**Agents**:

- Server: Page layout, agent list fetch
- Client: AgentCard (useOptimistic for toggle)

**Command Palette**:

- Client: Full modal with useReducer for keyboard nav

### Data Fetching Patterns

1. **Parallel Fetching**: All pages use Promise.all() for independent queries
2. **Selective Includes**: Use Prisma select to avoid over-fetching
3. **URL State**: All filters use searchParams (shareable URLs)
4. **Pagination**: Offset-based (small datasets) or cursor-based (large)

### Performance Optimizations

1. **Bundle Size Targets**: < 150KB First Load JS
2. **Debouncing**: 300-500ms for search inputs
3. **IntersectionObserver**: Scroll spy (more performant than scroll listener)
4. **useReducer**: Complex keyboard nav in Command Palette
5. **Optimistic UI**: useOptimistic for instant feedback on mutations

## Deliverable Created

**File**: `.agent/task/nextjs-5-pages-architecture-20251028-0200.md`

**Contents**: Comprehensive Next.js 14 implementation plan covering:

- Architecture decisions for all 5 pages (50+ pages of detailed guidance)
- Server vs Client Component recommendations with decision tree
- Caching strategies (force-dynamic, ISR, revalidate times)
- Complete code examples for all pages
- Client Components (SearchBar, TableOfContents, SecurityScoreMeter, AgentCard, CommandPalette)
- Server Actions pattern for mutations
- API routes for unified search
- Performance considerations and bundle size analysis
- Testing strategy (unit, component, E2E)
- Implementation order for parent agent

**Key Patterns Documented**:

1. **Server Component + URL State**: Knowledge Base, Security (filtering with searchParams)
2. **ISR + generateStaticParams**: Wiki (pre-render all pages, revalidate hourly)
3. **Server Actions + Optimistic UI**: Agent Personas (instant toggle feedback)
4. **Client Modal + API Routes**: Command Palette (keyboard nav with useReducer)
5. **IntersectionObserver**: Wiki TOC (scroll spy without scroll listener)
6. **Parallel Fetching**: All pages use Promise.all() for performance
7. **Debounced Search**: SearchBar component (300-500ms delay)
8. **Selective Prisma Queries**: Include only needed relations, select specific fields

## Implementation Order for Parent Agent

### Phase 1: Foundation (Day 5 Morning)

1. Knowledge Base Page
   - `app/knowledge/page.tsx` (Server Component with force-dynamic)
   - FilterSidebar, SearchBar, ArticleCard (Client Components)
   - Prisma queries with parallel fetching

### Phase 2: Documentation (Day 5 Afternoon)

2. Wiki Page
   - `app/wiki/[slug]/page.tsx` (ISR with generateStaticParams)
   - TableOfContents (IntersectionObserver scroll spy)
   - Markdown rendering (ReactMarkdown or next-mdx-remote)

### Phase 3: Real-Time Dashboard (Day 6 Morning)

3. Security Page
   - `app/security/page.tsx` (Dynamic Server Component)
   - SecurityScoreMeter (animated SVG)
   - Aggregation queries for vulnerability counts

### Phase 4: Interactive Mutations (Day 6 Afternoon)

4. Agent Personas Page
   - `app/agents/page.tsx` (Server Component + Server Actions)
   - AgentCard (useOptimistic for instant feedback)
   - Server Actions with revalidatePath()

### Phase 5: Global Feature (Day 6 Evening)

5. Command Palette
   - CommandPaletteProvider in app/layout.tsx
   - Keyboard shortcut listener (Cmd+K)
   - Unified search API route (`/api/search`)
   - Modal with useReducer for keyboard nav

## Key Recommendations

1. ✅ **Server Components First**: Default to Server, use Client only for interactivity
2. ✅ **URL State for Filters**: searchParams for shareable, bookmarkable URLs
3. ✅ **ISR for Documentation**: Wiki uses revalidate = 3600 (best performance)
4. ✅ **Dynamic for Real-Time**: Security/Knowledge use force-dynamic (always fresh)
5. ✅ **Server Actions for Mutations**: Agent toggles (simpler than API routes)
6. ✅ **API Routes for Search**: Complex queries accessible from Client Components
7. ✅ **Parallel Fetching**: Promise.all() for independent queries (⚡ performance)
8. ✅ **Optimistic UI**: useOptimistic for instant feedback (better UX)
9. ✅ **IntersectionObserver**: Scroll spy (more performant than scroll listener)
10. ✅ **useReducer**: Complex keyboard navigation (cleaner state management)

## File Structure Created

```
app/
├── knowledge/
│   ├── page.tsx              # Server Component (force-dynamic)
│   └── components/
│       ├── SearchBar.tsx     # Client (debounced)
│       ├── CategoryFilter.tsx # Client (URL state)
│       └── ArticleCard.tsx   # Client
├── wiki/
│   ├── page.tsx              # Redirect to /wiki/home
│   ├── [slug]/
│   │   ├── page.tsx          # Server Component (ISR, revalidate: 3600)
│   │   ├── loading.tsx       # Loading skeleton
│   │   └── not-found.tsx     # 404 handler
│   └── components/
│       ├── TableOfContents.tsx # Client (IntersectionObserver)
│       ├── WikiSidebar.tsx    # Server
│       └── RelatedArticles.tsx # Server
├── security/
│   ├── page.tsx              # Server Component (force-dynamic)
│   └── components/
│       ├── SecurityScoreMeter.tsx # Client (animated SVG)
│       ├── VulnerabilityCard.tsx  # Client
│       └── VulnerabilityFilter.tsx # Client
├── agents/
│   ├── page.tsx              # Server Component (force-dynamic)
│   └── components/
│       └── AgentCard.tsx     # Client (useOptimistic)
├── actions/
│   └── agents.ts             # Server Actions (toggleAgentStatus)
├── api/
│   └── search/
│       └── route.ts          # Unified search endpoint
└── components/
    └── CommandPalette/
        ├── index.tsx         # Client Component (useReducer)
        └── CommandPaletteProvider.tsx # Context + keyboard listener
```

## Progress

- [x] Read STATUS.md and DEVELOPMENT_PLAN.md
- [x] Read system-patterns.md for established patterns
- [x] Reviewed existing implementations (Issues pages)
- [x] Analyzed Prisma schema for data models
- [x] Created comprehensive implementation plan (16,000+ tokens)
- [x] Documented all architectural decisions
- [x] Provided complete code examples for all pages
- [x] Created implementation order for parent agent
- [x] Saved plan to file

## Session Complete

**Deliverable**: `.agent/task/nextjs-5-pages-architecture-20251028-0200.md`

**Summary for Parent Agent**:

I've created a comprehensive Next.js 14 App Router implementation plan for all 5 pages with optimal Server/Client Component decisions, caching strategies, and performance optimizations. All architectural decisions are made with complete code examples provided.

**Key Decisions**:

- Knowledge Base: Dynamic Server Component with force-dynamic (search changes frequently)
- Wiki: ISR with 3600s revalidate and generateStaticParams (best performance for docs)
- Security: Dynamic Server Component with real-time aggregations
- Agents: Server Actions + useOptimistic for instant toggle feedback
- Command Palette: Client modal with useReducer keyboard nav + unified search API

**Next Steps**: Follow implementation order in plan (Knowledge → Wiki → Security → Agents → Command Palette)

All patterns follow your established Issues implementation and extend them consistently across new pages.
