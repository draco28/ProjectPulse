# Sprint 14: Performance Optimization (<100ms)

**Duration**: 2 weeks
**Focus**: Match Linear's speed obsession
**Status**: Planned
**Target**: API <100ms (P50), <200ms (P95)

---

## Overview

Linear achieves <100ms page loads through:
1. Aggressive caching
2. Optimistic UI updates
3. Local-first architecture (IndexedDB)
4. Edge deployment

ProjectPulse will achieve similar performance with:
1. **Redis caching** for hot data
2. **React Query** for client-side cache + optimistic updates
3. **Database optimization** (indexes, query tuning)
4. **Edge runtime** for critical APIs

---

## Feature 1: API Response Optimization

**Estimated Effort**: 3 days

### 1.1 Redis Caching Layer

```typescript
// apps/web/lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache helper with TTL
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  await redis.setex(key, ttlSeconds, data);
  return data;
}

// Invalidation helper
export async function invalidate(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
}
```

### 1.2 Caching Strategy

| Endpoint | Cache Key | TTL | Invalidation |
|----------|-----------|-----|--------------|
| `/api/tickets` | `tickets:${projectId}:${hash(filters)}` | 30s | On ticket CRUD |
| `/api/tickets/[id]` | `ticket:${id}` | 60s | On ticket update |
| `/api/views` | `views:${projectId}:${userId}` | 300s | On view CRUD |
| `/api/notifications/unread-count` | `notif:${userId}:count` | 10s | On new notification |
| `/api/projects` | `projects:${userId}` | 300s | On project CRUD |

### 1.3 Database Indexes

```sql
-- Add compound indexes for common queries
CREATE INDEX CONCURRENTLY idx_ticket_project_status
  ON "Ticket" ("projectId", "status");

CREATE INDEX CONCURRENTLY idx_ticket_project_assignee
  ON "Ticket" ("projectId", "assigneeId");

CREATE INDEX CONCURRENTLY idx_ticket_project_created
  ON "Ticket" ("projectId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY idx_notification_user_unread
  ON "Notification" ("userId", "isRead")
  WHERE "isRead" = false;

-- Partial index for active tickets only
CREATE INDEX CONCURRENTLY idx_ticket_active
  ON "Ticket" ("projectId", "updatedAt" DESC)
  WHERE "status" NOT IN ('completed', 'cancelled');
```

### 1.4 Query Optimization

```typescript
// Before: N+1 queries
const tickets = await prisma.ticket.findMany({ where: { projectId } });
for (const ticket of tickets) {
  ticket.assignee = await prisma.user.findUnique({ where: { id: ticket.assigneeId } });
}

// After: Single query with include
const tickets = await prisma.ticket.findMany({
  where: { projectId },
  include: {
    assignee: { select: { id: true, name: true, avatar: true } },
    labels: { select: { id: true, name: true, color: true } },
    _count: { select: { comments: true } }
  }
});
```

### 1.5 Response Compression

```typescript
// apps/web/middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Enable compression headers
  response.headers.set('Content-Encoding', 'gzip');
  response.headers.set('Vary', 'Accept-Encoding');

  return response;
}
```

### Files to Create/Modify

- `apps/web/lib/redis.ts` (new) - Redis client + helpers
- `apps/web/lib/cache.ts` (new) - Caching utilities
- `apps/web/app/api/tickets/route.ts` - Add caching
- `apps/web/prisma/migrations/` - Index migration
- `docker-compose.cloud.yml` - Add Redis service (or use Upstash)

---

## Feature 2: Frontend Performance

**Estimated Effort**: 3 days

### 2.1 React Query Setup

