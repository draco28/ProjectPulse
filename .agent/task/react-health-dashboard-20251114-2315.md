# React Implementation Plan: Health Dashboard UI

**Created**: 2025-11-14 23:15
**Type**: Multi-Component Feature
**Complexity**: Medium-High (6 components, filters, pagination)

---

## Component Architecture

### Component Tree

```
health/page.tsx (Server Component)
├── HealthOverviewCard (Client) - Score meter with animation
│   └── (Reuses SecurityScoreMeter pattern)
├── CategoryBreakdown (Server) - Static horizontal bars
│   └── CategoryBar (Server) - Individual category bar
├── TrendGraph (Client) - Recharts line chart with interactivity
├── FindingsSection (Server) - Container for findings
    ├── HealthFilter (Client) - 3 dropdowns for filtering
    └── FindingsTable (Client) - Paginated table with expansion
        └── FindingRow (Client) - Expandable finding card
```

### Data Flow

```
API Route (/api/projects/[id]/health)
  ↓
  Returns: {
    latestScore: { overall, security, quality, accessibility, performance, grade, trend },
    historicalScores: Array<{ date, score }>,
    findings: Array<{ id, category, severity, message, filePath, lineNumber, scannerType, codeSnippet }>
  }
  ↓
health/page.tsx (fetches data)
  ↓
  Props → HealthOverviewCard (latestScore + trend)
  Props → CategoryBreakdown (latestScore.security/quality/accessibility/performance)
  Props → TrendGraph (historicalScores)
  Props → FindingsSection (findings) → HealthFilter + FindingsTable
```

---

## Critical Architectural Decisions

### 1. Server vs Client Components

**Server Components** (No interactivity needed):
- `health/page.tsx` - Main page (async data fetching)
- `CategoryBreakdown` - Static progress bars
- `CategoryBar` - Individual bar (no animation needed)
- `FindingsSection` - Container wrapper

**Client Components** (Interactivity required):
- `HealthOverviewCard` - Score animation (reuses SecurityScoreMeter)
- `TrendGraph` - Recharts requires client-side rendering
- `HealthFilter` - Dropdown state management
- `FindingsTable` - Pagination state + filter state
- `FindingRow` - Expandable code snippet (local state)

**Rationale**: Follow Next.js App Router best practices - keep components Server by default, only mark Client when needed for interactivity.

### 2. State Management Strategy

**Filter State**: Managed at page level via URL searchParams (Next.js pattern)
- ✅ Shareable URLs
- ✅ Back button works
- ✅ Server-side filtering
- ❌ Requires page refresh on filter change

**Implementation**:
```typescript
// health/page.tsx (Server Component)
interface PageProps {
  searchParams: {
    category?: string;
    severity?: string;
    scanner?: string;
    page?: string;
  };
}

export default async function HealthPage({ searchParams }: PageProps) {
  const findings = await getFilteredFindings(searchParams);
  // Pass findings to FindingsTable
}
```

**Pagination State**: Also URL-based (same pattern as Security page)
- Current page: `?page=2`
- Filter + pagination: `?category=SECURITY&page=2`

**Expansion State**: Local component state (FindingRow)
- Each FindingRow manages its own `isExpanded` state
- No need to lift - independent toggles
- Pattern:
  ```typescript
  const [isExpanded, setIsExpanded] = useState(false);
  ```

**Chart Interaction State**: Local to TrendGraph
- Tooltip hover state managed by Recharts
- No need for external state

### 3. Component Hierarchy for Filters

**Architecture Decision**: HealthFilter as SIBLING to FindingsTable

```
FindingsSection (Server)
├── HealthFilter (Client) - Uses next/navigation for URL updates
└── FindingsTable (Server) - Receives filtered data as props
```

**Why NOT parent-child?**
- Filter changes trigger page navigation (URL updates)
- Server Component re-fetches with new searchParams
- Clean separation of concerns

