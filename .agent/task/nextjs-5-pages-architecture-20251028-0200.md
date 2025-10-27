# Next.js 14 App Router Implementation Plan: 5 Pages

**Created**: 2025-10-28 02:00
**Type**: Next.js Architecture & Implementation Strategy
**Phase**: Week 1.5 Phase 3 Days 5-6 - Knowledge, Wiki, Security, Agents, Command Palette

---

## Executive Summary

This plan provides comprehensive Next.js 14 App Router architecture decisions for implementing 5 complex pages with optimal Server/Client Component strategies, data fetching patterns, and caching configurations. All recommendations follow the established patterns from your Issues pages implementation.

**Key Decisions**:

- **Server Components First**: All pages default to Server Components for data fetching
- **URL State for Filters**: searchParams for all filterable lists (shareable URLs)
- **ISR for Documentation**: Wiki pages use Incremental Static Regeneration
- **Dynamic for Real-Time**: Security dashboard uses force-dynamic
- **Server Actions for Mutations**: Agent toggles, status changes
- **Route Handlers for Search**: Complex queries and full-text search

---

## Established Patterns (from Issues Implementation)

Your codebase already has excellent patterns that we'll extend:

### ✅ Server Component Data Fetching

```typescript
// app/issues/page.tsx pattern
export default async function Page({ searchParams }) {
  const params = await searchParams;
  const [data, counts] = await Promise.all([
    getData(params),      // Parallel fetching
    getCounts()
  ]);

  return (
    <div>
      <ServerLayout data={data} />
      <ClientComponents initialData={data} />
    </div>
  );
}
```

### ✅ URL State Management

```typescript
// SearchParams pattern (from Issues)
interface SearchParams {
  status?: string; // Comma-separated: "open,in_progress"
  priority?: string;
  search?: string;
  page?: string;
}

// Build Prisma where clause from searchParams
const where: WhereClause = {};
if (statusFilter.length > 0) {
  where.status = { in: statusFilter };
}
```

### ✅ Prisma Query Optimization

```typescript
// Single query with selective includes (no N+1)
const issues = await prisma.issue.findMany({
  where,
  include: {
    comments: { select: { id: true } }, // Count only
    attachments: { select: { id: true } },
  },
  orderBy,
  take: perPage,
  skip: (page - 1) * perPage,
});
```

### ✅ Hybrid Server/Client Pattern

```typescript
// Server Component (page.tsx)
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent initialData={data} />;
}

// Client Component (separate file)
"use client";
export function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData);
  // Client-side interactivity
}
```

---

## Page 1: Knowledge Base (`app/knowledge/page.tsx`)

### Architecture Decision

**Rendering Strategy**: ✅ **Dynamic Server Component** (force-dynamic)

**Reason**:

- Articles change frequently (search indexes update)
- Full-text search requires dynamic queries
- Category filtering with real-time counts

**Component Strategy**:

- **Server Component**: Page layout, initial data fetch, filter counts
- **Client Components**: SearchBar (debounced input), CategoryFilter (toggle UI), ArticleCard (click events)

### File Structure

```
app/
├── knowledge/
│   ├── page.tsx                    # Server Component (Dynamic)
│   ├── [slug]/
│   │   └── page.tsx                # Server Component (ISR)
│   └── components/
│       ├── SearchBar.tsx           # Client Component
│       ├── CategoryFilter.tsx      # Client Component
│       └── ArticleCard.tsx         # Client Component
```

### Data Fetching Strategy

**Method**: Server Component + Prisma queries
**Caching**: `export const dynamic = 'force-dynamic'`

```typescript
// app/knowledge/page.tsx
export const dynamic = 'force-dynamic'; // Always fresh data

interface SearchParams {
  category?: string;    // Single category or "all"
  search?: string;      // Full-text search term
  page?: string;        // Pagination
}

async function getKnowledgeArticles(params: SearchParams) {
  const { category, search, page = '1' } = params;
  const perPage = 20;

  // Build where clause
  const where: any = {};

  if (category && category !== 'all') {
    where.category = category;
  }

  if (search) {
    // Use Prisma fullTextSearch (assuming PostgreSQL)
    // Or fall back to contains for simpler search
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Parallel fetching
  const [articles, totalCount, categoryCount] = await Promise.all([
    prisma.knowledgeItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true,    // First 200 chars for preview
        category: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { linkedIssues: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: perPage,
      skip: (parseInt(page) - 1) * perPage,
    }),

    prisma.knowledgeItem.count({ where }),

    // Category counts for filter sidebar
    prisma.knowledgeItem.groupBy({
      by: ['category'],
      _count: true,
      where: search ? { OR: where.OR } : undefined, // Apply search to counts
    }),
  ]);

  return {
    articles,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage),
    currentPage: parseInt(page),
    categories: Object.fromEntries(
      categoryCount
        .filter(c => c.category)
        .map(c => [c.category, c._count])
    ),
  };
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await getKnowledgeArticles(params);

  return (
    <>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised rounded-3xl px-8 py-5">
            <h2 className="text-3xl font-bold text-white">Knowledge Base</h2>
            <p className="text-sm text-slate">
              Search {data.totalCount} articles across {Object.keys(data.categories).length} categories
            </p>
          </header>

          <main className="flex flex-1 gap-4 overflow-hidden">
            {/* Category Sidebar */}
            <CategoryFilter
              categories={data.categories}
              selectedCategory={params.category || 'all'}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
              {/* Search Bar (Client Component with debounce) */}
              <SearchBar initialSearch={params.search} />

              {/* Articles Grid */}
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={{
                      id: article.id.toString(),
                      title: article.title,
                      excerpt: article.content.substring(0, 200) + '...',
                      category: article.category || 'Uncategorized',
                      tags: article.tags,
                      linkedIssues: article._count.linkedIssues,
                      updatedAt: article.updatedAt.toISOString(),
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <Pagination
                  currentPage={data.currentPage}
                  totalPages={data.totalPages}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
```

