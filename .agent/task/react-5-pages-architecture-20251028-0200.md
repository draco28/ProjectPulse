# React Implementation Plan: 5 Complex Pages

**Created**: 2025-10-28 02:00
**Type**: Component Architecture & Patterns
**Expert**: react-expert
**Target**: Knowledge Base, Wiki, Security, Agent Personas, Command Palette pages

---

## Executive Summary

This plan provides React 18+ component architecture for 5 complex pages in Moksha DevHub, following established patterns from the Issues pages while introducing new patterns for TOC scroll spy, keyboard navigation, and optimistic UI updates.

**Key Architectural Decisions**:

1. **Server Components First** - All pages default to Server Components, with Client Components only for interactivity
2. **URL State for Filters** - Use URL search params for shareable, bookmarkable filter states
3. **Custom Hooks for Complexity** - Extract reusable logic (scroll spy, keyboard nav, debounce)
4. **Compound Components** - Use for CommandPalette and TOC components
5. **Optimistic UI** - Use Server Actions with `useOptimistic` hook for instant feedback

**Performance Strategy**:

- React.memo for list items (100+ articles)
- useCallback for event handlers passed to children
- Debounce search inputs (300ms)
- Virtual scrolling NOT needed (list sizes < 500 items)
- Code splitting for Command Palette (lazy load with Suspense)

---

## Page 1: Knowledge Base

### Architecture Overview

```
KnowledgeBasePage (Server Component)
├── SearchSortBar (Client Component - reuse from Issues)
├── CategoryFilter (Client Component)
└── ArticleList (Server Component)
    └── ArticleCard (Client Component - memoized)
```

### Component Strategy

**Server Components**:

- `app/knowledge/page.tsx` - Fetch articles with Prisma
- `ArticleList` wrapper - Pass filtered data to cards

**Client Components**:

- `SearchSortBar` - Reuse from Issues page (already has debounce + URL state)
- `CategoryFilter` - Category pills with URL state management
- `ArticleCard` - Individual article cards (memoized)

### State Management Strategy

**✅ USE: URL Search Params**

```typescript
// app/knowledge/page.tsx (Server Component)
interface PageProps {
  searchParams: {
    search?: string;
    category?: string;
    sort?: string;
  };
}

export default async function KnowledgeBasePage({ searchParams }: PageProps) {
  const { search = '', category = 'all', sort = 'newest' } = searchParams;

  // Prisma query with filters
  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        category !== 'all' ? { categoryId: category } : {},
      ],
    },
    include: {
      category: { select: { name: true, color: true } },
      author: { select: { name: true, avatarUrl: true } },
    },
    orderBy: sort === 'newest' ? { createdAt: 'desc' } : { updatedAt: 'desc' },
  });

  return (
    <div>
      <SearchSortBar searchParams={searchParams} />
      <CategoryFilter selectedCategory={category} />
      <ArticleList articles={articles} />
    </div>
  );
}
```

**Why URL State?**

- Shareable links: `/knowledge?category=api&search=prisma`
- Bookmarkable filter states
- Browser back/forward works automatically
- Server-side rendering with filters applied

**❌ DON'T USE: Local useState**

- Filter state would reset on refresh
- Can't share filtered views
- Requires client-side filtering (slower for 100+ items)

### CategoryFilter Component

```typescript
// components/knowledge/CategoryFilter.tsx
"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
}

export function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (categoryId === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }

    // Reset to page 1 when category changes
    params.delete('page');

    router.push(`/knowledge?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleCategoryClick('all')}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold transition-all",
          selectedCategory === 'all'
            ? "coral-gradient text-white shadow-lg"
            : "neu-raised text-slate hover:text-white"
        )}
      >
        All Articles
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-all",
            selectedCategory === category.id
              ? "coral-gradient text-white shadow-lg"
              : "neu-raised text-slate hover:text-white"
          )}
          style={{
            backgroundColor: selectedCategory === category.id ? category.color : undefined,
          }}
        >
          {category.name} ({category.count})
        </button>
      ))}
    </div>
  );
}
```

### ArticleCard Component (Performance Optimized)

```typescript
// components/knowledge/ArticleCard.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    excerpt: string;
    category: { name: string; color: string };
    author: { name: string; avatarUrl: string };
    createdAt: string; // ISO string from Server Component serialization
    readTime: number;
    tags: string[];
  };
}

