---
name: Systematic Debugging (DevHub Web)
description: Methodical troubleshooting for Next.js 14, React, API routes, and PostgreSQL/Prisma
category: debugging
version: 1.0
project: Moksha DevHub (AI_HUB)
---

# Systematic Debugging for Moksha DevHub

## Overview

This skill provides a structured approach to debugging full-stack web applications built with Next.js 14, PostgreSQL, and Prisma, with emphasis on:
- Server/Client Component boundaries
- API Route debugging
- Database query issues (Prisma)
- Hydration mismatches
- State management problems
- Build and runtime errors

## Core Principles

### 1. **Never Guess - Always Verify**
- Use `console.log` strategically (remove before commit)
- Check browser DevTools (Network, Console, React DevTools)
- Use Next.js built-in debugging (`DEBUG=* npm run dev`)
- Verify database state with Prisma Studio

### 2. **Isolate the Layer**
- Determine which tier is failing: Frontend (React) → API (Next.js) → Database (Prisma/PostgreSQL)
- Check if it's a Server Component or Client Component issue
- Verify if the problem is client-side or server-side

### 3. **Follow the Data Flow**
- User Action → Event Handler → API Call/Server Action → Database Query → Response → UI Update
- Trace each step to find where data gets corrupted or lost

### 4. **Check Common Next.js Pitfalls**
- Hydration mismatches (server HTML !== client HTML)
- Client Component trying to use server-only code
- Missing 'use client' directive
- Async component not awaited
- Environment variables not properly prefixed

## Debugging Workflow

### Phase 1: Reproduce & Capture

1. **Minimal Repro**
   - Identify exact steps to trigger the bug
   - Note browser, environment (dev/prod), and user state
   - Check if issue is consistent or intermittent

2. **Gather Information**
   ```bash
   # Check Next.js logs
   npm run dev
   # Output shows router, API route calls, errors

   # Check browser console
   # Open DevTools (F12) → Console tab

   # Check network requests
   # DevTools → Network tab → Look for failed requests

   # Check database state
   npx prisma studio
   # View actual data in database
   ```

3. **Common Error Patterns**

   **Hydration Mismatch:**
   ```
   Error: Hydration failed because the initial UI does not match what was rendered on the server.
   ```
   **Cause**: Server-rendered HTML differs from client-rendered HTML
   **Fix**: Ensure server and client render the same content

   **Server Component Error:**
   ```
   Error: You're importing a component that needs useState. It only works in a Client Component but none of its parents are marked with "use client"
   ```
   **Cause**: Using client-side hooks in Server Component
   **Fix**: Add 'use client' at top of file

   **API Route Error:**
   ```
   Error: API resolved without sending a response
   ```
   **Cause**: Async handler not properly returning Response
   **Fix**: Ensure all code paths return `Response.json(...)`

   **Prisma Error:**
   ```
   Error: Invalid prisma.issue.findUnique() invocation: An operation failed because it depends on one or more records that were required but not found. Record to update not found.
   ```
   **Cause**: Trying to update/delete non-existent record
   **Fix**: Check if record exists before operating on it

### Phase 2: Narrow the Scope

**Question 1: Which layer is failing?**

```typescript
// Frontend issue? Check component logic
'use client';
export function IssueList() {
  const { data, error } = useSWR('/api/issues', fetcher);

  console.log('🔍 SWR data:', data); // DEBUG: Check if API returns data
  console.log('🔍 SWR error:', error); // DEBUG: Check for fetch errors

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return <div>{data.map(...)}</div>;
}
```

```typescript
// API issue? Check route handler
// app/api/issues/route.ts
export async function GET(request: Request) {
  console.log('🔍 API route called'); // DEBUG: Verify route is hit

  try {
    const issues = await prisma.issue.findMany();
    console.log('🔍 Found issues:', issues.length); // DEBUG: Check query result

    return Response.json(issues);
  } catch (error) {
    console.error('🔍 Database error:', error); // DEBUG: Check for query errors
    return Response.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}
```

```typescript
// Database issue? Check Prisma query
const issues = await prisma.issue.findMany({
  where: { status: 'open' },
  include: { comments: true },
});

// Check generated SQL
console.log('🔍 Prisma query:', prisma.issue.findMany);

// Run query directly in PostgreSQL
// Connect to database:
// docker exec -it moksha-db psql -U moksha -d moksha_devhub
// Run: SELECT * FROM issues WHERE status = 'open';
```

**Question 2: Is this a Server/Client Component issue?**

```typescript
// ❌ WRONG: Using hooks in Server Component
export default async function IssuesPage() {
  const [filter, setFilter] = useState('all'); // Error: can't use useState
  const issues = await prisma.issue.findMany();
  return <IssueList issues={issues} />;
}

// ✅ RIGHT: Separate Server and Client concerns
export default async function IssuesPage() {
  const issues = await prisma.issue.findMany(); // Server Component
  return <IssueListClient issues={issues} />; // Client Component handles UI
}

// components/IssueListClient.tsx
'use client';
export function IssueListClient({ issues }) {
  const [filter, setFilter] = useState('all'); // Now OK
  return <div>...</div>;
}
```