**HealthFilter Implementation**:
```typescript
'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export function HealthFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`/health?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <select onChange={(e) => handleFilterChange('category', e.target.value)}>
        <option value="">All Categories</option>
        <option value="SECURITY">Security</option>
        <option value="QUALITY">Quality</option>
        <option value="ACCESSIBILITY">Accessibility</option>
        <option value="PERFORMANCE">Performance</option>
      </select>
      {/* Similar for severity and scanner */}
    </div>
  );
}
```

---

## Performance Optimization

### Memoization Strategy

**React.memo Required**:
1. ✅ **FindingRow** - Prevent re-render when other rows expand/collapse
   ```typescript
   export const FindingRow = React.memo(function FindingRow({ finding }: Props) {
     // Each row manages own expansion state
   });
   ```

2. ❌ **HealthOverviewCard** - NO MEMO (receives stable props, parent is Server Component)
3. ❌ **CategoryBreakdown** - NO MEMO (Server Component)
4. ❌ **TrendGraph** - NO MEMO (receives stable array reference from Server Component)
5. ❌ **FindingsTable** - NO MEMO (parent is Server Component, data comes from server)

**Why FindingRow needs memo**:
- Multiple rows rendered (50 per page)
- Each row has independent state (isExpanded)
- Prevents cascade re-renders when one row toggles

**Why others DON'T need memo**:
- Server Components can't use React.memo
- Client Components receive stable props from Server Components
- No frequent prop changes that would cause unnecessary re-renders

### Code Splitting

- ✅ **TrendGraph**: Dynamic import with Suspense (recharts is 50KB)
  ```typescript
  // health/page.tsx
  import dynamic from 'next/dynamic';

  const TrendGraph = dynamic(() => import('@/components/health/TrendGraph'), {
    loading: () => <div className="h-64 neu-raised rounded-3xl animate-pulse" />,
    ssr: false, // Recharts doesn't support SSR
  });
  ```

- ❌ **Other components**: No code splitting needed (small bundle size)

### Data Fetching Optimization

**Parallel Queries** (follow Security page pattern):
```typescript
// health/page.tsx
const [latestScore, historicalScores, findings] = await Promise.all([
  getLatestHealthScore(projectId),
  getHistoricalScores(projectId, 30), // Last 30 days
  getFilteredFindings(projectId, searchParams),
]);
```

**Database Query Optimization**:
- Index on `HealthScore.projectId + createdAt` (already exists)
- Index on `HealthFinding.projectId + category + severity` (already exists)
- Limit findings to 50 per page
- Use `select` to only fetch needed fields

---

## TypeScript Type Definitions

### Component Props Interfaces

```typescript
// components/health/HealthOverviewCard.tsx
interface HealthOverviewCardProps {
  score: {
    overall: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  };
  lastScanDate: string; // ISO string
  onRunScan: () => void; // Future: trigger health.runScan MCP tool
}

// components/health/CategoryBreakdown.tsx
interface CategoryBreakdownProps {
  scores: {
    security: number; // 0-100
    quality: number;
    accessibility: number;
    performance: number;
  };
}

// components/health/TrendGraph.tsx
interface TrendGraphProps {
  data: Array<{
    date: string; // ISO string or formatted date
    score: number; // 0-100
  }>;
}

// components/health/FindingRow.tsx
interface FindingRowProps {
  finding: {
    id: number;
    category: 'SECURITY' | 'QUALITY' | 'ACCESSIBILITY' | 'PERFORMANCE';
    severity: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    filePath: string;
    lineNumber: number | null;
    scannerType: 'SEMGREP' | 'ESLINT' | 'AXECORE' | 'LIGHTHOUSE';
    codeSnippet: string | null;
  };
}

// components/health/FindingsTable.tsx
interface FindingsTableProps {
  findings: FindingRowProps['finding'][];
  totalCount: number; // For pagination
  currentPage: number;
}

// components/health/HealthFilter.tsx
interface HealthFilterProps {
  selectedCategory?: string;
  selectedSeverity?: string;
  selectedScanner?: string;
}
```

### API Response Type

```typescript
// app/api/projects/[id]/health/route.ts
interface HealthDashboardResponse {
  latestScore: {
    overall: number;
    security: number;
    quality: number;
    accessibility: number;
    performance: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
    lastScanDate: string;
  };
  historicalScores: Array<{
    date: string;
    score: number;
  }>;
  findings: {
    data: FindingRowProps['finding'][];
    total: number;
    page: number;
    pageSize: number;
  };
}
```

---

## Implementation Steps

### Step 1: Create API Route (240 lines)

**File**: `app/api/projects/[id]/health/route.ts`

**Responsibilities**:
1. Query latest HealthScore with category breakdown
2. Query last 30 days of historical scores (with date filter)
3. Query HealthFindings with filters (category, severity, scanner)
4. Calculate trend (IMPROVING/DECLINING/STABLE based on oldest vs newest in 30-day window)
5. Paginate findings (50 per page)

**Key Logic**:
```typescript
// Trend calculation
const oldestScore = historicalScores[0]?.overall || 0;
const newestScore = latestScore.overall;
const trend = newestScore > oldestScore + 5 ? 'IMPROVING'
            : newestScore < oldestScore - 5 ? 'DECLINING'
            : 'STABLE';