### Client Components

**SearchBar.tsx** (Debounced input):

```typescript
"use client";
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce'; // or custom hook

export function SearchBar({ initialSearch = '' }: { initialSearch?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  // Debounce 500ms
  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set('search', value);
      params.set('page', '1'); // Reset to page 1 on search
    } else {
      params.delete('search');
    }

    startTransition(() => {
      router.push(`/knowledge?${params.toString()}`);
    });
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  return (
    <div className="neu-raised rounded-3xl p-4">
      <div className="relative">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate"></i>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={handleChange}
          className="w-full rounded-2xl bg-glass-darker py-3 pl-12 pr-4 text-white placeholder-slate focus:outline-none focus:ring-2 focus:ring-coral"
        />
        {isPending && (
          <i className="fas fa-spinner fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-coral"></i>
        )}
      </div>
    </div>
  );
}
```

**CategoryFilter.tsx** (URL state):

```typescript
"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function CategoryFilter({
  categories,
  selectedCategory
}: {
  categories: Record<string, number>;
  selectedCategory: string;
}) {
  const searchParams = useSearchParams();

  const createCategoryUrl = (category: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', category);
    params.set('page', '1');
    return `/knowledge?${params.toString()}`;
  };

  return (
    <aside className="neu-raised w-64 rounded-3xl p-6">
      <h3 className="mb-4 text-lg font-bold text-white">Categories</h3>

      <div className="space-y-2">
        <Link
          href={createCategoryUrl('all')}
          className={`block rounded-2xl px-4 py-2 transition-colors ${
            selectedCategory === 'all'
              ? 'bg-coral text-white'
              : 'text-slate hover:bg-glass-darker hover:text-white'
          }`}
        >
          All Articles
        </Link>

        {Object.entries(categories).map(([category, count]) => (
          <Link
            key={category}
            href={createCategoryUrl(category)}
            className={`flex items-center justify-between rounded-2xl px-4 py-2 transition-colors ${
              selectedCategory === category
                ? 'bg-coral text-white'
                : 'text-slate hover:bg-glass-darker hover:text-white'
            }`}
          >
            <span>{category}</span>
            <span className="text-xs opacity-60">{count}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
```

### Performance Considerations

**Bundle Size**:

- SearchBar (~2KB with debounce utility)
- CategoryFilter (~1KB)
- ArticleCard (~1KB)
- **Total Client JS**: ~4KB (well under 150KB target)

**Data Fetching**:

- ✅ Parallel with Promise.all() (3 queries in parallel)
- ✅ Selective fields with select (no over-fetching)
- ✅ Pagination (20 per page)

**Loading State**:

```typescript
// app/knowledge/loading.tsx
export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <i className="fas fa-spinner fa-spin text-4xl text-coral"></i>
        <p className="mt-4 text-slate">Loading articles...</p>
      </div>
    </div>
  );
}
```

---

## Page 2: Wiki (`app/wiki/[slug]/page.tsx`)

### Architecture Decision

**Rendering Strategy**: ✅ **ISR (Incremental Static Regeneration)**

**Reason**:

- Documentation changes infrequently
- Can pre-render all wiki pages at build time
- Revalidate every hour (or on-demand)
- Best performance for readers

**Component Strategy**:

- **Server Component**: Page layout, markdown rendering, related articles
- **Client Components**: TableOfContents (scroll spy), CopyCodeButton, BreadcrumbNav

### File Structure

```
app/
├── wiki/
│   ├── page.tsx                    # Redirect to /wiki/home
│   ├── [slug]/
│   │   ├── page.tsx                # Server Component (ISR)
│   │   ├── loading.tsx             # Loading UI
│   │   └── not-found.tsx           # 404 for invalid slugs
│   └── components/
│       ├── TableOfContents.tsx     # Client Component (scroll spy)
│       ├── WikiSidebar.tsx         # Server Component
│       └── RelatedArticles.tsx     # Server Component
```

### Data Fetching Strategy

**Method**: Server Component + generateStaticParams + ISR
**Caching**: `export const revalidate = 3600` (1 hour)

