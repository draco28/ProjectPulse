---
name: Root Cause Tracing (DevHub Fullstack)
description: Trace bugs backward through the full stack (UI → API → Database) to find the origin point
category: debugging
version: 1.0
project: Moksha DevHub (AI_HUB)
---

# Root Cause Tracing for Moksha DevHub

## Overview

This skill provides a systematic approach to tracing bugs from symptom to source across the full stack. When you see wrong data in the UI, this skill helps you trace backwards through React → Next.js API → Prisma → PostgreSQL to find where it went wrong.

## Core Principles

### 1. **Start at the Symptom, Work Backwards**
- Don't fix symptoms, find the root cause
- Each layer can hide the real problem
- The bug is usually earlier in the chain than you think

### 2. **Verify Assumptions at Each Layer**
- Don't assume data is correct
- Log and inspect at every boundary
- Database → API → Frontend (work backwards)

### 3. **Understand Data Flow**
```
User Action → React Event Handler
            → API Call (fetch/axios)
            → Next.js API Route
            → Validation (Zod)
            → Prisma Query
            → PostgreSQL Database
            → Prisma Response
            → API Response
            → React State Update
            → UI Re-render
```

### 4. **Common Failure Points**
- Data transformation errors (API <→ Frontend)
- Query logic errors (Prisma)
- Schema mismatches (Database)
- Validation failures (Zod)
- State management bugs (React)

## Tracing Workflow

### Step 1: Observe the Symptom

**Example Symptom**: "Issue list shows wrong priority colors"

Document exactly what you see:
- Expected: High priority issues should show red badge
- Actual: All issues show gray badge
- Context: On `/issues` page after fresh load

### Step 2: Trace from UI Layer

**Check React Component:**
```typescript
// components/issues/IssueCard.tsx
'use client';

export function IssueCard({ issue }: { issue: Issue }) {
  console.log('🔍 [UI Layer] Issue data:', issue);
  console.log('🔍 [UI Layer] Priority value:', issue.priority);
  console.log('🔍 [UI Layer] Priority type:', typeof issue.priority);

  const priorityColor = {
    low: 'bg-gray-400',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
    critical: 'bg-red-700',
  }[issue.priority] || 'bg-gray-300'; // Default gray if not found

  return (
    <div className={priorityColor}>
      {issue.title}
    </div>
  );
}
```

**Questions to ask:**
- Is `issue.priority` defined?
- Is it the expected type (string)?
- Is it one of the expected values ('low', 'medium', 'high', 'critical')?
- Does the color mapping work correctly?

### Step 3: Trace to Data Fetching Layer

**Check Server Component or SWR:**

```typescript
// app/(dashboard)/issues/page.tsx (Server Component)
export default async function IssuesPage() {
  const issues = await prisma.issue.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log('🔍 [Data Fetch Layer] Fetched issues:', issues.length);
  console.log('🔍 [Data Fetch Layer] First issue:', issues[0]);
  console.log('🔍 [Data Fetch Layer] First issue priority:', issues[0]?.priority);

  return <IssueList issues={issues} />;
}
```

OR if using Client Component with API:

```typescript
// components/IssueList.tsx
'use client';

export function IssueList() {
  const { data: issues } = useSWR('/api/issues', fetcher);

  console.log('🔍 [Client Fetch Layer] API response:', issues);
  console.log('🔍 [Client Fetch Layer] First issue:', issues?.[0]);

  return <div>{issues?.map(issue => <IssueCard key={issue.id} issue={issue} />)}</div>;
}
```

**Questions to ask:**
- Does the API return data?
- Is `priority` field present in the response?
- Is the value correct?

### Step 4: Trace to API Layer

**Check API Route:**

```typescript
// app/api/issues/route.ts
export async function GET(request: Request) {
  console.log('🔍 [API Layer] GET /api/issues called');

  try {
    const issues = await prisma.issue.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log('🔍 [API Layer] Prisma returned:', issues.length, 'issues');
    console.log('🔍 [API Layer] First issue from Prisma:', issues[0]);
    console.log('🔍 [API Layer] First issue priority:', issues[0]?.priority);

    // Check if we're transforming the data
    const transformed = issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      status: issue.status,
      // ⚠️ BUG? Are we forgetting to include priority?
    }));

    console.log('🔍 [API Layer] Transformed data:', transformed[0]);

    return Response.json(issues); // Or transformed?
  } catch (error) {
    console.error('🔍 [API Layer] Error:', error);
    return Response.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
```

**Questions to ask:**
- Is Prisma query returning the correct data?
- Are we transforming/mapping the data?
- Are we accidentally omitting fields?
- Is the response JSON structure correct?

### Step 5: Trace to Database Layer

**Check Prisma Query:**

```typescript
// Check what Prisma is actually querying
const prisma = new PrismaClient({
  log: ['query'], // Enable query logging
});

const issues = await prisma.issue.findMany({
  orderBy: { createdAt: 'desc' },
});

// This will log the SQL:
// SELECT id, title, status, priority, created_at FROM issues ORDER BY created_at DESC
```

**Check Prisma Schema:**
```prisma
// prisma/schema.prisma
model Issue {
  id          Int      @id @default(autoincrement())
  title       String
  status      String
  priority    String   // ⚠️ Is this field defined?
  // ... other fields
}
```

**Questions to ask:**
- Does the `priority` field exist in the schema?
- Is it the correct type?
- Did we run migrations after adding it?