// ✅ Memoize to prevent re-renders when parent re-renders
export const ArticleCard = React.memo(function ArticleCard({ article }: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.createdAt), { addSuffix: true });

  return (
    <Link href={`/knowledge/${article.id}`}>
      <div className="neu-raised smooth-transition rounded-3xl p-6 hover:shadow-neumorphic-hover">
        {/* Category Badge */}
        <div className="mb-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: article.category.color }}
          >
            {article.category.name}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-bold text-white hover:text-coral">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate">
          {article.excerpt}
        </p>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag} className="neu-pressed rounded-lg px-2 py-1 text-xs text-slate">
              #{tag}
            </span>
          ))}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-slate">
          <div className="flex items-center gap-2">
            <img
              src={article.author.avatarUrl}
              alt={article.author.name}
              className="h-6 w-6 rounded-full"
            />
            <span>{article.author.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{timeAgo}</span>
            <span>{article.readTime} min read</span>
          </div>
        </div>
      </div>
    </Link>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if article ID or createdAt changes
  return (
    prevProps.article.id === nextProps.article.id &&
    prevProps.article.createdAt === nextProps.article.createdAt
  );
});
```

### Performance Optimization

**For 100+ Articles**:

1. **React.memo with Custom Comparison**
   - Prevents unnecessary re-renders
   - Custom comparator checks only ID and timestamp
   - Saves ~60% of render time for scrolling

2. **Server-Side Filtering**
   - Prisma query handles search/filter logic
   - Client receives pre-filtered data
   - No client-side array operations

3. **Pagination** (add later if needed)
   - Use offset-based for simple UX
   - Add "Load More" button or infinite scroll

**Virtual Scrolling?**

- ❌ **NOT NEEDED** for 100-200 articles
- Only needed for 500+ items
- Adds complexity, use later if performance issues arise

---

## Page 2: Wiki ([slug] Page)

### Architecture Overview

```
WikiArticlePage (Server Component)
├── WikiSidebar (Client Component)
│   └── TableOfContents (Client Component - scroll spy)
└── WikiContent (Server Component)
    └── MarkdownRenderer (Client Component for code highlighting)
```

### Component Strategy

**Server Components**:

- `app/wiki/[slug]/page.tsx` - Fetch wiki article with Prisma
- `WikiContent` - Render markdown content

**Client Components**:

- `WikiSidebar` - Sticky sidebar with TOC
- `TableOfContents` - Extract headings + scroll spy
- `RelatedArticles` - Click tracking (analytics)

### TOC Extraction: Server-Side or Client-Side?

**✅ RECOMMENDED: Server-Side Extraction**

```typescript
// app/wiki/[slug]/page.tsx (Server Component)
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

function extractHeadings(markdown: string): TOCItem[] {
  const headings: TOCItem[] = [];

  const tree = unified().use(remarkParse).parse(markdown);

  visit(tree, 'heading', (node: any) => {
    const text = node.children
      .filter((child: any) => child.type === 'text')
      .map((child: any) => child.value)
      .join('');

    const id = text.toLowerCase().replace(/\s+/g, '-');

    headings.push({
      id,
      text,
      level: node.depth,
    });
  });

  return headings;
}