```typescript
// app/wiki/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReactMarkdown from 'react-markdown';
import { TableOfContents } from '@/components/wiki/TableOfContents';
import { WikiSidebar } from '@/components/wiki/WikiSidebar';
import { RelatedArticles } from '@/components/wiki/RelatedArticles';

// ISR: Revalidate every hour
export const revalidate = 3600;

// Generate static paths for all wiki pages
export async function generateStaticParams() {
  const pages = await prisma.wikiPage.findMany({
    select: { path: true },
  });

  // Convert /rules/combat/fsm → rules-combat-fsm
  return pages.map((page) => ({
    slug: page.path.replace(/^\//, '').replace(/\//g, '-'),
  }));
}

// Metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = '/' + slug.replace(/-/g, '/');

  const page = await prisma.wikiPage.findUnique({
    where: { path },
    select: { title: true },
  });

  if (!page) {
    return { title: 'Page Not Found | Wiki' };
  }

  return {
    title: `${page.title} | Wiki | ProjectPulse`,
    description: `Documentation for ${page.title}`,
  };
}

// Fetch wiki page with related content
async function getWikiPage(slug: string) {
  const path = '/' + slug.replace(/-/g, '/');

  const page = await prisma.wikiPage.findUnique({
    where: { path },
    include: {
      // Related pages (bidirectional links)
      outgoingLinks: {
        include: {
          targetPage: {
            select: {
              id: true,
              title: true,
              path: true,
            },
          },
        },
      },
      incomingLinks: {
        include: {
          sourcePage: {
            select: {
              id: true,
              title: true,
              path: true,
            },
          },
        },
        take: 5, // Limit incoming links
      },

      // Parent/child hierarchy
      parent: {
        select: {
          id: true,
          title: true,
          path: true,
        },
      },
      children: {
        select: {
          id: true,
          title: true,
          path: true,
          orderIndex: true,
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  return page;
}

// Extract headings from markdown content (for TOC)
function extractHeadings(content: string) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
    });
  }

  return headings;
}

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getWikiPage(slug);

  if (!page) {
    notFound();
  }

  // Extract TOC from markdown
  const headings = extractHeadings(page.content);

  // Related pages (combine outgoing + incoming)
  const relatedPages = [
    ...page.outgoingLinks.map(link => link.targetPage),
    ...page.incomingLinks.map(link => link.sourcePage),
  ].slice(0, 5); // Top 5 related

  return (
    <>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* Left: Wiki Navigation Sidebar */}
          <WikiSidebar
            currentPath={page.path}
            parent={page.parent}
            siblings={page.children}
          />

          {/* Center: Article Content */}
          <main className="flex-1 overflow-auto">
            <article className="neu-raised mx-auto max-w-4xl rounded-3xl p-8">
              {/* Breadcrumb */}
              {page.parent && (
                <nav className="mb-6 text-sm text-slate">
                  <Link href={`/wiki/${page.parent.path.slice(1).replace(/\//g, '-')}`}>
                    {page.parent.title}
                  </Link>
                  <span className="mx-2">/</span>
                  <span className="text-white">{page.title}</span>
                </nav>
              )}

              {/* Title */}
              <h1 className="mb-6 text-4xl font-bold text-white">{page.title}</h1>

              {/* Metadata */}
              <div className="mb-8 flex items-center gap-6 text-sm text-slate">
                <span className="flex items-center gap-2">
                  <i className="fas fa-clock"></i>
                  Updated {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-2">
                  <i className="fas fa-code-branch"></i>
                  Version {page.version}
                </span>
              </div>

              {/* Markdown Content */}
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    // Custom components for code blocks, callouts, etc.
                    code: ({ node, inline, className, children, ...props }) => {
                      return inline ? (
                        <code className="rounded bg-glass-darker px-1.5 py-0.5 text-sm text-coral" {...props}>
                          {children}
                        </code>
                      ) : (
                        <div className="relative">
                          <pre className="rounded-2xl bg-glass-darker p-4 overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                          <CopyCodeButton code={String(children)} />
                        </div>
                      );
                    },
                    h2: ({ children }) => {
                      const id = String(children).toLowerCase().replace(/\s+/g, '-');
                      return <h2 id={id} className="scroll-mt-20">{children}</h2>;
                    },
                    h3: ({ children }) => {
                      const id = String(children).toLowerCase().replace(/\s+/g, '-');
                      return <h3 id={id} className="scroll-mt-20">{children}</h3>;
                    },
                  }}
                >
                  {page.content}
                </ReactMarkdown>
              </div>

              {/* Related Articles */}
              {relatedPages.length > 0 && (
                <RelatedArticles pages={relatedPages} />
              )}
            </article>
          </main>

          {/* Right: Table of Contents (Client Component with scroll spy) */}
          <TableOfContents headings={headings} />
        </div>
      </div>
    </>
  );
}
```

### Client Component: TableOfContents (Scroll Spy)

```typescript
// app/wiki/components/TableOfContents.tsx
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Heading {
  level: number;
  text: string;
  id: string;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // IntersectionObserver for scroll spy (more performant than scroll listener)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66%', // Trigger when heading is near top
        threshold: 1.0,
      }
    );

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="neu-raised sticky top-4 h-fit w-64 rounded-3xl p-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate">
        On This Page
      </h3>

      <nav className="space-y-2">
        {headings.map((heading) => (
          <Link
            key={heading.id}
            href={`#${heading.id}`}
            className={`block text-sm transition-colors ${
              activeId === heading.id
                ? 'text-coral font-semibold'
                : 'text-slate hover:text-white'
            }`}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            {heading.text}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

### 404 Handler

```typescript
// app/wiki/[slug]/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="neu-raised rounded-3xl p-12 text-center">
        <i className="fas fa-file-slash text-6xl text-coral mb-6"></i>
        <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-slate mb-6">
          The wiki page you're looking for doesn't exist.
        </p>
        <Link
          href="/wiki"
          className="coral-gradient rounded-2xl px-6 py-3 font-semibold text-white"
        >
          <i className="fas fa-home mr-2"></i>
          Back to Wiki Home
        </Link>
      </div>
    </div>
  );
}
```

### Performance Considerations

**ISR Benefits**:

- ✅ Pre-rendered at build time (instant loading)
- ✅ Revalidates every hour (fresh content)
- ✅ On-demand revalidation possible (revalidatePath('/wiki/[slug]'))

**Bundle Size**:

- TableOfContents (~3KB with IntersectionObserver)
- ReactMarkdown (~15KB - consider next-mdx-remote for smaller bundle)

**Optimization**:

```typescript
// If ReactMarkdown is too heavy, use next-mdx-remote:
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';

async function getWikiPage(slug: string) {
  const page = await prisma.wikiPage.findUnique({ where: { path } });

  // Serialize MDX on server (once)
  const mdxSource = await serialize(page.content);

  return { ...page, mdxSource };
}

// In component:
<MDXRemote {...page.mdxSource} components={customComponents} />
```

---

## Page 3: Security (`app/security/page.tsx`)

### Architecture Decision

**Rendering Strategy**: ✅ **Dynamic Server Component** (force-dynamic)

**Reason**:

- Security scores should always be fresh
- Real-time vulnerability scanning results
- Aggregation queries change frequently

**Component Strategy**:

- **Server Component**: Page layout, score aggregation, vulnerability list
- **Client Components**: SecurityScoreMeter (animated gauge), VulnerabilityFilter (checkboxes), ScannerStatus (live status)

### File Structure

```
app/
├── security/
│   ├── page.tsx                    # Server Component (Dynamic)
│   ├── loading.tsx                 # Loading skeleton
│   └── components/
│       ├── SecurityScoreMeter.tsx  # Client Component (animated)
│       ├── VulnerabilityCard.tsx   # Client Component
│       └── ScannerStatus.tsx       # Server Component
```

### Data Fetching Strategy

**Method**: Server Component + Aggregation queries
**Caching**: `export const dynamic = 'force-dynamic'`

```typescript
// app/security/page.tsx
export const dynamic = 'force-dynamic'; // Always fresh

interface SearchParams {
  severity?: string;    // "ERROR,WARNING"
  status?: string;      // "open,fixed"
  scanner?: string;     // "semgrep,eslint,lighthouse"
}

async function getSecurityDashboard(params: SearchParams) {
  // Build where clause for vulnerabilities
  const where: any = {};

  if (params.severity) {
    where.severity = { in: params.severity.split(',') };
  }

  if (params.status) {
    where.status = { in: params.status.split(',') };
  }

  if (params.scanner) {
    where.scanner = { in: params.scanner.split(',') };
  }

  // Parallel queries
  const [
    vulnerabilities,
    totalVulnerabilities,
    severityBreakdown,
    scannerStatus,
    recentScans,
  ] = await Promise.all([
    // Vulnerabilities list (paginated)
    prisma.securityFinding.findMany({
      where,
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: [
        { severity: 'asc' }, // ERROR first
        { createdAt: 'desc' },
      ],
      take: 50,
    }),

    // Total count
    prisma.securityFinding.count({ where }),

    // Severity breakdown (for score calculation)
    prisma.securityFinding.groupBy({
      by: ['severity'],
      _count: true,
    }),

    // Scanner status (last run time)
    prisma.securityScan.findMany({
      orderBy: { scannedAt: 'desc' },
      take: 1,
      distinct: ['scanType'],
      select: {
        scanType: true,
        scannedAt: true,
        status: true,
        findingsCount: true,
      },
    }),

    // Recent scans (timeline)
    prisma.securityScan.findMany({
      orderBy: { scannedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        scanType: true,
        scannedAt: true,
        status: true,
        findingsCount: true,
      },
    }),
  ]);

  // Calculate security score (0-100)
  const score = calculateSecurityScore(severityBreakdown);

  return {
    vulnerabilities,
    totalVulnerabilities,
    score,
    severityBreakdown: Object.fromEntries(
      severityBreakdown.map(s => [s.severity, s._count])
    ),
    scannerStatus,
    recentScans,
  };
}

function calculateSecurityScore(severityBreakdown: any[]) {
  let totalWeight = 0;
  let maxWeight = 0;

  severityBreakdown.forEach(({ severity, _count }) => {
    const weight = { ERROR: 10, WARNING: 5, INFO: 1 }[severity] || 1;
    totalWeight += _count * weight;
    maxWeight += _count * 10; // Assume all are ERROR for max
  });

  // Score: 100 - (weighted issues / max possible * 100)
  const score = Math.max(0, 100 - (totalWeight / (maxWeight || 1)) * 100);
  return Math.round(score);
}

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await getSecurityDashboard(params);

  return (
    <>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header with Score */}
          <header className="neu-raised rounded-3xl px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Security Dashboard</h2>
                <p className="text-sm text-slate">
                  {data.totalVulnerabilities} vulnerabilities across {data.scannerStatus.length} scanners
                </p>
              </div>

              {/* Security Score Meter (Client Component - animated) */}
              <SecurityScoreMeter score={data.score} />
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon="fa-exclamation-triangle"
              label="Critical"
              value={data.severityBreakdown.ERROR || 0}
              color="red"
            />
            <StatCard
              icon="fa-exclamation-circle"
              label="Warnings"
              value={data.severityBreakdown.WARNING || 0}
              color="yellow"
            />
            <StatCard
              icon="fa-info-circle"
              label="Info"
              value={data.severityBreakdown.INFO || 0}
              color="blue"
            />
            <StatCard
              icon="fa-shield-alt"
              label="Score"
              value={`${data.score}/100`}
              color={data.score >= 80 ? 'green' : data.score >= 60 ? 'yellow' : 'red'}
            />
          </div>

          {/* Main Content */}
          <main className="flex flex-1 gap-4 overflow-hidden">
            {/* Filters Sidebar */}
            <VulnerabilityFilter
              severityCounts={data.severityBreakdown}
              scannerStatus={data.scannerStatus}
              currentFilters={params}
            />

            {/* Vulnerabilities List */}
            <div className="flex-1 overflow-auto space-y-3">
              {data.vulnerabilities.length === 0 ? (
                <div className="neu-raised rounded-3xl p-12 text-center">
                  <i className="fas fa-shield-check text-6xl text-green-500 mb-4"></i>
                  <p className="text-lg font-semibold text-white">
                    No vulnerabilities found!
                  </p>
                  <p className="text-sm text-slate">
                    Your project is secure or filters are too strict
                  </p>
                </div>
              ) : (
                data.vulnerabilities.map((vuln) => (
                  <VulnerabilityCard
                    key={vuln.id}
                    vulnerability={{
                      id: vuln.id.toString(),
                      ruleId: vuln.ruleId,
                      severity: vuln.severity as 'ERROR' | 'WARNING' | 'INFO',
                      message: vuln.message,
                      filePath: vuln.filePath,
                      lineNumber: vuln.lineNumber,
                      scanner: vuln.scanner,
                      linkedIssue: vuln.issue,
                      createdAt: vuln.createdAt.toISOString(),
                    }}
                  />
                ))
              )}
            </div>

            {/* Recent Scans Timeline */}
            <aside className="neu-raised w-80 rounded-3xl p-6 overflow-auto">
              <h3 className="mb-4 text-lg font-bold text-white">Recent Scans</h3>
              <div className="space-y-3">
                {data.recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="rounded-2xl bg-glass-darker p-4 text-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">
                        {scan.scanType}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        scan.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {scan.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate">
                      {format(new Date(scan.scannedAt), 'MMM d, h:mm a')}
                    </p>
                    <p className="text-xs text-slate mt-1">
                      {scan.findingsCount} findings
                    </p>
                  </div>
                ))}
              </div>

              <button className="coral-gradient mt-4 w-full rounded-2xl py-3 font-semibold text-white">
                <i className="fas fa-play mr-2"></i>
                Run All Scans
              </button>
            </aside>
          </main>
        </div>
      </div>
    </>
  );
}
```

### Client Component: SecurityScoreMeter (Animated)

```typescript
// app/security/components/SecurityScoreMeter.tsx
"use client";
import { useEffect, useState } from 'react';

export function SecurityScoreMeter({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Color based on score
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';

  // SVG circle progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="120" height="120" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="45"
          stroke="#2A2A2A"
          strokeWidth="8"
          fill="none"
        />

        {/* Progress circle (animated) */}
        <circle
          cx="60"
          cy="60"
          r="45"
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-white">{displayScore}</span>
        <span className="text-xs text-slate">Security Score</span>
      </div>
    </div>
  );
}
```

### Performance Considerations

**Aggregation Queries**:

- ✅ Use Prisma groupBy for counts (efficient)
- ✅ Parallel fetching with Promise.all()
- ⚠️ Watch for large vulnerability lists (paginate if > 100)

**Real-Time Updates**:

- Consider adding polling or WebSocket for live scanner status
- Or use Server Actions to trigger scans and revalidate

---

## Page 4: Agent Personas (`app/agents/page.tsx`)

### Architecture Decision

**Rendering Strategy**: ✅ **Dynamic Server Component** + **Server Actions**

**Reason**:

- Agent activation state changes frequently
- Server Actions provide best pattern for mutations
- Optimistic UI for instant feedback

**Component Strategy**:

- **Server Component**: Page layout, agent list fetch
- **Client Components**: AgentCard (toggle button, optimistic UI)
- **Server Actions**: Activate/deactivate agent

### File Structure

```
app/
├── agents/
│   ├── page.tsx                    # Server Component
│   └── components/
│       ├── AgentCard.tsx           # Client Component
│       └── AgentToggle.tsx         # Client Component (optimistic)
├── actions/
│   └── agents.ts                   # Server Actions
```

### Data Fetching Strategy

**Method**: Server Component + Server Actions
**Caching**: `export const dynamic = 'force-dynamic'`

```typescript
// app/agents/page.tsx
export const dynamic = 'force-dynamic';

async function getAgents() {
  const agents = await prisma.agentPersona.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      capabilities: true,
      isActive: true,
      avatar: true,
      category: true,
    },
  });

  // Group by category
  const grouped = agents.reduce((acc, agent) => {
    const category = agent.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(agent);
    return acc;
  }, {} as Record<string, typeof agents>);

  return {
    agents,
    grouped,
    activeCount: agents.filter(a => a.isActive).length,
  };
}

export default async function AgentsPage() {
  const data = await getAgents();

  return (
    <>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised rounded-3xl px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Agent Personas</h2>
                <p className="text-sm text-slate">
                  {data.activeCount} of {data.agents.length} agents active
                </p>
              </div>

              <button className="coral-gradient rounded-2xl px-6 py-3 font-semibold text-white">
                <i className="fas fa-plus mr-2"></i>
                Create Agent
              </button>
            </div>
          </header>

          {/* Agents Grid (grouped by category) */}
          <main className="flex-1 overflow-auto space-y-6 px-2">
            {Object.entries(data.grouped).map(([category, agents]) => (
              <section key={category}>
                <h3 className="mb-3 text-xl font-bold text-white flex items-center gap-2">
                  <i className="fas fa-folder text-coral"></i>
                  {category}
                  <span className="text-sm font-normal text-slate">
                    ({agents.length})
                  </span>
                </h3>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={{
                        id: agent.id.toString(),
                        name: agent.name,
                        description: agent.description,
                        capabilities: agent.capabilities,
                        isActive: agent.isActive,
                        avatar: agent.avatar,
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      </div>
    </>
  );
}
```

### Server Actions for Mutations

```typescript
// app/actions/agents.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleAgentStatus(agentId: string, isActive: boolean) {
  try {
    const agent = await prisma.agentPersona.update({
      where: { id: parseInt(agentId, 10) },
      data: { isActive },
      select: { id: true, name: true, isActive: true },
    });

    // Revalidate agents page to show updated status
    revalidatePath('/agents');

    return { success: true, agent };
  } catch (error) {
    console.error('Failed to toggle agent:', error);
    return { success: false, error: 'Failed to update agent status' };
  }
}
```

### Client Component: AgentCard (Optimistic UI)

```typescript
// app/agents/components/AgentCard.tsx
"use client";
import { useState, useTransition, useOptimistic } from 'react';
import { toggleAgentStatus } from '@/app/actions/agents';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  isActive: boolean;
  avatar?: string;
}

export function AgentCard({ agent }: { agent: Agent }) {
  const [isPending, startTransition] = useTransition();

  // Optimistic UI state
  const [optimisticActive, setOptimisticActive] = useOptimistic(
    agent.isActive,
    (_, newState: boolean) => newState
  );

  const handleToggle = () => {
    startTransition(async () => {
      // Update optimistically (instant UI feedback)
      setOptimisticActive(!optimisticActive);

      // Server action (reconcile with server)
      const result = await toggleAgentStatus(agent.id, !optimisticActive);

      if (!result.success) {
        // Show error toast (implement your toast system)
        console.error('Failed to toggle agent');
      }
    });
  };

  return (
    <div className={`neu-raised rounded-3xl p-6 transition-all ${
      optimisticActive ? 'ring-2 ring-coral' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral text-white">
            <i className={agent.avatar || 'fas fa-robot'}></i>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white">{agent.name}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${
              optimisticActive
                ? 'bg-green-500 text-white'
                : 'bg-gray-500 text-white'
            }`}>
              {optimisticActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative h-7 w-14 rounded-full transition-colors ${
            optimisticActive ? 'bg-coral' : 'bg-gray-600'
          } ${isPending ? 'opacity-50' : ''}`}
          aria-label={`Toggle ${agent.name}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              optimisticActive ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate mb-4 line-clamp-2">
        {agent.description}
      </p>

      {/* Capabilities */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">
          Capabilities
        </p>
        <div className="flex flex-wrap gap-2">
          {agent.capabilities.slice(0, 3).map((cap) => (
            <span
              key={cap}
              className="rounded-full bg-glass-darker px-3 py-1 text-xs text-white"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="rounded-full bg-glass-darker px-3 py-1 text-xs text-slate">
              +{agent.capabilities.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* View Details Button */}
      <button className="mt-4 w-full rounded-2xl bg-glass-darker py-2 text-sm text-white hover:bg-glass transition-colors">
        View Details
      </button>
    </div>
  );
}
```

### Performance Considerations

**Optimistic UI Benefits**:

- ✅ Instant feedback (toggle happens immediately)
- ✅ Automatic rollback on error (useOptimistic handles it)
- ✅ Reconciles with server response

**Revalidation Strategy**:

```typescript
// In server action
revalidatePath('/agents'); // Revalidate entire page

// Or use tags for finer control
export const revalidate = 30; // In page.tsx (30 seconds cache)
```

---

## Page 5: Command Palette (Global Component)

### Architecture Decision

**Rendering Strategy**: ✅ **Client Component** (Modal)

**Reason**:

- Pure client-side interactivity (keyboard shortcuts)
- Modal portal rendering
- No server-side data needed at mount (fetches on open)

**Component Strategy**:

- **Client Component**: CommandPalette (full modal with keyboard navigation)
- **API Route**: `/api/search` (unified search across entities)
- **State Management**: useReducer for complex keyboard nav

### File Structure

```
app/
├── layout.tsx                      # Mount CommandPalette provider
├── api/
│   └── search/
│       └── route.ts                # Unified search endpoint
└── components/
    └── CommandPalette/
        ├── index.tsx               # Main component
        ├── CommandPaletteProvider.tsx  # Context + keyboard listener
        └── useCommandPalette.tsx   # Hook for other components
```

### Mounting Strategy

```typescript
// app/layout.tsx
import { CommandPaletteProvider } from '@/components/CommandPalette/CommandPaletteProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CommandPaletteProvider>
          {children}
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
```

### API Route: Unified Search

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Parallel search across all entities
    const [issues, knowledge, wiki, agents] = await Promise.all([
      // Issues
      prisma.issue.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
        },
        take: 5,
      }),

      // Knowledge Articles
      prisma.knowledgeItem.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          category: true,
        },
        take: 5,
      }),

      // Wiki Pages
      prisma.wikiPage.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          path: true,
        },
        take: 5,
      }),

      // Agent Personas
      prisma.agentPersona.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
        take: 5,
      }),
    ]);

    // Format results
    const results = [
      ...issues.map((i) => ({
        id: `issue-${i.id}`,
        type: 'issue',
        title: i.title,
        subtitle: `#${i.id} • ${i.status}`,
        icon: 'fa-bug',
        href: `/issues/${i.id}`,
      })),
      ...knowledge.map((k) => ({
        id: `knowledge-${k.id}`,
        type: 'knowledge',
        title: k.title,
        subtitle: k.category || 'Uncategorized',
        icon: 'fa-book',
        href: `/knowledge/${k.id}`,
      })),
      ...wiki.map((w) => ({
        id: `wiki-${w.id}`,
        type: 'wiki',
        title: w.title,
        subtitle: w.path,
        icon: 'fa-file-alt',
        href: `/wiki/${w.path.slice(1).replace(/\//g, '-')}`,
      })),
      ...agents.map((a) => ({
        id: `agent-${a.id}`,
        type: 'agent',
        title: a.name,
        subtitle: a.isActive ? 'Active' : 'Inactive',
        icon: 'fa-robot',
        href: `/agents`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

### Client Component: CommandPalette

```typescript
// app/components/CommandPalette/index.tsx
"use client";
import { useEffect, useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useDebouncedCallback } from 'use-debounce';

interface Result {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
}

// Reducer for keyboard navigation
type State = {
  isOpen: boolean;
  query: string;
  results: Result[];
  selectedIndex: number;
  isLoading: boolean;
};

type Action =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_RESULTS'; payload: Result[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SELECT_NEXT' }
  | { type: 'SELECT_PREV' }
  | { type: 'RESET_SELECTION' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false, query: '', results: [], selectedIndex: 0 };
    case 'SET_QUERY':
      return { ...state, query: action.payload, selectedIndex: 0 };
    case 'SET_RESULTS':
      return { ...state, results: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SELECT_NEXT':
      return {
        ...state,
        selectedIndex: Math.min(state.selectedIndex + 1, state.results.length - 1),
      };
    case 'SELECT_PREV':
      return {
        ...state,
        selectedIndex: Math.max(state.selectedIndex - 1, 0),
      };
    case 'RESET_SELECTION':
      return { ...state, selectedIndex: 0 };
    default:
      return state;
  }
}

export function CommandPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, dispatch] = useReducer(reducer, {
    isOpen: false,
    query: '',
    results: [],
    selectedIndex: 0,
    isLoading: false,
  });

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'OPEN' });
      }

      if (e.key === 'Escape' && state.isOpen) {
        dispatch({ type: 'CLOSE' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (state.isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isOpen]);

  // Debounced search
  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) {
      dispatch({ type: 'SET_RESULTS', payload: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      dispatch({ type: 'SET_RESULTS', payload: data.results || [] });
    } catch (error) {
      console.error('Search error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, 300);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch({ type: 'SET_QUERY', payload: value });
    debouncedSearch(value);
  };

  // Handle keyboard navigation in results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      dispatch({ type: 'SELECT_NEXT' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      dispatch({ type: 'SELECT_PREV' });
    } else if (e.key === 'Enter' && state.results[state.selectedIndex]) {
      e.preventDefault();
      navigateToResult(state.results[state.selectedIndex]);
    }
  };

  // Navigate to selected result
  const navigateToResult = (result: Result) => {
    dispatch({ type: 'CLOSE' });
    router.push(result.href);
  };

  if (!state.isOpen) return null;

  // Portal to body for z-index control
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => dispatch({ type: 'CLOSE' })}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="neu-raised relative w-full max-w-2xl rounded-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-glass-darker p-4">
          <i className="fas fa-search text-xl text-coral"></i>
          <input
            ref={inputRef}
            type="text"
            value={state.query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search issues, articles, wiki pages, agents..."
            className="flex-1 bg-transparent text-white placeholder-slate focus:outline-none"
          />

          {state.isLoading && (
            <i className="fas fa-spinner fa-spin text-coral"></i>
          )}

          <kbd className="rounded bg-glass-darker px-2 py-1 text-xs text-slate">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {state.results.length > 0 ? (
          <div className="max-h-[400px] space-y-2 overflow-auto">
            {state.results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => navigateToResult(result)}
                className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors ${
                  index === state.selectedIndex
                    ? 'bg-coral text-white'
                    : 'bg-glass-darker text-white hover:bg-glass'
                }`}
              >
                <i className={`fas ${result.icon} text-xl`}></i>
                <div className="flex-1">
                  <p className="font-semibold">{result.title}</p>
                  <p className="text-sm opacity-75">{result.subtitle}</p>
                </div>
                <span className="text-xs opacity-50">{result.type}</span>
              </button>
            ))}
          </div>
        ) : state.query.length >= 2 && !state.isLoading ? (
          <div className="py-12 text-center">
            <i className="fas fa-search-minus text-4xl text-slate mb-3"></i>
            <p className="text-slate">No results found for "{state.query}"</p>
          </div>
        ) : (
          <div className="py-12 text-center">
            <i className="fas fa-keyboard text-4xl text-slate mb-3"></i>
            <p className="text-slate">Start typing to search...</p>
            <div className="mt-6 flex justify-center gap-4 text-xs text-slate">
              <span><kbd className="rounded bg-glass-darker px-2 py-1">↑</kbd> <kbd className="rounded bg-glass-darker px-2 py-1">↓</kbd> Navigate</span>
              <span><kbd className="rounded bg-glass-darker px-2 py-1">Enter</kbd> Select</span>
              <span><kbd className="rounded bg-glass-darker px-2 py-1">ESC</kbd> Close</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
```

### Performance Considerations

**Debouncing**:

- ✅ 300ms debounce prevents excessive API calls
- ✅ useTransition shows loading state without blocking UI

**Keyboard Navigation**:

- ✅ useReducer manages complex state (better than multiple useState)
- ✅ ArrowUp/Down + Enter navigation
- ✅ Global Cmd+K shortcut

**Bundle Size**:

- CommandPalette: ~5KB (reducer + keyboard logic)
- Portal: React built-in (0KB)

---

## Cross-Page Patterns Summary

### 1. Server vs Client Component Decision Tree

```
┌─────────────────────────────────────────────────┐
│ Does it need user interaction (onClick, input)? │
└──────────────┬──────────────────────────────────┘
               │
       ┌───────┴────────┐
       │ YES            │ NO
       ▼                ▼
  Client Component  Server Component
  ("use client")    (default)
       │                │
       ▼                ▼
  - SearchBar      - Page layout
  - Filters        - Data fetching
  - Toggles        - Prisma queries
  - Modals         - Static content
```

### 2. Caching Strategy Matrix

| Page            | Strategy      | Revalidate | Reason                         |
| --------------- | ------------- | ---------- | ------------------------------ |
| Knowledge       | force-dynamic | N/A        | Search changes frequently      |
| Wiki            | ISR           | 3600s      | Docs change infrequently       |
| Security        | force-dynamic | N/A        | Real-time vulnerability data   |
| Agents          | force-dynamic | N/A        | Activation state changes often |
| Command Palette | Client-side   | N/A        | Modal, no server render        |

### 3. Data Fetching Patterns

**Parallel Fetching (all pages)**:

```typescript
const [data, counts, metadata] = await Promise.all([getData(), getCounts(), getMetadata()]);
```

**Selective Includes (avoid N+1)**:

```typescript
prisma.model.findMany({
  select: {
    id: true,
    title: true,
    relation: { select: { id: true, name: true } },
  },
});
```

**URL State for Filters**:

```typescript
// Read
const params = await searchParams;
const status = params.status?.split(',') || [];

// Write (Client Component)
const params = new URLSearchParams(searchParams);
params.set('status', 'open,closed');
router.push(`/page?${params.toString()}`);
```

### 4. Route Organization

```
app/
├── knowledge/
│   ├── page.tsx              # List (Dynamic)
│   ├── [slug]/
│   │   └── page.tsx          # Detail (ISR if needed)
│   └── components/           # Client Components
├── wiki/
│   ├── page.tsx              # Redirect to /wiki/home
│   └── [slug]/
│       └── page.tsx          # ISR with generateStaticParams
├── security/
│   └── page.tsx              # Dashboard (Dynamic)
├── agents/
│   └── page.tsx              # List (Dynamic)
└── api/
    ├── search/
    │   └── route.ts          # Unified search
    ├── knowledge/
    │   └── route.ts          # If needed
    └── agents/
        └── [id]/
            └── route.ts      # If using API routes instead of Server Actions
```

### 5. Loading States

**All pages should have**:

```typescript
// app/[page]/loading.tsx
export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <i className="fas fa-spinner fa-spin text-4xl text-coral"></i>
    </div>
  );
}
```

**With Suspense boundaries** (optional for streaming):

```typescript
// In page.tsx
import { Suspense } from 'react';