**Question 3: Is this a hydration mismatch?**

```typescript
// ❌ WRONG: Different content on server vs client
export function CurrentTime() {
  return <div>{new Date().toString()}</div>;
  // Server renders one time, client hydrates with different time → Mismatch!
}

// ✅ RIGHT: Use client-side rendering for dynamic content
'use client';
export function CurrentTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(new Date().toString());
  }, []);

  if (!time) return <div>Loading...</div>; // Server renders this
  return <div>{time}</div>; // Client renders actual time
}
```

### Phase 3: Root Cause Analysis

**For API Bugs:**
1. Start at symptom (e.g., "Issue creation fails")
2. Trace backward:
   - Frontend: Did the API call get made? Check Network tab
   - API: Did the route handler receive the request? Add console.log
   - Validation: Did Zod validation pass? Check error response
   - Database: Did Prisma query succeed? Check Prisma Studio

**For Database Bugs:**
1. Verify schema is correct
   ```bash
   npx prisma studio # Visual database inspection
   npx prisma validate # Check schema syntax
   ```

2. Check query logic
   ```typescript
   // Add logging to see generated queries
   const prisma = new PrismaClient({
     log: ['query', 'error', 'warn'],
   });

   // This will log all SQL queries to console
   ```

3. Test query in PostgreSQL directly
   ```sql
   -- Connect to database
   docker exec -it moksha-db psql -U moksha -d moksha_devhub

   -- Test query
   SELECT * FROM issues WHERE id = 1;

   -- Check indexes
   \d issues

   -- Explain query performance
   EXPLAIN ANALYZE SELECT * FROM issues WHERE status = 'open';
   ```

**For Frontend Bugs:**
1. Check React DevTools
   - Components tab: Inspect component props/state
   - Profiler tab: Find performance bottlenecks

2. Check state management
   ```typescript
   'use client';
   export function IssueForm() {
     const [title, setTitle] = useState('');

     // DEBUG: Log state changes
     useEffect(() => {
       console.log('🔍 Title changed:', title);
     }, [title]);

     return <input value={title} onChange={(e) => setTitle(e.target.value)} />;
   }
   ```

3. Check data fetching
   ```typescript
   'use client';
   export function IssueList() {
     const { data, error, isLoading } = useSWR('/api/issues', fetcher);

     // DEBUG: Log all states
     console.log('🔍 Loading:', isLoading);
     console.log('🔍 Error:', error);
     console.log('🔍 Data:', data);

     return <div>...</div>;
   }
   ```

## Debugging Tools Reference

### Browser DevTools
- **Console**: `console.log`, `console.error`, `console.table` for data
- **Network**: Check API calls, status codes, response bodies
- **React DevTools**: Inspect component tree, props, state
- **Performance**: Profile render performance
- **Lighthouse**: Check Core Web Vitals

### Next.js Debugging
```bash
# Debug mode with verbose logging
DEBUG=* npm run dev

# Check production build
npm run build
npm run start

# Analyze bundle size
npm run build -- --analyze
```

### Prisma Debugging
```bash
# Visual database inspection
npx prisma studio

# Validate schema
npx prisma validate

# Check migrations
npx prisma migrate status

# Generate client (after schema changes)
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Docker Debugging
```bash
# Check running containers
docker ps

# Check logs
docker logs moksha-db
docker logs moksha-web

# Connect to database
docker exec -it moksha-db psql -U moksha -d moksha_devhub

# Restart services
docker-compose restart web
```

## Common Bug Patterns & Solutions

### 1. "Cannot read property 'X' of undefined"
**Cause**: Trying to access property on null/undefined object
**Debug**: Add null checks and optional chaining
```typescript
// ❌ WRONG
const title = issue.title;

// ✅ RIGHT
const title = issue?.title ?? 'Untitled';
```

### 2. "Expected server HTML to contain matching..."
**Cause**: Hydration mismatch
**Solution**: Ensure server and client render identical HTML, or use `suppressHydrationWarning`

### 3. "Cannot read property 'PrismaClient' of undefined"
**Cause**: Prisma Client not generated or import issue
**Solution**: Run `npx prisma generate`

### 4. "API resolved without sending a response"
**Cause**: Missing `return` statement in API route
**Solution**: Ensure all code paths return a Response

### 5. "Module not found: Can't resolve '@/...'"
**Cause**: TypeScript path alias not configured
**Solution**: Check `tsconfig.json` has correct paths

## Success Criteria

Debugging is complete when:
- [ ] Bug is consistently reproducible
- [ ] Root cause is identified (not just symptoms)
- [ ] Fix is implemented and tested
- [ ] Similar bugs are prevented (add validation, types, tests)
- [ ] Debug logs and console.logs are removed
- [ ] Documentation is updated if architectural issue

## Integration with Agents

This skill is used by:
- **devhub-fullstack** - When implementing features and encountering bugs
- **devhub-testing** - When writing tests to reproduce bugs
- **devhub-auditor** - When reviewing code for potential issues

Pair this skill with:
- **root-cause-tracing-fullstack** - For complex multi-layer bugs
- **test-driven-development-web** - To add regression tests
- **verification-before-completion** - To prevent bugs before commit