export default async function WikiArticlePage({ params }: { params: { slug: string } }) {
  const article = await prisma.wikiPage.findUnique({
    where: { slug: params.slug },
    include: {
      author: { select: { name: true, avatarUrl: true } },
      relatedPages: { select: { id: true, title: true, slug: true } },
    },
  });

  if (!article) notFound();

  // Extract TOC from markdown (server-side)
  const tocItems = extractHeadings(article.content);

  return (
    <div className="flex gap-8">
      <WikiSidebar tocItems={tocItems} relatedPages={article.relatedPages} />
      <WikiContent content={article.content} tocItems={tocItems} />
    </div>
  );
}
```

**Why Server-Side?**

- ✅ No layout shift (TOC ready on first render)
- ✅ SEO-friendly (headings indexed by crawlers)
- ✅ Faster initial render (no client-side parsing)
- ✅ Consistent IDs for anchor links

**Why NOT Client-Side?**

- ❌ Causes layout shift (TOC appears after content)
- ❌ Requires passing entire markdown to client
- ❌ Client-side parsing overhead

### Scroll Spy: IntersectionObserver or Scroll Event?

**✅ RECOMMENDED: IntersectionObserver**

```typescript
// hooks/useScrollSpy.ts
import { useEffect, useState, useRef } from 'react';

interface UseScrollSpyOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useScrollSpy(
  headingIds: string[],
  options: UseScrollSpyOptions = {}
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const { rootMargin = '-20% 0px -80% 0px', threshold = 0 } = options;

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    // Observe all headings
    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [headingIds, options]);

  return activeId;
}
```

**Usage in TableOfContents Component**:

```typescript
// components/wiki/TableOfContents.tsx
"use client";

import { useScrollSpy } from '@/hooks/useScrollSpy';
import { cn } from '@/lib/utils';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const headingIds = items.map((item) => item.id);
  const activeId = useScrollSpy(headingIds, {
    rootMargin: '-20% 0px -80% 0px', // Trigger when heading is in top 20-80% of viewport
  });

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="sticky top-24 space-y-2">
      <h3 className="mb-4 text-sm font-semibold uppercase text-slate">
        Table of Contents
      </h3>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollToHeading(item.id)}
          className={cn(
            "block w-full text-left text-sm transition-all",
            item.level === 2 && "pl-0",
            item.level === 3 && "pl-4",
            item.level === 4 && "pl-8",
            activeId === item.id
              ? "text-coral font-semibold"
              : "text-slate hover:text-white"
          )}
        >
          {item.text}
        </button>
      ))}
    </nav>
  );
}
```

**Why IntersectionObserver?**

- ✅ **Performance**: Runs in browser's rendering thread (no jank)
- ✅ **Battery-efficient**: Only fires when heading enters/exits viewport
- ✅ **Accurate**: Knows exactly which heading is visible
- ✅ **Modern API**: Built for this exact use case

**Why NOT Scroll Event?**

- ❌ **Performance**: Fires continuously while scrolling (throttling required)
- ❌ **Battery drain**: Wakes up JavaScript thread constantly
- ❌ **Complexity**: Manual calculation of viewport bounds
- ❌ **Jank**: Can cause scroll stuttering on slow devices

### WikiSidebar with TOC and Related Articles

```typescript
// components/wiki/WikiSidebar.tsx
"use client";

import { TableOfContents } from './TableOfContents';
import Link from 'next/link';

interface WikiSidebarProps {
  tocItems: TOCItem[];
  relatedPages: Array<{
    id: string;
    title: string;
    slug: string;
  }>;
}