export default async function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<Skeleton />}>
        <DataComponent />
      </Suspense>
    </div>
  );
}
```

### 6. Performance Targets

| Metric                  | Target  | How to Measure              |
| ----------------------- | ------- | --------------------------- |
| First Load JS           | < 150KB | `pnpm build` output         |
| Server Response Time    | < 200ms | Chrome DevTools Network tab |
| Time to Interactive     | < 3s    | Lighthouse                  |
| Cumulative Layout Shift | < 0.1   | Lighthouse                  |

---

## API Routes vs Server Actions Decision Guide

### Use Server Actions When:

- ✅ Form submissions
- ✅ Simple mutations (toggle agent, update status)
- ✅ Need optimistic UI
- ✅ Single model operations

**Example**: Agent activation, issue status change

### Use API Routes When:

- ✅ Complex queries (full-text search)
- ✅ External API calls
- ✅ Need to be called from Client Components via fetch()
- ✅ Public endpoints (no auth bypass)

**Example**: Unified search endpoint, external integrations

---

## Testing Strategy

### Server Components

```typescript
// Test data fetching logic separately
describe('getKnowledgeArticles', () => {
  it('filters by category', async () => {
    const result = await getKnowledgeArticles({ category: 'API' });
    expect(result.articles.every((a) => a.category === 'API')).toBe(true);
  });
});
```

### Client Components

```typescript
// Use React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar', () => {
  it('debounces input and calls router.push', async () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search...');

    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for debounce
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/knowledge?search=test');
    });
  });
});
```

### E2E with Playwright

```typescript
// tests/e2e/knowledge.spec.ts
import { test, expect } from '@playwright/test';