### Step 6: Trace to PostgreSQL

**Check Database Directly:**

```sql
-- Connect to database
docker exec -it moksha-db psql -U moksha -d moksha_devhub

-- Check if column exists
\d issues

-- Check actual data
SELECT id, title, status, priority FROM issues LIMIT 5;

-- Check for NULL values
SELECT COUNT(*) FROM issues WHERE priority IS NULL;

-- Check distinct values
SELECT DISTINCT priority FROM issues;
```

**Questions to ask:**
- Does the `priority` column exist?
- Is it the correct data type (VARCHAR)?
- Does it have data (not NULL)?
- Are the values what we expect ('low', 'medium', 'high', 'critical')?

## Real-World Example: Tracing "Issue Search Returns Wrong Results"

### Symptom
Search for "authentication bug" returns 0 results, but we know this issue exists.

### Trace Backwards:

**Step 1: Check UI Search Component**
```typescript
'use client';
export function SearchBar() {
  const [query, setQuery] = useState('');

  const handleSearch = async () => {
    console.log('🔍 [UI] Search query:', query);

    const response = await fetch(`/api/search?q=${query}`);
    const results = await response.json();

    console.log('🔍 [UI] Search results:', results);
  };

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```
✅ Query is correct: "authentication bug"

**Step 2: Check API Route**
```typescript
// app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  console.log('🔍 [API] Received query:', query);

  const results = await prisma.issue.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
  });

  console.log('🔍 [API] Found results:', results.length);

  return Response.json(results);
}
```
✅ Query received: "authentication bug"
❌ **PROBLEM FOUND**: `contains` is case-sensitive in PostgreSQL!

**Root Cause**: Prisma `contains` translates to SQL `LIKE '%query%'` which is case-sensitive.

**Solution**: Use case-insensitive search or full-text search
```typescript
// Option 1: Case-insensitive contains
where: {
  OR: [
    { title: { contains: query, mode: 'insensitive' } },
    { description: { contains: query, mode: 'insensitive' } },
  ],
}

// Option 2: Full-text search (better for DevHub)
where: {
  search_vector: {
    search: query,
  },
}
```

## Common Root Causes by Layer

### UI Layer Root Causes
- State not updating (useState, useEffect dependencies)
- Wrong prop passed to component
- Conditional rendering hiding data
- CSS hiding elements (not actually data issue)

### API Layer Root Causes
- Data transformation errors (mapping, filtering)
- Missing fields in response
- Incorrect HTTP status codes
- Async issues (not awaiting promises)

### Database Layer Root Causes
- Wrong query logic (WHERE clause)
- Missing relations (include/select)
- Schema mismatch (field doesn't exist)
- Data type mismatch (string vs number)
- Missing indexes (performance, not correctness)

### Data Layer Root Causes
- Incorrect seed data
- Migration not run
- Database not in expected state
- Foreign key constraints violated

## Debugging Pattern: The "Binary Search" Approach

When tracing a bug, use binary search to narrow down quickly:

1. **Check Middle Layer First** (API Route)
   - If API returns correct data → Bug is in Frontend
   - If API returns wrong data → Bug is in Backend

2. **Narrow Down Backend** (if API wrong)
   - Add console.log right after Prisma query
   - If Prisma returns correct data → Bug is in API transformation
   - If Prisma returns wrong data → Bug is in Query or Database

3. **Narrow Down Frontend** (if API correct)
   - Check data fetching (SWR/fetch)
   - If fetch has correct data → Bug is in Component
   - If fetch has wrong data → Bug is in Fetch Logic

## Tracing Tools

### Console Logging Strategy
```typescript
// Use emoji prefixes to identify layer
console.log('🔍 [UI Layer]', ...);
console.log('🔍 [API Layer]', ...);
console.log('🔍 [Database Layer]', ...);

// Use different log levels
console.log('ℹ️ Info:', ...);
console.warn('⚠️ Warning:', ...);
console.error('❌ Error:', ...);

// Use console.table for data
console.table(issues);
```

### React DevTools
- **Components Tab**: Check props and state
- **Profiler Tab**: Find slow renders

### Browser Network Tab
- Check request URL, headers, status code
- Check response body
- Check request/response timing

### Prisma Studio
```bash
npx prisma studio
```
Visual database inspection to verify data

### PostgreSQL CLI
```bash
docker exec -it moksha-db psql -U moksha -d moksha_devhub

\d tablename          -- Describe table schema
SELECT * FROM ...;    -- Query data
\x                    -- Toggle expanded display
```

## Success Criteria

Root cause is found when:
- [ ] You can pinpoint the exact line of code causing the issue
- [ ] You understand WHY it's wrong (not just that it is)
- [ ] You can fix it and verify the fix works
- [ ] You can explain the bug to someone else clearly
- [ ] You've added a test to prevent regression

## Integration with Agents

This skill is used by:
- **devhub-fullstack** - When implementing features with data flow bugs
- **devhub-testing** - To understand bugs before writing tests
- **devhub-auditor** - To identify architectural issues causing bugs

Pair this skill with:
- **systematic-debugging-web** - Start with systematic approach, use this for deep tracing
- **test-driven-development-web** - Add regression tests after finding root cause
- **api-design-patterns** - Improve API design to prevent similar bugs

## Remember

The bug is usually NOT where you first look. Trace systematically, verify at each layer, and follow the data flow. The root cause is often earlier in the chain than the symptom suggests.