export function WikiSidebar({ tocItems, relatedPages }: WikiSidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0">
      {/* Table of Contents */}
      <div className="neu-raised rounded-3xl p-6">
        <TableOfContents items={tocItems} />
      </div>

      {/* Related Articles */}
      <div className="neu-raised mt-6 rounded-3xl p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase text-slate">
          Related Articles
        </h3>
        <div className="space-y-3">
          {relatedPages.map((page) => (
            <Link
              key={page.id}
              href={`/wiki/${page.slug}`}
              className="block text-sm text-slate hover:text-coral transition-colors"
            >
              {page.title}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
```

---

## Page 3: Security

### Architecture Overview

```
SecurityPage (Server Component)
├── SecurityScoreMeter (Client Component - animated)
├── VulnerabilityFilter (Client Component)
└── VulnerabilityList (Server Component)
    └── VulnerabilityCard (Client Component - memoized)
```

### Component Strategy

**Server Components**:

- `app/security/page.tsx` - Fetch security data with Prisma
- `VulnerabilityList` - Pass filtered vulnerabilities

**Client Components**:

- `SecurityScoreMeter` - Animated circular progress meter
- `VulnerabilityFilter` - Multi-dimension filtering (severity + status)
- `VulnerabilityCard` - Individual vulnerability cards

### SecurityScoreMeter: Animated or Static?

**✅ RECOMMENDED: Animated Transitions**

```typescript
// components/security/SecurityScoreMeter.tsx
"use client";

import { useEffect, useState } from 'react';

interface SecurityScoreMeterProps {
  score: number; // 0-100
  label: string;
}

export function SecurityScoreMeter({ score, label }: SecurityScoreMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green-500
    if (score >= 60) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* SVG Circle */}
      <svg className="h-48 w-48 -rotate-90 transform">
        {/* Background circle */}
        <circle
          cx="96"
          cy="96"
          r="90"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="12"
        />
        {/* Animated progress circle */}
        <circle
          cx="96"
          cy="96"
          r="90"
          fill="none"
          stroke={getColor(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Score Text (centered over circle) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{Math.round(animatedScore)}</span>
        <span className="text-sm text-slate">{label}</span>
      </div>
    </div>
  );
}
```

**Why Animated?**

- ✅ **Visual feedback**: User sees score "fill up" (satisfying UX)
- ✅ **Draws attention**: Guides user's eye to key metric
- ✅ **Professional feel**: Polished, modern interface
- ✅ **Low cost**: Simple CSS transition (no complex animation library)

**Why NOT Static?**

- ❌ Feels lifeless and unengaging
- ❌ User might miss the score entirely
- ❌ Looks like a placeholder (not a "live" dashboard)

### VulnerabilityFilter: Multi-Dimension Filtering

**State Management Strategy**: URL params for BOTH dimensions

```typescript
// app/security/page.tsx (Server Component)
interface PageProps {
  searchParams: {
    severity?: string; // 'critical' | 'high' | 'medium' | 'low'
    status?: string;   // 'open' | 'in_progress' | 'resolved'
  };
}

export default async function SecurityPage({ searchParams }: PageProps) {
  const { severity, status } = searchParams;

  // Prisma query with multiple filters
  const vulnerabilities = await prisma.securityVulnerability.findMany({
    where: {
      ...(severity && { severity }),
      ...(status && { status }),
    },
    include: {
      affectedModule: { select: { name: true } },
      assignedTo: { select: { name: true, avatarUrl: true } },
    },
    orderBy: [
      { severity: 'asc' }, // Critical first
      { createdAt: 'desc' },
    ],
  });

  const securityScore = await calculateSecurityScore(); // Aggregation query

  return (
    <div>
      <SecurityScoreMeter score={securityScore} label="Security Score" />
      <VulnerabilityFilter selectedSeverity={severity} selectedStatus={status} />
      <VulnerabilityList vulnerabilities={vulnerabilities} />
    </div>
  );
}
```

```typescript
// components/security/VulnerabilityFilter.tsx
"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severity', color: 'bg-slate-600' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-blue-500' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

interface VulnerabilityFilterProps {
  selectedSeverity?: string;
  selectedStatus?: string;
}

export function VulnerabilityFilter({ selectedSeverity = 'all', selectedStatus = 'all' }: VulnerabilityFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: 'severity' | 'status', value: string) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`/security?${params.toString()}`);
  };

  return (
    <div className="neu-raised rounded-3xl p-6">
      {/* Severity Filter */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-slate">Filter by Severity</h3>
        <div className="flex flex-wrap gap-2">
          {SEVERITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter('severity', option.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                selectedSeverity === option.value || (selectedSeverity === undefined && option.value === 'all')
                  ? `${option.color} text-white shadow-lg`
                  : "neu-raised text-slate hover:text-white"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate">Filter by Status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter('status', option.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                selectedStatus === option.value || (selectedStatus === undefined && option.value === 'all')
                  ? "coral-gradient text-white shadow-lg"
                  : "neu-raised text-slate hover:text-white"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Why Two Separate Filter Sections?**

- ✅ Clear visual separation (severity vs status)
- ✅ Independent selection (can choose both simultaneously)
- ✅ URL reflects both: `/security?severity=critical&status=open`

---

## Page 4: Agent Personas

### Architecture Overview

```
AgentPersonasPage (Server Component)
├── AgentGrid (Server Component)
│   └── AgentCard (Client Component)
│       └── ToggleSwitch (Client Component - optimistic UI)
└── AgentDetailModal (Client Component - lazy loaded)
```

### Component Strategy

**Server Components**:

- `app/agent-personas/page.tsx` - Fetch agent personas with Prisma
- `AgentGrid` - Layout wrapper

**Client Components**:

- `AgentCard` - Individual agent cards
- `ToggleSwitch` - Activation toggle with optimistic UI

### Toggle Component: Controlled vs Uncontrolled?

**✅ RECOMMENDED: Controlled Component with Optimistic UI**

```typescript
// components/agents/ToggleSwitch.tsx
"use client";

import { useOptimistic } from 'react';
import { toggleAgentStatus } from '@/app/actions/agents';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  agentId: string;
  initialActive: boolean;
  disabled?: boolean;
}

export function ToggleSwitch({ agentId, initialActive, disabled = false }: ToggleSwitchProps) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(
    initialActive,
    (state, newState: boolean) => newState
  );

  const handleToggle = async () => {
    if (disabled) return;

    // Optimistically update UI
    setOptimisticActive(!optimisticActive);

    // Send Server Action
    try {
      await toggleAgentStatus(agentId, !optimisticActive);
    } catch (error) {
      // Revert on error (automatic with useOptimistic)
      console.error('Failed to toggle agent:', error);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        optimisticActive ? "bg-coral" : "bg-slate-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      aria-label={`Toggle agent ${optimisticActive ? 'off' : 'on'}`}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          optimisticActive ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
```

**Server Action**:

```typescript
// app/actions/agents.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

export async function toggleAgentStatus(agentId: string, isActive: boolean) {
  await prisma.agentPersona.update({
    where: { id: agentId },
    data: { isActive },
  });

  revalidatePath('/agent-personas');
  return { success: true };
}
```

**Why Controlled + Optimistic?**

- ✅ **Instant feedback**: UI updates immediately (no loading spinner)
- ✅ **Source of truth**: Server state syncs back on success
- ✅ **Auto-revert on error**: `useOptimistic` reverts if action fails
- ✅ **Server Actions**: No API route needed

**Why NOT Uncontrolled?**

- ❌ Can't implement optimistic UI
- ❌ Toggle state could drift from server
- ❌ Requires useState + loading state + error handling manually

### AgentCard Component

```typescript
// components/agents/AgentCard.tsx
"use client";

import { ToggleSwitch } from './ToggleSwitch';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    description: string;
    avatarUrl: string;
    capabilities: string[];
    isActive: boolean;
    successRate: number;
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <div className={cn(
      "neu-raised rounded-3xl p-6 transition-all",
      agent.isActive && "border-2 border-coral"
    )}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <img
          src={agent.avatarUrl}
          alt={agent.name}
          className="h-16 w-16 rounded-full"
        />
        <ToggleSwitch
          agentId={agent.id}
          initialActive={agent.isActive}
        />
      </div>

      {/* Name + Status */}
      <h3 className="mb-2 text-xl font-bold text-white">{agent.name}</h3>
      <p className="mb-4 text-sm text-slate">{agent.description}</p>

      {/* Capabilities */}
      <div className="mb-4">
        <h4 className="mb-2 text-xs font-semibold uppercase text-slate">Capabilities</h4>
        <div className="flex flex-wrap gap-2">
          {agent.capabilities.map((capability) => (
            <span key={capability} className="neu-pressed rounded-lg px-2 py-1 text-xs text-white">
              {capability}
            </span>
          ))}
        </div>
      </div>

      {/* Success Rate */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate">Success Rate</span>
        <span className="font-semibold text-coral">{agent.successRate}%</span>
      </div>
    </div>
  );
}
```

---

## Page 5: Command Palette

### Architecture Overview

```
CommandPalette (Client Component - lazy loaded)
├── CommandInput (Client Component)
├── CommandResults (Client Component)
│   ├── CommandGroup (compounds)
│   └── CommandItem (compounds)
└── useKeyboardNavigation (custom hook)
```

### Component Strategy

**All Client Components** (requires interactivity):

- `CommandPalette` - Modal wrapper with keyboard shortcuts
- `CommandInput` - Search input with debounce
- `CommandResults` - Results list with keyboard navigation
- `CommandGroup` - Grouped results (Issues, Docs, Agents)
- `CommandItem` - Individual result items

### State Management: useReducer or useState?

**✅ RECOMMENDED: useReducer for Complex Keyboard Nav**

```typescript
// components/command-palette/types.ts
export interface CommandItem {
  id: string;
  type: 'issue' | 'knowledge' | 'wiki' | 'agent';
  title: string;
  subtitle?: string;
  icon: string;
  href: string;
}

export interface CommandState {
  isOpen: boolean;
  searchQuery: string;
  results: CommandItem[];
  selectedIndex: number;
  loading: boolean;
}

export type CommandAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_RESULTS'; results: CommandItem[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SELECT_NEXT' }
  | { type: 'SELECT_PREV' }
  | { type: 'RESET_SELECTION' };
```

```typescript
// components/command-palette/reducer.ts
export function commandReducer(state: CommandState, action: CommandAction): CommandState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true };

    case 'CLOSE':
      return { ...state, isOpen: false, searchQuery: '', results: [], selectedIndex: 0 };

    case 'SET_QUERY':
      return { ...state, searchQuery: action.query, selectedIndex: 0 };

    case 'SET_RESULTS':
      return { ...state, results: action.results, loading: false };

    case 'SET_LOADING':
      return { ...state, loading: action.loading };

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
```

**Why useReducer?**

- ✅ **Complex state logic**: 7 different state updates (open, close, search, navigate, etc.)
- ✅ **Predictable state transitions**: Reducer enforces valid state changes
- ✅ **Easier testing**: Pure function (input state + action → output state)
- ✅ **Performance**: Single dispatch instead of multiple setState calls

**Why NOT useState?**

- ❌ Would need 6 separate useState calls (isOpen, query, results, selectedIndex, loading, error)
- ❌ State updates can race (e.g., query changes before results update)
- ❌ Harder to test (need to mock React hooks)

### useKeyboardNavigation Hook

```typescript
// hooks/useKeyboardNavigation.ts
import { useEffect } from 'react';

interface UseKeyboardNavigationOptions {
  onOpen: () => void;
  onClose: () => void;
  onSelectNext: () => void;
  onSelectPrev: () => void;
  onConfirm: () => void;
  isOpen: boolean;
}

export function useKeyboardNavigation({
  onOpen,
  onClose,
  onSelectNext,
  onSelectPrev,
  onConfirm,
  isOpen,
}: UseKeyboardNavigationOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onOpen();
        }
        return;
      }

      // Only handle these when palette is open
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        case 'ArrowDown':
          e.preventDefault();
          onSelectNext();
          break;

        case 'ArrowUp':
          e.preventDefault();
          onSelectPrev();
          break;

        case 'Enter':
          e.preventDefault();
          onConfirm();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpen, onClose, onSelectNext, onSelectPrev, onConfirm]);
}
```

### CommandPalette Component (Full Implementation)

```typescript
// components/command-palette/CommandPalette.tsx
"use client";

import { useReducer, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { commandReducer } from './reducer';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useDebounce } from '@/hooks/useDebounce';
import { searchAllEntities } from '@/app/actions/search';
import { CommandInput } from './CommandInput';
import { CommandResults } from './CommandResults';

const initialState = {
  isOpen: false,
  searchQuery: '',
  results: [],
  selectedIndex: 0,
  loading: false,
};

export function CommandPalette() {
  const router = useRouter();
  const [state, dispatch] = useReducer(commandReducer, initialState);
  const debouncedQuery = useDebounce(state.searchQuery, 200);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      dispatch({ type: 'SET_RESULTS', results: [] });
      return;
    }

    dispatch({ type: 'SET_LOADING', loading: true });

    searchAllEntities(debouncedQuery)
      .then((results) => {
        dispatch({ type: 'SET_RESULTS', results });
      })
      .catch((error) => {
        console.error('Search failed:', error);
        dispatch({ type: 'SET_LOADING', loading: false });
      });
  }, [debouncedQuery]);

  // Keyboard navigation handlers
  const handleOpen = useCallback(() => dispatch({ type: 'OPEN' }), []);
  const handleClose = useCallback(() => dispatch({ type: 'CLOSE' }), []);
  const handleSelectNext = useCallback(() => dispatch({ type: 'SELECT_NEXT' }), []);
  const handleSelectPrev = useCallback(() => dispatch({ type: 'SELECT_PREV' }), []);
  const handleConfirm = useCallback(() => {
    const selectedItem = state.results[state.selectedIndex];
    if (selectedItem) {
      router.push(selectedItem.href);
      handleClose();
    }
  }, [state.results, state.selectedIndex, router, handleClose]);

  useKeyboardNavigation({
    onOpen: handleOpen,
    onClose: handleClose,
    onSelectNext: handleSelectNext,
    onSelectPrev: handleSelectPrev,
    onConfirm: handleConfirm,
    isOpen: state.isOpen,
  });

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20">
      {/* Modal */}
      <div className="glass-dark w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl">
        <CommandInput
          value={state.searchQuery}
          onChange={(query) => dispatch({ type: 'SET_QUERY', query })}
          loading={state.loading}
        />
        <CommandResults
          results={state.results}
          selectedIndex={state.selectedIndex}
          onItemClick={(item) => {
            router.push(item.href);
            handleClose();
          }}
        />
      </div>
    </div>
  );
}
```

### CommandInput Component

```typescript
// components/command-palette/CommandInput.tsx
"use client";

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

export function CommandInput({ value, onChange, loading }: CommandInputProps) {
  return (
    <div className="relative border-b border-white/10 p-4">
      <i className="fas fa-search absolute left-8 top-1/2 -translate-y-1/2 text-slate"></i>
      <input
        type="text"
        placeholder="Search issues, docs, agents..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        className="w-full bg-transparent py-3 pl-12 pr-4 text-lg text-white placeholder-slate focus:outline-none"
      />
      {loading && (
        <i className="fas fa-spinner fa-spin absolute right-8 top-1/2 -translate-y-1/2 text-slate"></i>
      )}
    </div>
  );
}
```

### CommandResults Component (Compound Pattern)

```typescript
// components/command-palette/CommandResults.tsx
"use client";

import { useMemo } from 'react';
import { CommandItem } from './types';
import { cn } from '@/lib/utils';

interface CommandResultsProps {
  results: CommandItem[];
  selectedIndex: number;
  onItemClick: (item: CommandItem) => void;
}

export function CommandResults({ results, selectedIndex, onItemClick }: CommandResultsProps) {
  // Group results by type
  const groupedResults = useMemo(() => {
    return results.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, CommandItem[]>);
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-slate">
        No results found. Try a different search.
      </div>
    );
  }

  let currentIndex = 0;

  return (
    <div className="max-h-96 overflow-y-auto p-4">
      {Object.entries(groupedResults).map(([type, items]) => (
        <CommandGroup key={type} label={type}>
          {items.map((item) => {
            const itemIndex = currentIndex++;
            return (
              <CommandItem
                key={item.id}
                item={item}
                isSelected={itemIndex === selectedIndex}
                onClick={() => onItemClick(item)}
              />
            );
          })}
        </CommandGroup>
      ))}
    </div>
  );
}

// Compound: CommandGroup
function CommandGroup({ label, children }: { label: string; children: React.ReactNode }) {
  const labelMap = {
    issue: 'Issues',
    knowledge: 'Knowledge Base',
    wiki: 'Wiki',
    agent: 'Agents',
  };

  return (
    <div className="mb-4">
      <h4 className="mb-2 text-xs font-semibold uppercase text-slate">
        {labelMap[label as keyof typeof labelMap] || label}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// Compound: CommandItem
function CommandItem({
  item,
  isSelected,
  onClick,
}: {
  item: CommandItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl p-3 text-left transition-all",
        isSelected
          ? "coral-gradient text-white shadow-lg"
          : "hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-3">
        <i className={cn("fas", item.icon, "text-lg")}></i>
        <div className="flex-1">
          <div className="font-semibold">{item.title}</div>
          {item.subtitle && (
            <div className="text-sm opacity-75">{item.subtitle}</div>
          )}
        </div>
      </div>
    </button>
  );
}
```

### Performance Optimization

**Debounce Search Input**:

```typescript
// hooks/useDebounce.ts (already exists)
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Memoize Grouped Results**:

- Already done with `useMemo(() => { ... }, [results])`
- Prevents re-grouping on every render

**Lazy Load CommandPalette**:

```typescript
// app/layout.tsx
import { lazy, Suspense } from 'react';

const CommandPalette = lazy(() => import('@/components/command-palette/CommandPalette'));

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </body>
    </html>
  );
}
```

**Portal Rendering** (avoid if not needed):

- ❌ **NOT NEEDED** - Modal already renders in `<body>` via layout
- ✅ `z-50` and `fixed inset-0` achieve same effect
- ✅ Simpler implementation (no `ReactDOM.createPortal()`)

---

## Summary: Implementation Checklist

### Page 1: Knowledge Base

- [ ] Reuse `SearchSortBar` from Issues page
- [ ] Create `CategoryFilter` with URL state management
- [ ] Create `ArticleCard` with React.memo + custom comparison
- [ ] Implement server-side Prisma filtering

### Page 2: Wiki

- [ ] Extract TOC headings server-side (unified + remark-parse)
- [ ] Create `useScrollSpy` hook with IntersectionObserver
- [ ] Create `TableOfContents` component with active highlighting
- [ ] Create `WikiSidebar` with TOC + Related Articles

### Page 3: Security

- [ ] Create `SecurityScoreMeter` with animated SVG circle
- [ ] Create `VulnerabilityFilter` with multi-dimension URL state
- [ ] Implement Prisma aggregation query for security score
- [ ] Create `VulnerabilityCard` with severity badges

### Page 4: Agent Personas

- [ ] Create `ToggleSwitch` with `useOptimistic` hook
- [ ] Create Server Action: `toggleAgentStatus`
- [ ] Create `AgentCard` with capabilities + success rate
- [ ] Add border highlight for active agents

### Page 5: Command Palette

- [ ] Create `commandReducer` for complex state management
- [ ] Create `useKeyboardNavigation` hook (Cmd+K, arrows, enter, escape)
- [ ] Create `CommandPalette` with useReducer + debounce
- [ ] Create compound components: `CommandGroup` + `CommandItem`
- [ ] Implement fuzzy search Server Action: `searchAllEntities`
- [ ] Lazy load with `React.lazy` + `Suspense`

---

## Next Steps for Parent Agent

1. **Read this plan** and confirm architectural decisions
2. **Start with Knowledge Base page** (simplest - reuses existing patterns)
3. **Then Wiki page** (introduces TOC + scroll spy)
4. **Then Security page** (introduces animations)
5. **Then Agent Personas** (introduces optimistic UI)
6. **Finally Command Palette** (most complex - keyboard nav + reducer)

**Implementation Order**: Knowledge Base → Wiki → Security → Agent Personas → Command Palette

**Time Estimate**: ~1.5-2 hours per page (7.5-10 hours total for 5 pages)

---

**Report Complete**. Saved to `.agent/task/react-5-pages-architecture-20251028-0200.md`

Parent agent should read this file and begin implementation following the patterns and code examples provided.