// Prisma query with filters
const findings = await prisma.healthFinding.findMany({
  where: {
    projectId: Number(params.id),
    ...(category && { category }),
    ...(severity && { severity }),
    ...(scannerType && { scannerId: { in: scannerIds } }), // Join via scanner table
  },
  include: {
    scanner: { select: { scannerType: true } },
  },
  orderBy: [
    { severity: 'asc' }, // ERROR first
    { createdAt: 'desc' },
  ],
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

---

### Step 2: Create HealthOverviewCard (200 lines)

**File**: `components/health/HealthOverviewCard.tsx`

**Pattern**: Reuse SecurityScoreMeter for circular progress

**Structure**:
```
┌─────────────────────────────────────┐
│  [Circular Score Meter: 87]         │
│  Grade: A  [↑ IMPROVING]            │
│  Last scan: 2 hours ago             │
│  [Run New Scan] button              │
└─────────────────────────────────────┘
```

**Key Features**:
- Reuse `SecurityScoreMeter` component (change label to "Health Score")
- Grade badge: A (90-100), B (80-89), C (70-79), D (60-69), F (<60)
- Trend indicator: ↑ green (IMPROVING), ↓ red (DECLINING), → gray (STABLE)
- Timestamp formatting: `formatDistanceToNow(new Date(lastScanDate))`
- Button: coral-gradient (follow Security page pattern)

**Implementation**:
```typescript
'use client';
import { SecurityScoreMeter } from '@/components/security/SecurityScoreMeter';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function HealthOverviewCard({ score, lastScanDate, onRunScan }: Props) {
  const trendIcon = score.trend === 'IMPROVING' ? TrendingUp
                  : score.trend === 'DECLINING' ? TrendingDown
                  : Minus;

  const gradeBadgeColor = score.grade === 'A' ? 'bg-green-500/10 text-green-500'
                        : score.grade === 'B' ? 'bg-blue-500/10 text-blue-500'
                        : score.grade === 'C' ? 'bg-yellow-500/10 text-yellow-500'
                        : score.grade === 'D' ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-red-500/10 text-red-500';

  return (
    <div className="neu-raised rounded-3xl p-8">
      <div className="flex items-center justify-between">
        {/* Left: Score Meter */}
        <SecurityScoreMeter score={score.overall} label="Health Score" />

        {/* Right: Grade + Trend + Scan Button */}
        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-4 py-2 text-lg font-bold ${gradeBadgeColor}`}>
              Grade {score.grade}
            </span>
            <TrendIcon className={`h-6 w-6 ${trendColor}`} />
          </div>
          <p className="text-sm text-slate">Last scan: {timeAgo}</p>
          <button onClick={onRunScan} className="coral-gradient rounded-2xl px-6 py-3">
            Run New Scan
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 3: Create CategoryBreakdown (180 lines)

**File**: `components/health/CategoryBreakdown.tsx`

**Pattern**: Server Component with static horizontal bars

**Structure**:
```
┌─────────────────────────────────────┐
│  Security (40%)    [████████░░] 92  │
│  Quality (30%)     [██████░░░░] 76  │
│  Accessibility (20%) [████░░░░░░] 45 │
│  Performance (10%)  [██████░░░░] 68  │
└─────────────────────────────────────┘
```

**Key Features**:
- Each bar shows: Label (weight %), colored progress bar, numeric score
- Color coding:
  - Security: red (#ef4444)
  - Quality: blue (#3b82f6)
  - Accessibility: purple (#a855f7)
  - Performance: green (#10b981)
- Progress bar width: `style={{ width: \`\${score}%\` }}`
- NO animation (Server Component)

**Implementation**:
```typescript
// Server Component (no 'use client')
interface CategoryBarProps {
  label: string;
  weight: number;
  score: number;
  color: string;
}

function CategoryBar({ label, weight, score, color }: CategoryBarProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-40 text-sm text-slate">
        {label} ({weight}%)
      </span>
      <div className="flex-1 h-8 rounded-full bg-black/20 overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-12 text-right text-lg font-bold text-white">
        {score}
      </span>
    </div>
  );
}

export function CategoryBreakdown({ scores }: Props) {
  return (
    <div className="neu-raised rounded-3xl p-8 space-y-4">
      <h3 className="text-xl font-bold text-white mb-6">Category Breakdown</h3>
      <CategoryBar label="Security" weight={40} score={scores.security} color="#ef4444" />
      <CategoryBar label="Quality" weight={30} score={scores.quality} color="#3b82f6" />
      <CategoryBar label="Accessibility" weight={20} score={scores.accessibility} color="#a855f7" />
      <CategoryBar label="Performance" weight={10} score={scores.performance} color="#10b981" />
    </div>
  );
}
```

---

### Step 4: Create TrendGraph (220 lines)

**File**: `components/health/TrendGraph.tsx`

**Pattern**: Client Component using recharts LineChart

**Structure**:
```
┌─────────────────────────────────────┐
│  30-Day Health Trend                │
│   100 ┌───────────────────┐         │
│    80 │     /‾‾‾\          │         │
│    60 │    /     \_        │         │
│    40 │___/         ‾‾\    │         │
│       └───────────────────┘         │
│       Nov 1 ... Nov 14 ... Nov 30   │
└─────────────────────────────────────┘
```

**Key Features**:
- Recharts `LineChart` with `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`
- X-axis: Formatted dates (Nov 1, Nov 15, Nov 30)
- Y-axis: 0-100 scale
- Line color: Coral gradient (#ff6b6b)
- Tooltip: Show exact date + score
- Responsive container

**Implementation**:
```typescript
'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export function TrendGraph({ data }: Props) {
  const formattedData = data.map(item => ({
    date: format(new Date(item.date), 'MMM d'),
    score: item.score,
    fullDate: format(new Date(item.date), 'PPP'), // For tooltip
  }));

  return (
    <div className="neu-raised rounded-3xl p-8">
      <h3 className="text-xl font-bold text-white mb-6">30-Day Health Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)' }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#fff',
            }}
            labelFormatter={(label, payload) => payload[0]?.payload.fullDate}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#ff6b6b"
            strokeWidth={3}
            dot={{ fill: '#ff6b6b', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Dynamic Import in Page** (to avoid SSR issues):
```typescript
// health/page.tsx
const TrendGraph = dynamic(() => import('@/components/health/TrendGraph'), {
  loading: () => <div className="neu-raised rounded-3xl p-8 h-[400px] animate-pulse" />,
  ssr: false,
});
```

---

### Step 5: Create FindingRow (150 lines)

**File**: `components/health/FindingRow.tsx`

**Pattern**: Memoized Client Component with local expansion state

**Structure (Collapsed)**:
```
┌─────────────────────────────────────┐
│ [SECURITY] [ERROR] SEMGREP          │
│ SQL Injection vulnerability         │
│ src/api/users.ts:42                 │
│ [▼ Show Code]                       │
└─────────────────────────────────────┘
```

**Structure (Expanded)**:
```
┌─────────────────────────────────────┐
│ [SECURITY] [ERROR] SEMGREP          │
│ SQL Injection vulnerability         │
│ src/api/users.ts:42                 │
│ [▲ Hide Code]                       │
│ ┌─────────────────────────────────┐ │
│ │ 40: const query = `SELECT *     │ │
│ │ 41:   FROM users WHERE id =     │ │
│ │ 42:   ${userId}`;  // ⚠️         │ │
│ │ 43: return db.query(query);     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Features**:
- Follow VulnerabilityCard pattern (badges, layout)
- Category badge: SECURITY (red), QUALITY (blue), ACCESSIBILITY (purple), PERFORMANCE (green)
- Severity badge: ERROR (red), WARNING (orange), INFO (blue)
- Scanner type displayed: SEMGREP, ESLINT, AXECORE, LIGHTHOUSE
- Code snippet: Expandable via local state
- File path: Monospace font with line number

**Implementation**:
```typescript
'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, FileCode } from 'lucide-react';

export const FindingRow = React.memo(function FindingRow({ finding }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryStyles = {
    SECURITY: { bg: 'bg-red-500/10', text: 'text-red-500' },
    QUALITY: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
    ACCESSIBILITY: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
    PERFORMANCE: { bg: 'bg-green-500/10', text: 'text-green-500' },
  }[finding.category];

  const severityStyles = {
    ERROR: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Critical' },
    WARNING: { bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'Medium' },
    INFO: { bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'Low' },
  }[finding.severity];

  return (
    <div className="neu-raised rounded-3xl p-6">
      {/* Header: Category + Severity + Scanner */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${categoryStyles.bg} ${categoryStyles.text}`}>
          {finding.category}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${severityStyles.bg} ${severityStyles.text}`}>
          {severityStyles.label}
        </span>
        <span className="text-xs text-slate">{finding.scannerType}</span>
      </div>

      {/* Message */}
      <h3 className="text-lg font-bold text-white mb-2">{finding.message}</h3>

      {/* File Path */}
      <div className="flex items-center gap-2 mb-3">
        <FileCode className="h-4 w-4 text-slate" />
        <code className="bg-black/20 px-2 py-1 rounded text-xs font-mono text-slate">
          {finding.filePath}
          {finding.lineNumber && `:${finding.lineNumber}`}
        </code>
      </div>

      {/* Expand/Collapse Button */}
      {finding.codeSnippet && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-coral hover:text-white transition"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isExpanded ? 'Hide Code' : 'Show Code'}
        </button>
      )}

      {/* Code Snippet (Expanded) */}
      {isExpanded && finding.codeSnippet && (
        <div className="mt-4 bg-black/20 rounded-2xl p-4 overflow-x-auto">
          <pre className="text-sm text-slate">
            <code>{finding.codeSnippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
});
```

---

### Step 6: Create HealthFilter (180 lines)

**File**: `components/health/HealthFilter.tsx`

**Pattern**: Client Component using next/navigation

**Structure**:
```
┌─────────────────────────────────────┐
│ Filters:  [All Categories ▼]        │
│           [All Severities ▼]        │
│           [All Scanners ▼]          │
│           [Clear Filters]           │
└─────────────────────────────────────┘
```

**Key Features**:
- 3 dropdowns: Category, Severity, Scanner
- URL-based state (searchParams)
- Clear filters button
- Neumorphic design for dropdowns

**Implementation**:
```typescript
'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export function HealthFilter({
  selectedCategory,
  selectedSeverity,
  selectedScanner,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset pagination
    router.push(`/health?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/health');
  };

  return (
    <div className="neu-raised rounded-3xl p-6">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm font-semibold text-slate">Filters:</span>

        {/* Category Filter */}
        <select
          value={selectedCategory || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="neu-inset rounded-xl px-4 py-2 text-sm text-white bg-transparent"
        >
          <option value="">All Categories</option>
          <option value="SECURITY">Security</option>
          <option value="QUALITY">Quality</option>
          <option value="ACCESSIBILITY">Accessibility</option>
          <option value="PERFORMANCE">Performance</option>
        </select>

        {/* Severity Filter */}
        <select
          value={selectedSeverity || ''}
          onChange={(e) => handleFilterChange('severity', e.target.value)}
          className="neu-inset rounded-xl px-4 py-2 text-sm text-white bg-transparent"
        >
          <option value="">All Severities</option>
          <option value="ERROR">Critical</option>
          <option value="WARNING">Medium</option>
          <option value="INFO">Low</option>
        </select>

        {/* Scanner Filter */}
        <select
          value={selectedScanner || ''}
          onChange={(e) => handleFilterChange('scanner', e.target.value)}
          className="neu-inset rounded-xl px-4 py-2 text-sm text-white bg-transparent"
        >
          <option value="">All Scanners</option>
          <option value="SEMGREP">Semgrep</option>
          <option value="ESLINT">ESLint</option>
          <option value="AXECORE">Axe Core</option>
          <option value="LIGHTHOUSE">Lighthouse</option>
        </select>

        {/* Clear Button */}
        {(selectedCategory || selectedSeverity || selectedScanner) && (
          <button
            onClick={clearFilters}
            className="text-sm text-coral hover:text-white transition"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### Step 7: Create FindingsTable (300 lines)

**File**: `components/health/FindingsTable.tsx`

**Pattern**: Server Component rendering FindingRow components

**Structure**:
```
┌─────────────────────────────────────┐
│ Findings (127 total)                │
│ ┌─────────────────────────────────┐ │
│ │ [FindingRow 1]                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [FindingRow 2]                  │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
│ [Page 1 of 3] [< Previous] [Next >]│
└─────────────────────────────────────┘
```

**Key Features**:
- Render FindingRow for each finding
- Pagination controls (previous/next buttons)
- Total count display
- Empty state (no findings)

**Implementation**:
```typescript
// Server Component (no 'use client')
import Link from 'next/link';
import { FindingRow } from './FindingRow';

export function FindingsTable({ findings, totalCount, currentPage }: Props) {
  const pageSize = 50;
  const totalPages = Math.ceil(totalCount / pageSize);

  if (findings.length === 0) {
    return (
      <div className="neu-raised rounded-3xl p-12 text-center">
        <h3 className="text-xl font-bold text-white mb-2">No Findings</h3>
        <p className="text-slate">All clear! No issues found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">
          Findings ({totalCount} total)
        </h3>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {findings.map((finding) => (
          <FindingRow key={finding.id} finding={finding} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="neu-raised rounded-3xl p-4 flex items-center justify-between">
          <span className="text-sm text-slate">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/health?page=${currentPage - 1}`}
                className="px-4 py-2 rounded-xl bg-black/20 text-white hover:bg-black/30 transition"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/health?page=${currentPage + 1}`}
                className="px-4 py-2 rounded-xl bg-black/20 text-white hover:bg-black/30 transition"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Step 8: Create Main Page (250 lines)

**File**: `app/(dashboard)/health/page.tsx`

**Pattern**: Server Component with async data fetching (follow Security page)

**Layout**:
```
┌─────────────────────────────────────┐
│ Header: "Project Health" + button   │
├─────────────────────────────────────┤
│ ┌───────────────────┐               │
│ │ HealthOverviewCard│               │
│ └───────────────────┘               │
│ ┌─────────┐ ┌─────────────────────┐ │
│ │Category │ │ TrendGraph          │ │
│ │Breakdown│ │                     │ │
│ └─────────┘ └─────────────────────┘ │
│ ┌───────────────────────────────────┐│
│ │ HealthFilter                      ││
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │ FindingsTable                     ││
│ │ ┌─────────────────────────────┐   ││
│ │ │ FindingRow 1                │   ││
│ │ └─────────────────────────────┘   ││
│ │ ...                               ││
│ └───────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Implementation**:
```typescript
import { prisma } from '@/lib/prisma';
import dynamic from 'next/dynamic';
import { Activity } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { HealthOverviewCard } from '@/components/health/HealthOverviewCard';
import { CategoryBreakdown } from '@/components/health/CategoryBreakdown';
import { HealthFilter } from '@/components/health/HealthFilter';
import { FindingsTable } from '@/components/health/FindingsTable';

// Dynamic import TrendGraph (recharts needs client-side)
const TrendGraph = dynamic(() => import('@/components/health/TrendGraph'), {
  loading: () => <div className="neu-raised rounded-3xl p-8 h-[400px] animate-pulse" />,
  ssr: false,
});

interface PageProps {
  searchParams: {
    category?: string;
    severity?: string;
    scanner?: string;
    page?: string;
  };
}

export const dynamic = 'force-dynamic'; // Real-time health data

// Fetch functions (simplified - actual implementation in API route)
async function getLatestHealthScore(projectId: number) {
  const score = await prisma.healthScore.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate grade and trend (logic from API route)
  return {
    overall: score.overallScore,
    security: score.securityScore,
    quality: score.qualityScore,
    accessibility: score.accessibilityScore,
    performance: score.performanceScore,
    grade: calculateGrade(score.overallScore),
    trend: 'STABLE' as const,
    lastScanDate: score.createdAt.toISOString(),
  };
}

async function getHistoricalScores(projectId: number, days: number) {
  const scores = await prisma.healthScore.findMany({
    where: {
      projectId,
      createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true, overallScore: true },
  });

  return scores.map(s => ({ date: s.createdAt.toISOString(), score: s.overallScore }));
}

async function getFilteredFindings(projectId: number, searchParams: PageProps['searchParams']) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 50;

  const where = {
    projectId,
    ...(searchParams.category && { category: searchParams.category }),
    ...(searchParams.severity && { severity: searchParams.severity }),
    // Scanner filter requires join (implement in API route)
  };

  const [findings, total] = await Promise.all([
    prisma.healthFinding.findMany({
      where,
      include: { scanner: { select: { scannerType: true } } },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.healthFinding.count({ where }),
  ]);

  return { findings, total, page };
}

function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export default async function HealthPage({ searchParams }: PageProps) {
  const projectId = 1; // Hardcoded for now

  // Parallel data fetching
  const [latestScore, historicalScores, findingsData] = await Promise.all([
    getLatestHealthScore(projectId),
    getHistoricalScores(projectId, 30),
    getFilteredFindings(projectId, searchParams),
  ]);

  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised rounded-3xl px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Project Health</h2>
                <p className="text-sm text-slate">
                  Overall Score: {latestScore.overall}/100 • Grade: {latestScore.grade}
                </p>
              </div>
              <button className="coral-gradient rounded-2xl px-6 py-3 flex items-center gap-2 font-semibold text-white shadow-lg">
                <Activity className="h-5 w-5" />
                <span>Run Health Scan</span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Overview Card */}
              <HealthOverviewCard
                score={latestScore}
                lastScanDate={latestScore.lastScanDate}
                onRunScan={() => {/* Future: trigger health.runScan */}}
              />

              {/* Category + Trend Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryBreakdown scores={latestScore} />
                <TrendGraph data={historicalScores} />
              </div>

              {/* Findings Section */}
              <HealthFilter
                selectedCategory={searchParams.category}
                selectedSeverity={searchParams.severity}
                selectedScanner={searchParams.scanner}
              />

              <FindingsTable
                findings={findingsData.findings}
                totalCount={findingsData.total}
                currentPage={findingsData.page}
              />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
```

---

## Answers to Your Questions

### 1. Component Hierarchy: FindingsTable vs HealthFilter

**SIBLINGS, not parent-child**

```
FindingsSection (Server)
├── HealthFilter (Client) - Updates URL via router.push()
└── FindingsTable (Server) - Receives filtered data as props
```

**Why**: Filter changes trigger page navigation, causing Server Component to re-fetch with new `searchParams`. Clean separation of concerns.

---

### 2. State Management: Where to Manage Filter State

**Page Level via URL searchParams** (Next.js pattern)

- Filters live in URL: `/health?category=SECURITY&severity=ERROR`
- HealthFilter uses `useRouter()` + `useSearchParams()` to update URL
- Page re-fetches data server-side with new filters
- Benefits: Shareable URLs, back button works, no client state sync

---

### 3. Memoization: Which Components Need React.memo?

**ONLY FindingRow**

- ✅ FindingRow: Prevent re-render when other rows toggle expansion (50 rows per page)
- ❌ Others: Server Components (can't use memo) or receive stable props from Server Components

---

### 4. Client vs Server: Which Components Should Be Client?

**Client Components** (4):
- HealthOverviewCard (score animation)
- TrendGraph (recharts requires client)
- HealthFilter (dropdown state + router navigation)
- FindingRow (expansion state)

**Server Components** (4):
- health/page.tsx (async data fetching)
- CategoryBreakdown (static bars, no animation)
- FindingsTable (container, no state)
- FindingsSection (wrapper, no logic)

---

### 5. Expandable Row: Best Pattern for Code Snippet

**Local state (useState per row)**

```typescript
// FindingRow.tsx
const [isExpanded, setIsExpanded] = useState(false);
```

**Why**:
- Each row is independent
- No need to coordinate with other rows
- Simpler implementation (no parent state lifting)
- Better performance (only re-renders affected row)

---

### 6. Pagination State: Manage in FindingsTable or Page?

**Page Level via URL searchParams** (consistent with filters)

- Pagination in URL: `/health?page=2`
- Server Component re-fetches correct page
- FindingsTable receives paginated data as props
- Benefits: Shareable links, back button works, SSR-friendly

---

## Performance Considerations

### Render Optimization

1. **Server Components**: Use Server Components by default (page, tables, static cards)
2. **React.memo**: Only for FindingRow (prevent cascade re-renders)
3. **Code Splitting**: Dynamic import TrendGraph (recharts is 50KB)
4. **Parallel Queries**: Fetch latest score + historical + findings concurrently

### Database Optimization

1. **Indexes**: Already exist on `projectId + createdAt` and `projectId + category + severity`
2. **Pagination**: Limit to 50 findings per page
3. **Select Fields**: Only fetch needed columns (no full model hydration)
4. **Parallel Queries**: `Promise.all()` for independent queries

### Bundle Size

- TrendGraph: ~50KB (recharts) - Lazy loaded with `dynamic()`
- Other components: <5KB each
- Total JS: ~70KB client-side (acceptable)

---

## Testing Recommendations

### Component Tests

- [ ] **HealthOverviewCard**: Renders score, grade, trend correctly
- [ ] **CategoryBreakdown**: 4 bars display with correct percentages
- [ ] **TrendGraph**: Chart renders with mock data
- [ ] **FindingRow**: Expands/collapses code snippet on click
- [ ] **HealthFilter**: Updates URL on dropdown change
- [ ] **FindingsTable**: Pagination links have correct page numbers

### Integration Tests

- [ ] **Page load**: All components render with real data
- [ ] **Filter changes**: URL updates and findings re-fetch
- [ ] **Pagination**: Next/Previous buttons work correctly
- [ ] **Empty state**: "No findings" message displays when filters return 0 results

### Edge Cases

- [ ] **Score = 0**: Displays correctly (F grade, red meter)
- [ ] **Score = 100**: Displays correctly (A grade, green meter)
- [ ] **No historical data**: Empty chart state
- [ ] **No code snippet**: Hide expand button
- [ ] **1 finding**: Pagination hidden

---

## Next Steps for Parent Agent

### Phase 1: Dependencies (5 min)
1. SSH to Mac mini: `ssh draco@192.168.1.15`
2. Navigate: `cd ~/projects/AI_HUB/apps/web`
3. Install recharts: `pnpm add recharts`
4. Install date-fns (if not already): `pnpm add date-fns`

### Phase 2: API Route (45 min)
1. Create file: `app/api/projects/[id]/health/route.ts`
2. Implement GET endpoint with:
   - Latest HealthScore query
   - Historical scores (30 days)
   - Filtered findings with pagination
   - Trend calculation (IMPROVING/DECLINING/STABLE)
3. Test endpoint: `curl http://192.168.1.15:3000/api/projects/1/health`

### Phase 3: Components (3 hours)
1. Create `components/health/` folder
2. Implement 6 components in order:
   - HealthOverviewCard.tsx (reuse SecurityScoreMeter)
   - CategoryBreakdown.tsx (Server Component)
   - TrendGraph.tsx (Client Component with recharts)
   - FindingRow.tsx (Client Component with React.memo)
   - HealthFilter.tsx (Client Component with router)
   - FindingsTable.tsx (Server Component)

### Phase 4: Main Page (45 min)
1. Create `app/(dashboard)/health/page.tsx`
2. Implement async data fetching (parallel queries)
3. Layout all components with neumorphic design
4. Add dynamic import for TrendGraph

### Phase 5: Navigation (15 min)
1. Edit `components/Sidebar.tsx`
2. Change "Security" → "Health"
3. Update route: `/security` → `/health`
4. Update icon: `Shield` → `Activity`

### Phase 6: Testing (1 hour)
1. TypeScript check: `pnpm type-check`
2. Manual testing at http://192.168.1.15:3000/health
3. Test filters (category, severity, scanner)
4. Test pagination (navigate between pages)
5. Test expansion (click "Show Code" on findings)
6. Verify neumorphic design consistency

---

## Success Criteria Checklist

**Functional**:
- [ ] Page accessible at `/health` with Sidebar link
- [ ] Latest health score displays with correct grade (A-F)
- [ ] Category breakdown shows 4 bars (Security 40%, Quality 30%, A11y 20%, Perf 10%)
- [ ] Trend graph renders historical data (last 30 days)
- [ ] Findings table displays all scanner results
- [ ] Filters work (category, severity, scanner type)
- [ ] Pagination works (50 per page, previous/next buttons)
- [ ] Code snippet expansion works (toggle per row)
- [ ] "Run New Scan" button present (placeholder handler)

**Quality**:
- [ ] TypeScript: 0 errors
- [ ] Neumorphic coral theme maintained (neu-raised, rounded-3xl, coral-gradient)
- [ ] Components follow existing patterns (Security page conventions)
- [ ] Responsive design (grid adjusts on mobile)
- [ ] Performance: <200ms page load (parallel queries)
- [ ] Client-side JS: <100KB (TrendGraph lazy loaded)

---

## File Summary

**To Create** (9 files, ~1,870 lines):
1. `app/api/projects/[id]/health/route.ts` (~240 lines) - API endpoint
2. `app/(dashboard)/health/page.tsx` (~250 lines) - Main page
3. `components/health/HealthOverviewCard.tsx` (~200 lines) - Score card
4. `components/health/CategoryBreakdown.tsx` (~180 lines) - Category bars
5. `components/health/TrendGraph.tsx` (~220 lines) - Recharts line chart
6. `components/health/FindingRow.tsx` (~150 lines) - Expandable finding card
7. `components/health/FindingsTable.tsx` (~300 lines) - Findings list + pagination
8. `components/health/HealthFilter.tsx` (~180 lines) - Filter dropdowns
9. `components/health/index.ts` (~50 lines) - Barrel exports

**To Modify** (1 file):
1. `components/Sidebar.tsx` - Change "Security" link to "Health"

---

## Architectural Insights

### Why This Architecture?

1. **Server-First**: Leverage Next.js App Router for fast initial page loads
2. **Selective Client**: Only 4 components need client-side interactivity
3. **URL-Based State**: Filters and pagination in URL (shareable, SSR-friendly)
4. **Local Expansion**: Each FindingRow manages own state (simple, performant)
5. **Code Splitting**: TrendGraph lazy loaded (recharts only when needed)
6. **Parallel Fetching**: All data queries run concurrently (fast page load)

### Key Trade-Offs

**URL-based filters vs Client state**:
- ✅ Shareable links, back button support, SSR-friendly
- ❌ Requires page refresh on filter change
- Decision: Use URL (align with Security page pattern)

**Local expansion vs Controlled**:
- ✅ Simple implementation, better performance (independent rows)
- ❌ Can't expand all rows programmatically
- Decision: Use local state (no "expand all" requirement)

**Recharts vs Custom D3**:
- ✅ Faster development, built-in responsive + tooltip
- ❌ Larger bundle (50KB)
- Decision: Use recharts (lazy loaded, good UX)

---

**Implementation ready! Parent agent should follow the 6 phases in Next Steps.**

Key recommendations:
- Follow Security page patterns (already proven)
- Use Server Components by default (only 4 need Client)
- Leverage URL searchParams for filters (Next.js best practice)
- Reuse SecurityScoreMeter (same circular progress pattern)
- Memo only FindingRow (prevent cascade re-renders)