```typescript
// apps/web/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 2.2 Optimistic Updates

```typescript
// apps/web/hooks/useTicketMutation.ts
export function useTicketStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, status }) =>
      fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),

    // Optimistic update
    onMutate: async ({ ticketId, status }) => {
      await queryClient.cancelQueries(['tickets']);

      const previousTickets = queryClient.getQueryData(['tickets']);

      queryClient.setQueryData(['tickets'], (old) =>
        old.map(t => t.id === ticketId ? { ...t, status } : t)
      );

      return { previousTickets };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tickets'], context.previousTickets);
    },

    // Refetch on success
    onSettled: () => {
      queryClient.invalidateQueries(['tickets']);
    },
  });
}
```

### 2.3 Code Splitting

```typescript
// apps/web/app/(authenticated)/tickets/page.tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const TicketChart = dynamic(() => import('@/components/tickets/TicketChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false
});
```

### 2.4 Skeleton Loading States

```typescript
// apps/web/components/tickets/TicketListSkeleton.tsx
export function TicketListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded">
          <Skeleton className="h-4 w-16" /> {/* ID */}
          <Skeleton className="h-4 w-64" /> {/* Title */}
          <Skeleton className="h-4 w-20" /> {/* Status */}
          <Skeleton className="h-8 w-8 rounded-full" /> {/* Avatar */}
        </div>
      ))}
    </div>
  );
}
```

### Files to Create/Modify

- `apps/web/lib/query-client.ts` (new) - React Query setup
- `apps/web/app/providers.tsx` - Add QueryClientProvider
- `apps/web/hooks/useTickets.ts` - Convert to React Query
- `apps/web/hooks/useTicketMutation.ts` (new) - Optimistic mutations
- `apps/web/components/*/Skeleton.tsx` - Loading states
- `package.json` - Add @tanstack/react-query

---

## Feature 3: Edge Deployment

**Estimated Effort**: 2 days

### 3.1 Edge Runtime for Read APIs

```typescript
// apps/web/app/api/tickets/route.ts
export const runtime = 'edge';
export const preferredRegion = 'auto';

export async function GET(request: Request) {
  // Edge-compatible code only
  // No Prisma (use HTTP to separate backend, or PlanetScale/Neon edge)
}
```

**Note**: Full Edge migration requires database that supports Edge (PlanetScale, Neon, Turso). For now, focus on:
- Static asset CDN caching
- ISR with lower revalidation times
- API response caching

### 3.2 Stale-While-Revalidate

```typescript
// apps/web/app/api/tickets/route.ts
export async function GET() {
  const tickets = await getTickets();

  return NextResponse.json(tickets, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
    },
  });
}
```

### 3.3 Performance Monitoring

```typescript
// apps/web/lib/performance.ts
export function measureApiLatency(
  endpoint: string,
  startTime: number
) {
  const duration = Date.now() - startTime;

  // Log slow requests
  if (duration > 100) {
    console.warn(`[SLOW API] ${endpoint}: ${duration}ms`);
  }

  // Send to analytics (future: Vercel Analytics, Datadog, etc.)
  trackMetric('api_latency', duration, { endpoint });
}
```

### Files to Create/Modify

- `apps/web/next.config.js` - Configure caching headers
- `apps/web/app/api/*/route.ts` - Add Cache-Control headers
- `apps/web/lib/performance.ts` (new) - Monitoring utilities

---

## Performance Benchmarks

### Current Baseline (Measure First!)

```bash
# Measure current API latencies
curl -w "@curl-format.txt" -o /dev/null -s "http://192.168.1.15:3000/api/tickets"

# curl-format.txt
time_namelookup:  %{time_namelookup}s\n
time_connect:     %{time_connect}s\n
time_appconnect:  %{time_appconnect}s\n
time_pretransfer: %{time_pretransfer}s\n
time_redirect:    %{time_redirect}s\n
time_starttransfer: %{time_starttransfer}s\n
time_total:       %{time_total}s\n
```

### Target Metrics

| Metric | Current | Target | Linear |
|--------|---------|--------|--------|
| API P50 | ~300ms? | <100ms | <50ms |
| API P95 | ~800ms? | <200ms | <100ms |
| LCP | ~2.5s? | <1.5s | <1s |
| FID | ~100ms? | <50ms | <20ms |
| CLS | ~0.1? | <0.1 | <0.05 |

---

## Implementation Order

### Day 1-2: Measurement & Database
1. Set up performance monitoring
2. Measure current baselines
3. Add database indexes
4. Run EXPLAIN ANALYZE on slow queries

### Day 3-4: Caching
1. Set up Redis (Upstash or local)
2. Implement caching layer
3. Add cache invalidation
4. Measure improvements

### Day 5-6: Frontend
1. Add React Query
2. Implement optimistic updates
3. Add skeleton loading states
4. Code split heavy components

### Day 7-8: Polish & Monitor
1. Add Cache-Control headers
2. Set up Web Vitals monitoring
3. Performance testing under load
4. Document results

---

## Success Criteria

- [ ] Redis caching operational
- [ ] API response times <100ms (P50), <200ms (P95)
- [ ] Frontend LCP <1.5s
- [ ] Optimistic UI updates for ticket actions
- [ ] Web Vitals scores: LCP green, FID green, CLS green
- [ ] No N+1 queries in hot paths
- [ ] Skeleton loading states for all lists

---

## Dependencies

- Redis instance (Upstash recommended for serverless)
- @tanstack/react-query package
- Performance monitoring setup

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Cache invalidation bugs | Aggressive invalidation, short TTLs initially |
| Edge runtime limitations | Keep complex logic in Node runtime |
| Database bottleneck | Index analysis, connection pooling |
| Optimistic update conflicts | Proper rollback handling |