test('search knowledge base', async ({ page }) => {
  await page.goto('/knowledge');

  // Type in search
  await page.fill('input[placeholder*="Search"]', 'API');

  // Wait for results
  await page.waitForSelector('text=API Documentation');

  // Verify results
  const articles = await page.locator('.article-card').count();
  expect(articles).toBeGreaterThan(0);
});
```

---

## Next Steps for Parent Agent

Based on this plan, the parent agent should implement in this order:

### Phase 1: Foundation (Day 5 Morning)

1. **Knowledge Base Page**
   - Implement Server Component at `app/knowledge/page.tsx`
   - Create FilterSidebar, SearchBar, ArticleCard Client Components
   - Add Prisma queries with parallel fetching
   - Test filtering and search

### Phase 2: Documentation (Day 5 Afternoon)

2. **Wiki Page**
   - Implement ISR at `app/wiki/[slug]/page.tsx`
   - Add generateStaticParams for all wiki slugs
   - Create TableOfContents with IntersectionObserver
   - Configure markdown rendering (ReactMarkdown or next-mdx-remote)

### Phase 3: Real-Time Dashboard (Day 6 Morning)

3. **Security Page**
   - Implement Dynamic Server Component at `app/security/page.tsx`
   - Create SecurityScoreMeter with animated SVG
   - Add aggregation queries for vulnerability counts
   - Implement filter sidebar

### Phase 4: Interactive Mutations (Day 6 Afternoon)

4. **Agent Personas Page**
   - Implement Server Component + Server Actions pattern
   - Create AgentCard with optimistic UI (useOptimistic)
   - Add toggleAgentStatus Server Action with revalidatePath()

### Phase 5: Global Feature (Day 6 Evening)

5. **Command Palette**
   - Create CommandPaletteProvider in app/layout.tsx
   - Implement keyboard shortcut listener (Cmd+K)
   - Add unified search API route at `/api/search`
   - Create CommandPalette modal with useReducer

### Testing (Throughout)

- Add loading.tsx for each page
- Write Playwright E2E tests for key workflows
- Verify performance targets (bundle size, response time)

---

## Key Recommendations Summary

1. **Server Components First**: Default to Server Components, use Client only when needed (✅ all pages follow this)

2. **URL State for Filters**: All filterable lists use searchParams (shareable, bookmarkable)

3. **ISR for Documentation**: Wiki pages use Incremental Static Regeneration (best performance)

4. **Dynamic for Real-Time**: Security and Knowledge use force-dynamic (always fresh)

5. **Server Actions for Mutations**: Agent toggles, status changes use Server Actions (simpler than API routes)

6. **Route Handlers for Search**: Complex queries and full-text search use API routes (accessible from Client Components)

7. **Parallel Fetching**: Use Promise.all() for independent queries (⚡ faster)

8. **Optimistic UI**: Use useOptimistic for instant feedback on mutations (better UX)

9. **IntersectionObserver**: Use for scroll spy (more performant than scroll listener)

10. **useReducer**: Use for complex keyboard navigation (cleaner than multiple useState)

---

**Plan Complete!** 🎉

Parent agent: Read this file and follow the implementation order in "Next Steps" section. All architectural decisions are made and code examples are provided.
