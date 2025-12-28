# Unified Project-Aware Routing & Multi-Tenancy Architecture

**Version:** 1.1  
**Created:** 2025-12-28  
**Updated:** 2025-12-28  
**Status:** Ready for Implementation  
**Priority:** Critical  
**Epic:** EPIC-017: Project Isolation & Routing Unification

> **Note:** This document has been verified against the actual codebase. All file paths, line numbers, and code snippets have been validated.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Analysis](#problem-analysis)
   - [Problem 1: Inconsistent Project-Aware Routing](#problem-1-inconsistent-project-aware-routing)
   - [Problem 2: Multi-Tenancy Data Bleed](#problem-2-multi-tenancy-data-bleed)
3. [Current State Assessment](#current-state-assessment)
4. [Unified Architecture Proposal](#unified-architecture-proposal)
5. [Phased Implementation Plan](#phased-implementation-plan)
6. [Detailed Migration Guide](#detailed-migration-guide)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plan](#rollback-plan)

---

## Executive Summary

ProjectPulse has grown organically, resulting in **7 different patterns** for handling project context and **4 critical API routes** that expose data across project boundaries. This document outlines a unified architecture to:

1. **Eliminate data bleed** between projects (security critical)
2. **Standardize project-aware routing** across all UI components
3. **Provide a single source of truth** for project context
4. **Enable incremental migration** without breaking existing functionality

### Impact Assessment

| Issue Type | Count | Severity | User Impact |
|------------|-------|----------|-------------|
| API routes without project filtering | 4 | 🔴 Critical | Users can see other projects' data |
| Components losing project context | 15+ | 🟠 High | Navigation breaks, context lost |
| Inconsistent routing patterns | 7 patterns | 🟡 Medium | Developer confusion, bugs |
| Missing auth on project routes | 2 | 🟠 High | Unauthorized access possible |

---

## Problem Analysis

### Problem 1: Inconsistent Project-Aware Routing

#### Description

The application uses **7 different patterns** for handling project context in URLs and navigation. This inconsistency leads to bugs where:
- Navigation buttons/links don't preserve `?project=X` query parameter
- Users get redirected to project selector unexpectedly
- Filters and search lose project context when applied
- Bookmarks break when project context is missing

#### Identified Patterns (Current State)

| # | Pattern | Location | Pros | Cons |
|---|---------|----------|------|------|
| 1 | `getActiveProjectForUser()` | Server pages | Centralized, validates ownership | Only server-side |
| 2 | `getAuthorizedProjectId()` | API routes | Auth + project in one call | API-only |
| 3 | `useSidebarCounts()` hook | Sidebar | Reads from URL | Re-reads on mount only |
| 4 | `buildHref()` helper | Sidebar, Commands | Appends project param | Duplicated in 3 places |
| 5 | `useSearchParams()` direct | Many components | Simple | Easy to forget project |
| 6 | `window.location.search` | Hooks | Avoids re-render | SSR issues |
| 7 | Hardcoded paths | Filter components | Quick | Always loses project |

#### Affected Files - Navigation Context Loss

```
apps/web/components/knowledge/TagFilter.tsx
  Line 29: router.push(`/knowledge?${params.toString()}`);
  Line 35: router.push(`/knowledge?${params.toString()}`);
  ❌ ISSUE: Loses ?project=X when filtering/clearing tags (uses searchParams but doesn't preserve project)

apps/web/components/wiki/WikiListClient.tsx
  Line 64: router.push('/wiki');
  ❌ ISSUE: Complete loss of project context on clearFilters()

apps/web/components/knowledge/SearchBar.tsx
  Line 36: router.push(`/knowledge?${params.toString()}`);
  Line 49: router.push(`/knowledge?${params.toString()}`);
  ❌ ISSUE: Uses searchParams but doesn't explicitly preserve project param

apps/web/components/wiki/WikiSearchBar.tsx
  Line 56: router.push(`/wiki?${params.toString()}`);
  Line 85: router.push(`/wiki?${params.toString()}`);
  ❌ ISSUE: Uses currentSearchParams but doesn't explicitly preserve project param

apps/web/components/wiki/QuickNavigation.tsx
  Line 29: router.push(`/wiki?q=${encodeURIComponent(searchQuery)}`);
  Line 42: href={`/wiki?category=${category.slug}`}
  ❌ ISSUE: Hardcoded paths lose project context on search and category links

apps/web/components/onboarding/SessionCard.tsx
  Line 45-60: Link href constructed without project param
  ❌ ISSUE: Inconsistent project preservation

apps/web/components/tickets/SearchSortBar.tsx
  Line 85-92: Uses pathname but may lose project on sort change
  ⚠️ PARTIAL: Sometimes preserves, sometimes loses

apps/web/components/command-palette/CommandPalette.tsx
  Line 35-42: Reads projectId but passes to commands
  ✅ CORRECT: Properly passes projectId to command actions
```

#### Root Cause Analysis

1. **No centralized client-side project context** - Each component reads/manages project independently
2. **No project-aware Link component** - Developers must manually add `?project=X`
3. **No enforced pattern** - Easy to forget project param in `router.push()`
4. **Duplicated `buildHref()` logic** - Same helper copied to 3+ locations

---

### Problem 2: Multi-Tenancy Data Bleed

#### Description

Several API routes **do not filter by projectId**, causing data from one project to be visible when a user is working in a different project. This is a **critical security vulnerability** for multi-tenancy.

#### Critical Vulnerabilities

##### 1. `/api/search/route.ts` - CRITICAL

**File:** `apps/web/app/api/search/route.ts`

**Issue:** The unified search API searches across ALL projects without filtering by the current user's active project.

```typescript
// Lines 48-64: Issues search - NO projectId filter
const issues = await prisma.ticket.findMany({
  where: {
    kind: { in: ['issue', 'bug', 'scanner_finding'] },
    OR: [
      { title: { contains: searchTerm, mode: 'insensitive' as const } },
      { description: { contains: searchTerm, mode: 'insensitive' as const } },
    ],
    // ❌ MISSING: projectId: authorizedProjectId
  },
  take: limit,
});

// Lines 81-95: Knowledge search - NO projectId filter
const articles = await prisma.knowledgeItem.findMany({
  where: {
    OR: [
      { title: { contains: searchTerm, mode: 'insensitive' as const } },
      { content: { contains: searchTerm, mode: 'insensitive' as const } },
    ],
    // ❌ MISSING: projectId: authorizedProjectId
  },
  take: limit,
});

// Lines 113-139: Wiki search - NO projectId filter
// Uses raw SQL without WHERE projectId clause

// Lines 155-171: Agents search - NO projectId filter
const agents = await prisma.agentPersona.findMany({
  where: {
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' as const } },
      { description: { contains: searchTerm, mode: 'insensitive' as const } },
    ],
    // ❌ MISSING: projectId: authorizedProjectId
  },
  take: limit,
});
```

**Impact:** User A searching in Project 1 can see tickets, knowledge, wiki pages, and agents from Project 2.

##### 2. `/api/workflows/route.ts` - CRITICAL

**File:** `apps/web/app/api/workflows/route.ts`

**Issue:** Returns ALL workflow templates regardless of project ownership.

```typescript
// Lines 23-38
const templates = await prisma.workflowTemplate.findMany({
  where: {
    ...(category && { category }),
    isActive,
    // ❌ MISSING: projectId filter
  },
  select: {
    id: true,
    name: true,
    description: true,
    category: true,
    steps: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  },
  orderBy: [{ category: 'asc' }, { name: 'asc' }],
});
```

**Impact:** All users see all workflow templates, including those created for other projects.

##### 3. `/api/agents/[id]/route.ts` - HIGH

**File:** `apps/web/app/api/agents/[id]/route.ts`

**Issue:** When fetching an agent, it retrieves workflows without project filtering. Note: Skills query at line 32-49 correctly uses `projectId: agent.projectId`.

```typescript
// Lines 53-68: Workflows query MISSING projectId filter
const workflows = await prisma.workflowTemplate.findMany({
  where: {
    // Filter by categories that match agent's expertise
    category: { in: agent.expertise },
    isActive: true,
    // ❌ MISSING: projectId: agent.projectId
  },
  select: {
    id: true,
    name: true,
    description: true,
    category: true,
    steps: true,
    isActive: true,
  },
  orderBy: { name: 'asc' },
});
```

**Impact:** Agent detail pages show workflows from other projects.

##### 4. Client Hook Data Fetch - MEDIUM

**File:** `apps/web/hooks/useSessionsData.ts`

**Issue:** `fetchTicketsByIds()` at lines 103-118 doesn't pass projectId for authorization. However, the hook correctly includes projectId in React Query keys (line 207, 213, 219), so cache isolation is maintained.

```typescript
// Lines 103-118
async function fetchTicketsByIds(ticketIds: number[]): Promise<KanbanTicket[]> {
  if (ticketIds.length === 0) return [];

  // Use ticket search with IDs filter
  const params = new URLSearchParams();
  ticketIds.forEach((id) => params.append('ids', String(id)));
  // ⚠️ NOTE: projectId not passed - relies on ticket IDs being unique across projects

  const res = await fetch(`/api/tickets?${params}`);
  // ... rest of function
}
```

**Impact:** Low risk since ticket IDs are auto-incrementing integers (unique across projects), but should add projectId for defense-in-depth.

#### Additional Concerns

| File | Issue | Risk |
|------|-------|------|
| `WikiPage` model | ✅ Has projectId FK (lines 803-805 in schema) | Low - properly scoped |
| Session caching | ✅ React Query keys include projectId (useSessionsData.ts lines 207-224) | Low - cache properly isolated |
| Command palette | Searches may bleed if search API not fixed | High - depends on search fix |
| MCP Tools | Some tools don't validate project ownership | Medium - agent could access other projects |

---

## Current State Assessment

### What's Working Well ✅

1. **Server-side page auth** - `getActiveProjectForUser()` in `lib/project-context.ts`
2. **API route auth** - `getAuthorizedProjectId()` in `lib/auth/validateRequest.ts`
3. **Middleware enforcement** - Redirects to `/app` if `?project=` missing
4. **Sidebar navigation** - Uses `buildHref()` consistently
5. **Most API routes** - 25+ routes properly filter by projectId

### What Needs Fixing ❌

1. **3 API routes** - Missing projectId filtering (critical: `/api/search`, `/api/workflows`, `/api/agents/[id]`)
2. **8 components** - Losing project context on navigation (verified list below)
3. **1 hook** - `fetchTicketsByIds` not passing projectId (low risk)
4. **No client context** - No React Context for project state
5. **No standard Link** - No project-aware Link component
6. **MCP tools** - Need project ownership validation audit

---

## Unified Architecture Proposal

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        LAYER 1: MIDDLEWARE                       │
│  middleware.ts - Enforces auth + project param on protected     │
│  routes. Redirects if missing. First line of defense.           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: SERVER COMPONENTS                    │
│  withProjectAuth() - Unified auth + project resolution          │
│  Returns: { user, project, projectId }                          │
│  Single function replaces 3 separate calls                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       LAYER 3: API ROUTES                        │
│  withProjectApi() - Wrapper for route handlers                  │
│  Validates auth, resolves projectId, handles errors             │
│  Enforces: Every query MUST include projectId in WHERE          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 4: CLIENT CONTEXT                       │
│  <ProjectProvider> - React Context for project state            │
│  Provides: projectId, buildHref(), navigateTo(),                │
│           updateSearchParams()                                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 5: UI COMPONENTS                      │
│  <ProjectLink> - Drop-in replacement for next/link              │
│  <ProjectButton> - Button with project-aware navigation         │
│  useProject() hook - Access project context anywhere            │
└─────────────────────────────────────────────────────────────────┘
```

### New Files to Create

#### 1. `lib/project/withProjectAuth.ts` - Server-Side Unified Auth

```typescript
/**
 * Unified Server-Side Auth + Project Resolution
 * 
 * USAGE in Server Components:
 * 
 * export default async function MyPage({ searchParams }) {
 *   const params = await searchParams;
 *   const { user, project, projectId } = await withProjectAuth(params.project);
 *   // ... render with project context
 * }
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser, type ProjectContext } from '@/lib/project-context';

export interface ProjectAuthContext {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  project: {
    id: number;
    name: string;
    ownerId: string;
  };
  projectId: number;
}

/**
 * Unified page-level authentication and project resolution.
 * 
 * This is the SINGLE SOURCE OF TRUTH for server components.
 * Replaces the pattern of calling getCurrentUser() + getActiveProjectForUser() separately.
 * 
 * @param searchParamsProject - The `project` query parameter from searchParams
 * @param options - Optional configuration
 * @returns ProjectAuthContext with user and project data
 * @throws Redirects to /login if not authenticated
 * @throws Redirects to /app if project invalid or unauthorized
 * 
 * @example
 * // In a page.tsx
 * const { user, project, projectId } = await withProjectAuth(params.project);
 */
export async function withProjectAuth(
  searchParamsProject?: string,
  options: { requireAdmin?: boolean } = {}
): Promise<ProjectAuthContext> {
  // Step 1: Authenticate user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Step 2: Check admin requirement if specified
  if (options.requireAdmin && user.role !== 'ADMIN') {
    redirect('/app');
  }

  // Step 3: Resolve project with ownership validation
  const { project, projectId } = await getActiveProjectForUser(
    user.id,
    searchParamsProject
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    project,
    projectId,
  };
}

/**
 * Lightweight version that only validates project access.
 * Use when you already have user context.
 */
export async function withProjectOnly(
  userId: string,
  searchParamsProject?: string
): Promise<ProjectContext> {
  return getActiveProjectForUser(userId, searchParamsProject);
}
```

#### 2. `lib/project/withProjectApi.ts` - API Route Wrapper

```typescript
/**
 * Unified API Route Handler with Project Validation
 * 
 * USAGE in API Routes:
 * 
 * export async function GET(request: NextRequest) {
 *   return withProjectApi(request, async ({ projectId, auth }) => {
 *     const items = await prisma.item.findMany({
 *       where: { projectId }, // Always filtered!
 *     });
 *     return { items };
 *   });
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthorizedProjectId,
  AuthError,
  authErrorResponse,
  type AuthResult,
} from '@/lib/auth/validateRequest';

interface ProjectApiContext {
  projectId: number;
  auth: AuthResult;
  request: NextRequest;
}

type ApiHandler<T> = (context: ProjectApiContext) => Promise<T>;

interface WithProjectApiOptions {
  /** Extract projectId from query params (default: true) */
  fromQuery?: boolean;
  /** Query param name for projectId (default: 'projectId') */
  paramName?: string;
  /** Allow requests without projectId (uses default project) */
  allowDefault?: boolean;
}

/**
 * Wraps an API route handler with authentication and project validation.
 * 
 * Features:
 * - Automatic auth validation (session or bearer token)
 * - Project access verification
 * - Standardized error responses
 * - Consistent response format
 * 
 * @example
 * // GET with projectId from query
 * export async function GET(request: NextRequest) {
 *   return withProjectApi(request, async ({ projectId }) => {
 *     const items = await prisma.item.findMany({ where: { projectId } });
 *     return { items, count: items.length };
 *   });
 * }
 * 
 * @example
 * // POST with projectId from body
 * export async function POST(request: NextRequest) {
 *   const body = await request.json();
 *   return withProjectApi(
 *     request,
 *     async ({ projectId }) => {
 *       const created = await prisma.item.create({
 *         data: { ...body, projectId },
 *       });
 *       return created;
 *     },
 *     { fromQuery: false }
 *   );
 * }
 */
export async function withProjectApi<T>(
  request: NextRequest,
  handler: ApiHandler<T>,
  options: WithProjectApiOptions = {}
): Promise<NextResponse> {
  const {
    fromQuery = true,
    paramName = 'projectId',
    allowDefault = true,
  } = options;

  try {
    // Extract projectId from request
    let requestedProjectId: number | undefined;

    if (fromQuery) {
      const param = request.nextUrl.searchParams.get(paramName);
      if (param) {
        requestedProjectId = parseInt(param, 10);
        if (isNaN(requestedProjectId)) {
          return NextResponse.json(
            { error: `Invalid ${paramName}: must be a number` },
            { status: 400 }
          );
        }
      }
    }

    // Validate auth and project access
    const { auth, projectId } = await getAuthorizedProjectId(
      request,
      requestedProjectId
    );

    // If no projectId and not allowed to default, error
    if (!projectId && !allowDefault) {
      return NextResponse.json(
        { error: `${paramName} is required` },
        { status: 400 }
      );
    }

    // Execute handler with validated context
    const result = await handler({ projectId, auth, request });

    // Return success response
    return NextResponse.json(result);
  } catch (error) {
    // Handle auth errors with proper status codes
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }

    // Log unexpected errors
    console.error('[withProjectApi] Unexpected error:', error);

    // Return generic error
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to create a standardized success response
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Helper to create a standardized error response
 */
export function apiError(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  return NextResponse.json(
    { error: message, ...(code && { code }) },
    { status }
  );
}
```

#### 3. `lib/project/ProjectContext.tsx` - Client-Side Context

```typescript
'use client';

/**
 * Project Context Provider
 * 
 * Provides project-aware utilities to all client components:
 * - projectId: Current active project
 * - buildHref(): Build URLs with project param preserved
 * - navigateTo(): Navigate while preserving project
 * - updateSearchParams(): Update URL params without losing project
 * 
 * USAGE:
 * 
 * // In layout.tsx
 * <ProjectProvider projectId={projectId}>
 *   {children}
 * </ProjectProvider>
 * 
 * // In any client component
 * const { projectId, buildHref, navigateTo } = useProject();
 */

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

// ============================================================================
// Types
// ============================================================================

interface ProjectContextValue {
  /** Current project ID (null if not in project context) */
  projectId: number | null;
  
  /** Project name (if available from server) */
  projectName: string | null;

  /**
   * Build a URL with project context preserved.
   * 
   * @param path - The base path (e.g., '/wiki', '/tickets')
   * @param params - Additional query params to include
   * @returns Full URL with ?project=X and any additional params
   * 
   * @example
   * buildHref('/wiki') // => '/wiki?project=1'
   * buildHref('/tickets', { status: 'open' }) // => '/tickets?project=1&status=open'
   */
  buildHref: (path: string, params?: Record<string, string | number | undefined>) => string;

  /**
   * Navigate to a path while preserving project context.
   * 
   * @param path - The base path to navigate to
   * @param params - Additional query params to include
   * 
   * @example
   * navigateTo('/wiki');
   * navigateTo('/tickets', { status: 'open' });
   */
  navigateTo: (path: string, params?: Record<string, string | number | undefined>) => void;

  /**
   * Update search params on current page without losing project context.
   * Pass null as value to remove a param.
   * 
   * @param updates - Key-value pairs to update
   * 
   * @example
   * updateSearchParams({ q: 'search term', page: '2' });
   * updateSearchParams({ q: null }); // Removes q param
   */
  updateSearchParams: (updates: Record<string, string | number | null | undefined>) => void;

  /**
   * Clear all search params except project and navigate to current path.
   */
  clearSearchParams: () => void;
}

// ============================================================================
// Context
// ============================================================================

const ProjectContext = createContext<ProjectContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface ProjectProviderProps {
  children: ReactNode;
  /** Project ID from server (takes precedence over URL) */
  projectId?: number;
  /** Project name from server */
  projectName?: string;
}

export function ProjectProvider({
  children,
  projectId: serverProjectId,
  projectName: serverProjectName,
}: ProjectProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolve projectId: server prop > URL param > null
  const projectId = useMemo(() => {
    if (serverProjectId) return serverProjectId;
    const urlProject = searchParams.get('project');
    if (urlProject) {
      const parsed = parseInt(urlProject, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }, [serverProjectId, searchParams]);

  const projectName = serverProjectName ?? null;

  // Build href with project context
  const buildHref = useCallback(
    (path: string, params: Record<string, string | number | undefined> = {}) => {
      const urlParams = new URLSearchParams();

      // ALWAYS include project if we have one
      if (projectId) {
        urlParams.set('project', projectId.toString());
      }

      // Add additional params (skip undefined values)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlParams.set(key, String(value));
        }
      });

      const queryString = urlParams.toString();
      return queryString ? `${path}?${queryString}` : path;
    },
    [projectId]
  );

  // Navigate with project context
  const navigateTo = useCallback(
    (path: string, params: Record<string, string | number | undefined> = {}) => {
      router.push(buildHref(path, params));
    },
    [router, buildHref]
  );

  // Update search params while preserving project
  const updateSearchParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Ensure project is preserved
      if (projectId && !params.has('project')) {
        params.set('project', projectId.toString());
      }

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, projectId]
  );

  // Clear all params except project
  const clearSearchParams = useCallback(() => {
    if (projectId) {
      router.push(`${pathname}?project=${projectId}`);
    } else {
      router.push(pathname);
    }
  }, [router, pathname, projectId]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      projectId,
      projectName,
      buildHref,
      navigateTo,
      updateSearchParams,
      clearSearchParams,
    }),
    [projectId, projectName, buildHref, navigateTo, updateSearchParams, clearSearchParams]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access project context in any client component.
 * 
 * @throws Error if used outside of ProjectProvider
 * 
 * @example
 * function MyComponent() {
 *   const { projectId, buildHref, navigateTo } = useProject();
 *   
 *   return (
 *     <button onClick={() => navigateTo('/tickets')}>
 *       View Tickets
 *     </button>
 *   );
 * }
 */
export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext);
  
  if (!context) {
    throw new Error(
      'useProject must be used within a ProjectProvider. ' +
      'Wrap your component tree with <ProjectProvider projectId={...}>.'
    );
  }
  
  return context;
}

/**
 * Optional hook that returns null instead of throwing if outside provider.
 * Useful for components that may or may not be in project context.
 */
export function useProjectOptional(): ProjectContextValue | null {
  return useContext(ProjectContext);
}
```

#### 4. `components/ui/ProjectLink.tsx` - Project-Aware Link

```typescript
'use client';

/**
 * Project-Aware Link Component
 * 
 * Drop-in replacement for next/link that automatically preserves project context.
 * 
 * USAGE:
 * 
 * // Instead of:
 * <Link href={`/wiki?project=${projectId}`}>Wiki</Link>
 * 
 * // Use:
 * <ProjectLink href="/wiki">Wiki</ProjectLink>
 * 
 * // With additional params:
 * <ProjectLink href="/tickets" params={{ status: 'open' }}>Open Tickets</ProjectLink>
 */

import Link from 'next/link';
import { forwardRef, type ComponentProps } from 'react';
import { useProject } from '@/lib/project/ProjectContext';

// ============================================================================
// Types
// ============================================================================

type NextLinkProps = Omit<ComponentProps<typeof Link>, 'href'>;

interface ProjectLinkProps extends NextLinkProps {
  /** Base path (e.g., '/wiki', '/tickets') */
  href: string;
  /** Additional query params to include */
  params?: Record<string, string | number | undefined>;
  /** If true, skips project context (for external/public links) */
  skipProject?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Link component that automatically includes project context.
 * 
 * @example
 * // Basic usage - project is auto-added
 * <ProjectLink href="/wiki">Wiki</ProjectLink>
 * // Renders: <a href="/wiki?project=1">Wiki</a>
 * 
 * @example
 * // With additional params
 * <ProjectLink href="/tickets" params={{ status: 'open', priority: 'high' }}>
 *   High Priority
 * </ProjectLink>
 * // Renders: <a href="/tickets?project=1&status=open&priority=high">High Priority</a>
 * 
 * @example
 * // Skip project (for auth pages, external links)
 * <ProjectLink href="/login" skipProject>Login</ProjectLink>
 * // Renders: <a href="/login">Login</a>
 */
export const ProjectLink = forwardRef<HTMLAnchorElement, ProjectLinkProps>(
  function ProjectLink({ href, params = {}, skipProject = false, children, ...props }, ref) {
    const { buildHref } = useProject();

    // Build the full href with project context
    const fullHref = skipProject
      ? href
      : buildHref(href, params);

    return (
      <Link ref={ref} href={fullHref} {...props}>
        {children}
      </Link>
    );
  }
);

// ============================================================================
// ProjectButton - For button-style navigation
// ============================================================================

interface ProjectButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Base path to navigate to */
  href: string;
  /** Additional query params */
  params?: Record<string, string | number | undefined>;
  /** Variant styling */
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * Button that navigates with project context preserved.
 * 
 * @example
 * <ProjectButton href="/tickets/new">Create Ticket</ProjectButton>
 */
export function ProjectButton({
  href,
  params = {},
  variant = 'default',
  children,
  className,
  ...props
}: ProjectButtonProps) {
  const { navigateTo } = useProject();

  const handleClick = () => {
    navigateTo(href, params);
  };

  // Base styles (adjust to match your design system)
  const baseStyles = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';
  
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## Phased Implementation Plan

### Overview

| Phase | Focus | Duration | Risk | Dependencies |
|-------|-------|----------|------|--------------|
| 1 | Fix Critical Data Bleed | 2-3 hours | 🔴 High (security) | None |
| 2 | Create Unified Utilities | 3-4 hours | 🟢 Low | None |
| 3 | Integrate ProjectProvider | 2-3 hours | 🟡 Medium | Phase 2 |
| 4 | Migrate Components | 4-6 hours | 🟡 Medium | Phase 3 |
| 5 | Migrate Pages | 3-4 hours | 🟢 Low | Phase 2 |
| 6 | Testing & Validation | 2-3 hours | 🟢 Low | All phases |

**Total Estimated Time:** 16-23 hours

---

### Phase 1: Fix Critical Data Bleed (URGENT)

**Priority:** 🔴 CRITICAL - Do this first!

**Goal:** Add projectId filtering to all API routes that currently expose cross-project data.

#### 1.1 Fix `/api/search/route.ts`

**Current State:** No auth, no project filtering  
**Target State:** Auth required, all queries filtered by projectId

```typescript
// BEFORE (line 27):
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    // ... searches without project filtering

// AFTER:
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    
    // NEW: Authenticate and get authorized project
    const requestedProjectId = searchParams.get('projectId');
    const { projectId } = await getAuthorizedProjectId(
      request,
      requestedProjectId ? parseInt(requestedProjectId, 10) : undefined
    );
    
    // ... rest of function with projectId in all queries
```

**Files to modify:**
1. Add `projectId` filter to ticket search (line ~48)
2. Add `projectId` filter to knowledge search (line ~81)
3. Add `projectId` filter to wiki search raw SQL (line ~113)
4. Add `projectId` filter to agent search (line ~155)

#### 1.2 Fix `/api/workflows/route.ts`

**Current State:** No auth, no project filtering  
**Target State:** Auth required, filtered by projectId

```typescript
// AFTER:
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActiveParam = searchParams.get('isActive');
    
    // NEW: Auth and project validation
    const requestedProjectId = searchParams.get('projectId');
    const { projectId } = await getAuthorizedProjectId(
      request,
      requestedProjectId ? parseInt(requestedProjectId, 10) : undefined
    );

    const templates = await prisma.workflowTemplate.findMany({
      where: {
        projectId, // NEW: Filter by project
        ...(category && { category }),
        isActive,
      },
      // ... rest unchanged
    });
```

#### 1.3 Fix `/api/agents/[id]/route.ts`

**Current State:** Workflows fetched without project filter  
**Target State:** Workflows filtered by agent's projectId

```typescript
// Line 53-68, change to:
const workflows = await prisma.workflowTemplate.findMany({
  where: {
    projectId: agent.projectId, // NEW: Use agent's project
    category: { in: agent.expertise },
    isActive: true,
  },
  // ... rest unchanged
});
```

#### 1.4 Fix `useSessionsData.ts` hook

**Current State:** `fetchTicketsByIds` doesn't pass projectId  
**Target State:** ProjectId passed and validated

```typescript
// Line 103, change signature:
async function fetchTicketsByIds(
  ticketIds: number[], 
  projectId: number // NEW: Required param
): Promise<KanbanTicket[]> {
  if (ticketIds.length === 0) return [];

  const params = new URLSearchParams();
  params.set('projectId', String(projectId)); // NEW: Add projectId
  ticketIds.forEach((id) => params.append('ids', String(id)));

  const res = await fetch(`/api/tickets?${params}`);
  // ... rest unchanged
}

// Update caller (line ~244):
queryFn: () => fetchTicketsByIds(activeTicketIds, projectId),
```

#### Phase 1 Verification Checklist

- [ ] `/api/search?q=test&projectId=1` only returns Project 1 data
- [ ] `/api/search?q=test` without projectId uses user's default project
- [ ] `/api/workflows?projectId=1` only returns Project 1 workflows
- [ ] `/api/agents/1` only shows Project 1 workflows
- [ ] Sessions data hook correctly passes projectId

---

### Phase 2: Create Unified Utilities

**Goal:** Create the foundational utilities for the new architecture.

#### 2.1 Create Server-Side Utilities

```bash
# Create new files
touch apps/web/lib/project/withProjectAuth.ts
touch apps/web/lib/project/withProjectApi.ts
touch apps/web/lib/project/index.ts
```

**Files to create:**
1. `lib/project/withProjectAuth.ts` - Server component auth (see code above)
2. `lib/project/withProjectApi.ts` - API route wrapper (see code above)
3. `lib/project/index.ts` - Barrel export

#### 2.2 Create Client-Side Utilities

```bash
# Create new files
touch apps/web/lib/project/ProjectContext.tsx
touch apps/web/components/ui/ProjectLink.tsx
```

**Files to create:**
1. `lib/project/ProjectContext.tsx` - React Context (see code above)
2. `components/ui/ProjectLink.tsx` - Link component (see code above)

#### 2.3 Create Barrel Exports

```typescript
// lib/project/index.ts
export { withProjectAuth, withProjectOnly, type ProjectAuthContext } from './withProjectAuth';
export { withProjectApi, apiSuccess, apiError } from './withProjectApi';
export { ProjectProvider, useProject, useProjectOptional } from './ProjectContext';

// components/ui/index.ts (add to existing)
export { ProjectLink, ProjectButton } from './ProjectLink';
```

#### Phase 2 Verification Checklist

- [ ] All files created without TypeScript errors
- [ ] Imports resolve correctly
- [ ] `withProjectAuth()` works in a test page
- [ ] `ProjectProvider` renders without errors
- [ ] `useProject()` hook returns expected values

---

### Phase 3: Integrate ProjectProvider

**Goal:** Add ProjectProvider to the app layout so all components can access project context.

#### 3.1 Update Root Layout

**File:** `apps/web/app/(protected)/layout.tsx` (or wherever project routes are wrapped)

```typescript
// Before:
export default async function ProtectedLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// After:
import { ProjectProvider } from '@/lib/project/ProjectContext';
import { withProjectAuth } from '@/lib/project/withProjectAuth';

export default async function ProtectedLayout({ 
  children,
  params,
}: { 
  children: React.ReactNode;
  params: { project?: string };
}) {
  // This may not work directly in layout - see alternative below
  
  return (
    <ProjectProvider>
      <div className="flex">
        <Sidebar />
        <main>{children}</main>
      </div>
    </ProjectProvider>
  );
}
```

**Alternative: Pass projectId from each page**

Since layouts don't have access to searchParams, we pass projectId from page to layout via a client wrapper:

```typescript
// components/layout/ProjectLayoutWrapper.tsx
'use client';

import { ProjectProvider } from '@/lib/project/ProjectContext';

export function ProjectLayoutWrapper({
  children,
  projectId,
  projectName,
}: {
  children: React.ReactNode;
  projectId?: number;
  projectName?: string;
}) {
  return (
    <ProjectProvider projectId={projectId} projectName={projectName}>
      {children}
    </ProjectProvider>
  );
}
```

Then in each page:
```typescript
// app/wiki/page.tsx
export default async function WikiPage({ searchParams }) {
  const { projectId, project } = await withProjectAuth(searchParams.project);
  
  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <WikiContent ... />
    </ProjectLayoutWrapper>
  );
}
```

#### Phase 3 Verification Checklist

- [ ] ProjectProvider renders in all protected pages
- [ ] `useProject()` returns correct projectId in child components
- [ ] `buildHref()` generates correct URLs with project param
- [ ] No hydration errors or client/server mismatches

---

### Phase 4: Migrate Components (Detailed)

**Goal:** Update all components that currently lose project context.

#### 4.1 High Priority - Filter Components

##### TagFilter.tsx Migration

**File:** `apps/web/components/knowledge/TagFilter.tsx`

```typescript
// BEFORE (lines 26-35):
const handleTagSelect = (tag: string) => {
  const params = new URLSearchParams(searchParams?.toString());
  params.set('tag', tag);
  params.delete('page');
  router.push(`/knowledge?${params.toString()}`);
};

const handleClear = () => {
  router.push('/knowledge');
};

// AFTER:
import { useProject } from '@/lib/project/ProjectContext';

function TagFilter() {
  const { updateSearchParams, clearSearchParams } = useProject();
  
  const handleTagSelect = (tag: string) => {
    updateSearchParams({ tag, page: null }); // null removes the param
  };

  const handleClear = () => {
    clearSearchParams(); // Clears all except project
  };
  
  // ... rest of component
}
```

##### SearchBar.tsx (Knowledge) Migration

**File:** `apps/web/components/knowledge/SearchBar.tsx`

```typescript
// BEFORE:
router.push(`/knowledge?q=${encodeURIComponent(debouncedSearch)}`);
router.push('/knowledge');

// AFTER:
import { useProject } from '@/lib/project/ProjectContext';

function SearchBar() {
  const { updateSearchParams, clearSearchParams } = useProject();
  
  const handleSearch = (query: string) => {
    if (query) {
      updateSearchParams({ q: query, page: null });
    } else {
      clearSearchParams();
    }
  };
  // ...
}
```

##### WikiSearchBar.tsx Migration

**File:** `apps/web/components/wiki/WikiSearchBar.tsx`

```typescript
// BEFORE:
router.push(`/wiki?q=${encodeURIComponent(trimmedSearch)}`);
router.push('/wiki');

// AFTER:
import { useProject } from '@/lib/project/ProjectContext';

function WikiSearchBar() {
  const { updateSearchParams, clearSearchParams } = useProject();
  
  const handleSearch = (query: string) => {
    if (query.trim()) {
      updateSearchParams({ q: query.trim() });
    } else {
      clearSearchParams();
    }
  };
  // ...
}
```

##### WikiListClient.tsx Migration

**File:** `apps/web/components/wiki/WikiListClient.tsx`

```typescript
// BEFORE (line 64):
router.push('/wiki');

// AFTER:
import { useProject } from '@/lib/project/ProjectContext';

function WikiListClient() {
  const { clearSearchParams } = useProject();
  
  const handleReset = () => {
    clearSearchParams();
  };
  // ...
}
```

##### QuickNavigation.tsx Migration

**File:** `apps/web/components/wiki/QuickNavigation.tsx`

```typescript
// BEFORE (line 29):
router.push(`/wiki?q=${encodeURIComponent(search)}`);

// AFTER:
import { useProject } from '@/lib/project/ProjectContext';

function QuickNavigation() {
  const { updateSearchParams } = useProject();
  
  const handleSearch = (query: string) => {
    updateSearchParams({ q: query });
  };
  // ...
}
```

#### 4.2 Medium Priority - Navigation Components

##### Sidebar.tsx Migration

**File:** `apps/web/components/Sidebar.tsx`

The Sidebar already has a `buildHref` helper but reads projectId from `useSidebarCounts()`. Migrate to use `useProject()`:

```typescript
// BEFORE:
const { projectId, counts } = useSidebarCounts();

const buildHref = (path: string) => {
  if (!projectId) return path;
  return `${path}?project=${projectId}`;
};

// AFTER:
import { useProject } from '@/lib/project/ProjectContext';

function Sidebar() {
  const { buildHref, projectId } = useProject();
  const { counts } = useSidebarCounts(); // Keep for counts only
  
  // Now use buildHref from context directly
  // No local buildHref needed
  
  return (
    <nav>
      <ProjectLink href="/dashboard">Dashboard</ProjectLink>
      <ProjectLink href="/tickets">Tickets</ProjectLink>
      // ...
    </nav>
  );
}
```

##### CommandPalette.tsx Migration

**File:** `apps/web/components/command-palette/CommandPalette.tsx`

```typescript
// BEFORE:
const searchParams = useSearchParams();
const projectId = searchParams.get('project');

// AFTER:
import { useProject } from '@/lib/project/ProjectContext';

function CommandPalette() {
  const { projectId, navigateTo } = useProject();
  
  // Pass navigateTo to commands instead of router
  const commands = createCommands(navigateTo, projectId);
  // ...
}
```

##### commands.ts Migration

**File:** `apps/web/components/command-palette/commands.ts`

```typescript
// BEFORE:
export function createCommands(router: any, projectId?: number) {
  const buildHref = (path: string) => {
    if (!projectId) return path;
    return `${path}?project=${projectId}`;
  };
  
  // commands use: action: () => router.push(buildHref('/wiki'))

// AFTER:
type NavigateFn = (path: string, params?: Record<string, string>) => void;

export function createCommands(navigateTo: NavigateFn, projectId?: number) {
  // No buildHref needed - navigateTo handles project context
  
  // commands use: action: () => navigateTo('/wiki')
}
```

#### 4.3 Low Priority - Other Components

##### Pagination.tsx

Already handles projectId well, but can be simplified:

```typescript
// Can use updateSearchParams instead of manual URL construction
const { updateSearchParams } = useProject();

const handlePageChange = (page: number) => {
  updateSearchParams({ page: String(page) });
};
```

##### SessionCard.tsx

```typescript
// BEFORE:
<Link href={href}>

// AFTER:
<ProjectLink href={baseHref} params={additionalParams}>
```

#### Phase 4 Migration Checklist

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| TagFilter | `components/knowledge/TagFilter.tsx` | ⬜ Pending | High priority |
| SearchBar (Knowledge) | `components/knowledge/SearchBar.tsx` | ⬜ Pending | High priority |
| WikiSearchBar | `components/wiki/WikiSearchBar.tsx` | ⬜ Pending | High priority |
| WikiListClient | `components/wiki/WikiListClient.tsx` | ⬜ Pending | High priority |
| QuickNavigation | `components/wiki/QuickNavigation.tsx` | ⬜ Pending | High priority |
| Sidebar | `components/Sidebar.tsx` | ⬜ Pending | Medium priority |
| CommandPalette | `components/command-palette/CommandPalette.tsx` | ⬜ Pending | Medium priority |
| commands.ts | `components/command-palette/commands.ts` | ⬜ Pending | Medium priority |
| Pagination | `components/tickets/Pagination.tsx` | ⬜ Pending | Low priority |
| SearchSortBar | `components/tickets/SearchSortBar.tsx` | ⬜ Pending | Low priority |
| SessionCard | `components/onboarding/SessionCard.tsx` | ⬜ Pending | Low priority |

---

### Phase 5: Migrate Pages

**Goal:** Update server components to use `withProjectAuth()` for consistent auth + project resolution.

#### 5.1 Pattern for Page Migration

**Current Pattern (varies by page):**
```typescript
export default async function SomePage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  const { project, projectId } = await getActiveProjectForUser(user.id, searchParams.project);
  
  // ... rest of page
}
```

**New Pattern (consistent):**
```typescript
import { withProjectAuth } from '@/lib/project';

export default async function SomePage({ searchParams }) {
  const params = await searchParams;
  const { user, project, projectId } = await withProjectAuth(params.project);
  
  // ... rest of page
}
```

#### 5.2 Pages to Migrate

| Page | Current State | Migration Complexity |
|------|---------------|---------------------|
| `app/dashboard/page.tsx` | Inline project logic | Medium (has custom logic) |
| `app/tickets/page.tsx` | Uses `getActiveProjectForUser` | Low |
| `app/wiki/page.tsx` | Uses `getActiveProjectForUser` | Low |
| `app/knowledge/page.tsx` | Uses `getActiveProjectForUser` | Low |
| `app/agents/page.tsx` | Mixed pattern | Medium |
| `app/sessions/page.tsx` | Uses auth utilities | Low |

#### 5.3 Special Case: Dashboard Page

The dashboard page has custom inline logic that duplicates `getActiveProjectForUser`. This should be migrated:

```typescript
// BEFORE (dashboard/page.tsx lines 266-293):
let projectId: number;
if (searchParams.project) {
  projectId = parseInt(searchParams.project, 10);
} else {
  const firstProject = await prisma.project.findFirst({...});
  projectId = firstProject.id;
}
// Manual ownership verification...

// AFTER:
const { projectId, project, user } = await withProjectAuth(searchParams.project);
// All validation handled by withProjectAuth
```

---

### Phase 6: Testing & Validation

#### 6.1 Unit Tests

Create tests for new utilities:

```typescript
// tests/lib/project/ProjectContext.test.tsx
describe('ProjectContext', () => {
  it('buildHref includes projectId', () => {
    // Test buildHref with various inputs
  });
  
  it('updateSearchParams preserves project', () => {
    // Test that project param is never lost
  });
});
```

#### 6.2 Integration Tests

Update existing E2E tests:

**File:** `apps/web/tests/e2e/project-context.spec.ts` (follows existing `tests/e2e/` structure)

```typescript
test('project context preserved on filter change', async ({ page }) => {
  await page.goto('/knowledge?project=1');
  
  // Apply filter
  await page.click('[data-testid="tag-filter"]');
  await page.click('text=important');
  
  // Verify URL still has project
  expect(page.url()).toContain('project=1');
});

test('project context preserved on search', async ({ page }) => {
  await page.goto('/wiki?project=1');
  
  // Search
  await page.fill('[data-testid="search-input"]', 'test');
  await page.press('[data-testid="search-input"]', 'Enter');
  
  // Verify URL still has project
  expect(page.url()).toContain('project=1');
});
```

#### 6.3 Manual Testing Checklist

- [ ] Navigate through all main pages, verify `?project=X` stays in URL
- [ ] Use filters on knowledge page, verify project preserved
- [ ] Use search on wiki page, verify project preserved
- [ ] Use command palette, verify navigation includes project
- [ ] Clear filters, verify project preserved
- [ ] Use pagination, verify project preserved
- [ ] Switch projects via project selector, verify all links update

#### 6.4 Security Testing

- [ ] Attempt to access `/api/search?projectId=2` while authenticated for project 1 → should fail
- [ ] Attempt to access `/api/workflows?projectId=2` while authenticated for project 1 → should fail
- [ ] Verify agent tokens can only access their scoped project
- [ ] Verify no data from other projects appears in search results

---

## Rollback Plan

If issues arise during migration, rollback in reverse order:

### Phase 4-5 Rollback

Components and pages can be individually reverted since they're independent:

```bash
git revert <commit-hash-of-component-change>
```

### Phase 3 Rollback

Remove ProjectProvider from layout:

```bash
git revert <commit-hash-of-layout-change>
```

### Phase 2 Rollback

New utilities are additive and don't break existing code. Can be left in place.

### Phase 1 Rollback (Critical Fixes)

**DO NOT ROLLBACK** - These are security fixes. If there are issues:
1. Fix forward, don't remove project filtering
2. If absolutely necessary, add temporary bypass with explicit logging

---

## Appendix

### A. File Index

| File | Purpose | Phase |
|------|---------|-------|
| `lib/project/withProjectAuth.ts` | Server auth + project | 2 |
| `lib/project/withProjectApi.ts` | API route wrapper | 2 |
| `lib/project/ProjectContext.tsx` | Client context | 2 |
| `lib/project/index.ts` | Barrel exports | 2 |
| `components/ui/ProjectLink.tsx` | Link component | 2 |
| `app/api/search/route.ts` | Fix data bleed | 1 |
| `app/api/workflows/route.ts` | Fix data bleed | 1 |
| `app/api/agents/[id]/route.ts` | Fix data bleed | 1 |
| `hooks/useSessionsData.ts` | Add projectId to fetchTicketsByIds | 1 |

### B. Pre-Implementation Checklist

**Before starting implementation, verify:**

- [ ] All Docker services running (`curl http://localhost:3000/api/health`)
- [ ] On feature branch (not master)
- [ ] Database backup taken (for Phase 1 security fixes)
- [ ] MCP ProjectPulse context loaded (`projectpulse_context_load(projectId: 6)`)

### C. Database Considerations

**Indexes for Performance:**

Adding `projectId` filters to queries benefits from existing indexes:

```sql
-- Already exists in schema:
@@index([projectId])  -- On Ticket, KnowledgeItem, WikiPage, AgentPersona
@@index([projectId, status])  -- On Ticket
@@index([projectId, category])  -- On WikiPage, KnowledgeItem
```

No new migrations needed - existing indexes cover the new WHERE clauses.

### D. Suspense Boundary Requirements

**Important:** `useSearchParams()` in Next.js 14+ requires Suspense boundaries.

The codebase already uses Suspense in several pages (verified in `knowledge/page.tsx`, `sessions/page.tsx`, etc.).

When adding `ProjectProvider` that uses `useSearchParams()`, ensure it's wrapped:

```typescript
// In layout or page
<Suspense fallback={<ProjectLoadingSkeleton />}>
  <ProjectProvider projectId={projectId}>
    {children}
  </ProjectProvider>
</Suspense>
```

### E. Backward Compatibility

| Scenario | Handling |
|----------|----------|
| Existing bookmarks without `?project=` | Middleware redirects to `/app` for project selection |
| API clients not sending `projectId` | `getAuthorizedProjectId()` falls back to user's default project |
| MCP tools without project scope | Token-based auth extracts projectId from token's project association |

### F. Related Documentation

- `docs/02-DATABASE-SCHEMA.md` - Project model and relations
- `docs/03-MCP-SPECIFICATION.md` - MCP tool project scoping
- `CLAUDE.md` - Agent workflow with project context
- `apps/web/middleware.ts` - Route protection configuration
- `apps/web/lib/project-context.ts` - Existing project resolution logic
- `apps/web/lib/auth/validateRequest.ts` - API auth utilities

### G. Ticket References

Create tickets for tracking (use `projectpulse_ticket_create`):

| Ticket | Priority | Phase | Description |
|--------|----------|-------|-------------|
| TBD | Critical | 1 | Fix multi-tenancy data bleed in `/api/search` |
| TBD | Critical | 1 | Fix multi-tenancy data bleed in `/api/workflows` |
| TBD | High | 1 | Fix workflows query in `/api/agents/[id]` |
| TBD | Medium | 2 | Create unified project context utilities |
| TBD | Medium | 3 | Integrate ProjectProvider in protected layout |
| TBD | Medium | 4 | Migrate filter components to use ProjectContext |
| TBD | Medium | 4 | Migrate navigation components to use ProjectLink |
| TBD | Low | 6 | Add E2E tests for project context preservation |

### H. Verified Component Migration List

| Component | File | Issue | Migration Effort |
|-----------|------|-------|------------------|
| TagFilter | `components/knowledge/TagFilter.tsx` | Line 29, 35 | Low |
| WikiListClient | `components/wiki/WikiListClient.tsx` | Line 64 | Low |
| SearchBar | `components/knowledge/SearchBar.tsx` | Line 36, 49 | Low |
| WikiSearchBar | `components/wiki/WikiSearchBar.tsx` | Line 56, 85 | Low |
| QuickNavigation | `components/wiki/QuickNavigation.tsx` | Line 29, 42 | Medium |
| SessionCard | `components/onboarding/SessionCard.tsx` | Link hrefs | Low |
| Sidebar | `components/Sidebar.tsx` | Has buildHref, needs hook | Medium |
| CommandPalette | `components/command-palette/` | Uses searchParams | Medium |

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-28 | Junior Dev | Initial document |
| 1.1 | 2025-12-28 | Cascade | Verified against codebase, corrected line numbers, fixed WikiPage assumption, added missing sections |

---

*This document is part of the ProjectPulse documentation. For questions or updates, create a ticket referencing EPIC-017.*
