# Next.js Implementation Plan: Health Dashboard Page

**Created**: 2025-11-14 23:15
**Type**: Page + API Route + Components
**Sprint**: Sprint 7 Day 13 (US-119 Health Dashboard UI)
**Deployment**: Mac mini (192.168.1.15:3000)

---

## Architecture Decision

### Rendering Strategy

- [x] **ISR** (Incremental Static Regeneration) - **RECOMMENDED**
- [ ] Static (pre-rendered at build)
- [ ] Dynamic (rendered per request)

**Recommendation**: ISR with 1-hour revalidation because:
- Health data changes infrequently (only on scan runs)
- Most page loads should be <10ms (cache hits)
- Scans triggered manually via "Run New Scan" button (not real-time)
- Similar to wiki page pattern (documentation-style content)
- Balance between freshness and performance

**Alternative**: Dynamic rendering if real-time score updates are critical, but adds latency (150ms vs <10ms)

### Component Strategy

**Server Components**:
- `app/(dashboard)/health/page.tsx` - Main page (data fetching, ISR)
- Container and header sections

**Client Components**:
- `HealthOverviewCard.tsx` - Score display (static, could be Server but uses animation)
- `CategoryBreakdown.tsx` - 4 horizontal bars (static display)
- `TrendGraph.tsx` - Recharts LineChart (requires client-side library)
- `FindingsTable.tsx` - Table with filters and pagination (interactivity)
- `HealthFilter.tsx` - Filter controls (dropdowns, checkboxes)
- `FindingRow.tsx` - Individual finding card (static, could be Server)

**Rationale**:
- **Server Component for main page**: Parallel Prisma queries, ISR caching
- **Client Components for interactivity**: Filters, pagination, graph rendering
- **Pattern**: Hybrid (Server fetches, Client displays with interactivity) - same as wiki/page.tsx
- **Why not all Server**: TrendGraph needs Recharts (client-only library), filters need state

---

## File Structure

```
apps/web/
├── app/
│   ├── (dashboard)/
│   │   └── health/
│   │       ├── page.tsx              # Server Component (ISR)
│   │       └── loading.tsx           # Optional loading UI
│   ├── api/
│   │   └── projects/
│   │       └── [id]/
│   │           └── health/
│   │               └── route.ts      # GET handler (OPTIONAL - see note)
└── components/
    └── health/
        ├── HealthOverviewCard.tsx    # Score meter + grade + trend
        ├── CategoryBreakdown.tsx     # 4 horizontal bars
        ├── TrendGraph.tsx            # Recharts line chart
        ├── FindingsTable.tsx         # Main table with filters
        ├── HealthFilter.tsx          # Filter controls
        └── FindingRow.tsx            # Individual finding card
```

**IMPORTANT NOTE**: API route is **OPTIONAL**. See "API Route vs Direct Prisma" section below.

---

## Implementation Steps

### Step 1: Install Dependencies (Mac mini)

**Rationale**: TrendGraph component needs Recharts library for line chart visualization.

```bash
cd ~/projects/AI_HUB/apps/web
pnpm add recharts
```

**Expected**: Recharts added to package.json, no TypeScript errors.

---

### Step 2: Decision - API Route vs Direct Prisma

**CRITICAL DECISION**: Should page call API route or query Prisma directly?

#### Option A: Direct Prisma (RECOMMENDED)

**Pros**:
- Faster (no HTTP roundtrip)
- Simpler codebase (no duplicate logic)
- Follows Next.js 14 App Router best practices
- Mac mini deployment: All code runs on same server anyway
- Same pattern as wiki/page.tsx (ISR + direct Prisma)

**Cons**:
- Page cannot be used by external clients (but we don't need this)

**Pattern**:
```typescript
// app/(dashboard)/health/page.tsx (Server Component)
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // ISR: 1-hour cache

async function getHealthData(projectId: number) {
  const [latestScore, historicalScores, findings] = await Promise.all([
    // Prisma queries here
  ]);
  return { latestScore, historicalScores, findings, trend };
}

export default async function HealthPage() {
  const data = await getHealthData(1); // Hardcode project ID = 1 for now
  return <HealthUI {...data} />;
}
```

#### Option B: API Route + fetch() (NOT RECOMMENDED)

**Pros**:
- Reusable by other clients (if needed in future)
- Standard REST pattern

**Cons**:
- Slower (HTTP overhead)
- More code to maintain
- Duplicate logic (route + page both need same queries)
- Mac mini: No benefit since everything on same server

**Pattern**:
```typescript
// app/api/projects/[id]/health/route.ts
export async function GET(request, { params }) {
  // Same Prisma queries as Option A
  return NextResponse.json({ data });
}

// app/(dashboard)/health/page.tsx
async function getHealthData() {
  const res = await fetch('http://localhost:3000/api/projects/1/health', {
    cache: 'no-store' // Or next: { revalidate: 3600 }
  });
  return res.json();
}
```

**RECOMMENDATION**: **Option A (Direct Prisma)** for this deployment context.

**Why**: Mac mini runs all services on same machine. No benefit to HTTP layer. Simpler, faster, follows Next.js 14 patterns.

**When to use Option B**: If you need external API access OR if you plan to deploy frontend separately from backend (not the case here).

---

### Step 3: Main Page Component (Server Component with ISR)

**File**: `app/(dashboard)/health/page.tsx`

**Strategy**: Direct Prisma queries with parallel fetching and ISR caching.

```typescript
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { HealthOverviewCard } from '@/components/health/HealthOverviewCard';
import { CategoryBreakdown } from '@/components/health/CategoryBreakdown';
import { TrendGraph } from '@/components/health/TrendGraph';
import { FindingsTable } from '@/components/health/FindingsTable';

// ISR: Revalidate every hour (scans don't run frequently)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Project Health | ProjectPulse',
  description: 'Comprehensive health monitoring dashboard',
};

interface HealthData {
  latestScore: {
    id: number;
    overallScore: number;
    securityScore: number;
    qualityScore: number;
    performanceScore: number;
    accessibilityScore: number;
    calculatedAt: Date;
  } | null;
  historicalScores: Array<{
    overallScore: number;
    calculatedAt: Date;
  }>;
  findings: Array<{
    id: number;
    category: string;
    severity: string;
    ruleId: string;
    message: string;
    filePath: string;
    lineNumber: number | null;
    status: string;
    scanner: {
      name: string;
      type: string;
    };
  }>;
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * Fetch health data for project
 * Parallel queries: Latest score + historical scores + findings
 */
async function getHealthData(projectId: number): Promise<HealthData> {
  // Parallel fetch: 3 queries run simultaneously
  const [latestScore, historicalScores, findings] = await Promise.all([
    // Query 1: Latest health score
    prisma.healthScore.findFirst({
      where: { projectId },
      orderBy: { calculatedAt: 'desc' },
      select: {
        id: true,
        overallScore: true,
        securityScore: true,
        qualityScore: true,
        performanceScore: true,
        accessibilityScore: true,
        calculatedAt: true,
      },
    }),

    // Query 2: Historical scores (last 30 days for trend graph)
    prisma.healthScore.findMany({
      where: {
        projectId,
        calculatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
      orderBy: { calculatedAt: 'asc' },
      select: {
        overallScore: true,
        calculatedAt: true,
      },
    }),

    // Query 3: All findings with scanner info
    prisma.healthFinding.findMany({
      where: {
        scanner: { projectId },
        status: { in: ['OPEN', 'IN_PROGRESS'] }, // Exclude fixed/false positives
      },
      select: {
        id: true,
        category: true,
        severity: true,
        ruleId: true,
        message: true,
        filePath: true,
        lineNumber: true,
        status: true,
        scanner: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: [
        { severity: 'asc' }, // CRITICAL first (enum order)
        { category: 'asc' },
      ],
    }),
  ]);

  // Calculate trend (improving/declining/stable)
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (historicalScores.length >= 2) {
    const oldest = historicalScores[0].overallScore;
    const newest = historicalScores[historicalScores.length - 1].overallScore;
    const diff = newest - oldest;

    if (diff >= 5) trend = 'improving';
    else if (diff <= -5) trend = 'declining';
    else trend = 'stable';
  }

  return {
    latestScore,
    historicalScores,
    findings,
    trend,
  };
}

/**
 * Health Dashboard Page
 * Server Component with ISR (1-hour cache)
 */
export default async function HealthPage() {
  // Hardcode project ID = 1 for now (future: from context/params)
  const projectId = 1;

  const { latestScore, historicalScores, findings, trend } = await getHealthData(projectId);

  // Handle no data case (never scanned)
  if (!latestScore) {
    return (
      <main className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Project Health</h1>
        <div className="neu-raised rounded-3xl p-12 text-center">
          <i className="fas fa-heartbeat mb-4 text-6xl text-slate"></i>
          <h2 className="mb-2 text-xl font-semibold text-white">No Health Data Yet</h2>
          <p className="mb-6 text-slate">Run your first scan to see project health insights.</p>
          <button className="neu-raised rounded-2xl bg-coral px-6 py-3 font-semibold text-white hover:bg-coral/90">
            <i className="fas fa-play mr-2"></i>
            Run First Scan
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Project Health</h1>
          <p className="text-sm text-slate">
            Last updated: {new Date(latestScore.calculatedAt).toLocaleString()}
          </p>
        </div>
        <button className="neu-raised rounded-2xl bg-coral px-6 py-3 font-semibold text-white hover:bg-coral/90">
          <i className="fas fa-sync-alt mr-2"></i>
          Run New Scan
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Overview + Category Breakdown */}
        <div className="space-y-6 lg:col-span-1">
          <HealthOverviewCard score={latestScore.overallScore} trend={trend} />
          <CategoryBreakdown
            securityScore={latestScore.securityScore}
            qualityScore={latestScore.qualityScore}
            performanceScore={latestScore.performanceScore}
            accessibilityScore={latestScore.accessibilityScore}
          />
        </div>

        {/* Right Column: Trend Graph */}
        <div className="lg:col-span-2">
          <TrendGraph data={historicalScores} />
        </div>
      </div>

      {/* Findings Table */}
      <div className="mt-6">
        <FindingsTable findings={findings} />
      </div>
    </main>
  );
}
```

**Key Features**:
- ISR with 1-hour revalidation
- Parallel Prisma queries (3 queries in parallel)
- Trend calculation (compare oldest vs newest score)
- Empty state handling (no scans yet)
- Neumorphic coral theme
- Responsive grid layout
- Hardcoded project ID = 1 (future: from context)

**Performance**:
- First load: ~150ms (Prisma queries)
- Cached load: <10ms (ISR cache hit)
- Parallel queries: 150ms total (vs 450ms sequential)

**Lines**: ~250 lines

---

### Step 4: HealthOverviewCard Component

**File**: `components/health/HealthOverviewCard.tsx`

**Type**: Client Component (for potential future animations)

```typescript
'use client';

import { Activity } from 'lucide-react';

interface HealthOverviewCardProps {
  score: number;
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * Display overall health score with grade badge and trend indicator
 */
export function HealthOverviewCard({ score, trend }: HealthOverviewCardProps) {
  // Calculate grade (A-F scale)
  const getGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Color by score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Trend icon and color
  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return { icon: 'fa-arrow-up', color: 'text-green-400' };
    if (trend === 'declining') return { icon: 'fa-arrow-down', color: 'text-red-400' };
    return { icon: 'fa-minus', color: 'text-slate' };
  };

  const grade = getGrade(score);
  const scoreColor = getScoreColor(score);
  const { icon, color } = getTrendIcon(trend);

  return (
    <div className="neu-raised rounded-3xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-coral" />
        <h2 className="text-sm font-bold uppercase text-white">Overall Health</h2>
      </div>

      {/* Score Display */}
      <div className="mb-4 text-center">
        <div className={`text-6xl font-bold ${scoreColor}`}>{score}</div>
        <div className="mt-2 text-sm text-slate">out of 100</div>
      </div>

      {/* Grade Badge */}
      <div className="mb-4 flex justify-center">
        <div
          className={`neu-pressed flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold ${scoreColor}`}
        >
          {grade}
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <i className={`fas ${icon} ${color}`}></i>
        <span className="capitalize text-white">{trend}</span>
      </div>
    </div>
  );
}
```

**Key Features**:
- Grade calculation (A-F scale)
- Color-coded score display
- Trend indicator with icon
- Neumorphic card design
- Centered layout

**Lines**: ~80 lines

---

### Step 5: CategoryBreakdown Component

**File**: `components/health/CategoryBreakdown.tsx`

**Type**: Client Component (could be Server, but keeping consistent)

```typescript
'use client';

import { Shield, Code, Zap, Eye } from 'lucide-react';

interface CategoryBreakdownProps {
  securityScore: number;
  qualityScore: number;
  performanceScore: number;
  accessibilityScore: number;
}

/**
 * Display 4 category scores with horizontal bars
 * Weights: Security 40%, Quality 30%, Performance 10%, Accessibility 20%
 */
export function CategoryBreakdown({
  securityScore,
  qualityScore,
  performanceScore,
  accessibilityScore,
}: CategoryBreakdownProps) {
  const categories = [
    {
      name: 'Security',
      icon: Shield,
      score: securityScore,
      weight: 40,
      color: 'bg-purple-500',
    },
    {
      name: 'Code Quality',
      icon: Code,
      score: qualityScore,
      weight: 30,
      color: 'bg-blue-500',
    },
    {
      name: 'Accessibility',
      icon: Eye,
      score: accessibilityScore,
      weight: 20,
      color: 'bg-green-500',
    },
    {
      name: 'Performance',
      icon: Zap,
      score: performanceScore,
      weight: 10,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="neu-raised rounded-3xl p-6">
      <h2 className="mb-4 text-sm font-bold uppercase text-white">Category Breakdown</h2>

      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <div key={category.name}>
              {/* Category Header */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate" />
                  <span className="text-sm font-medium text-white">{category.name}</span>
                  <span className="text-xs text-slate">({category.weight}%)</span>
                </div>
                <span className="text-sm font-semibold text-white">{category.score}</span>
              </div>

              {/* Progress Bar */}
              <div className="neu-pressed h-3 overflow-hidden rounded-full">
                <div
                  className={`h-full ${category.color} transition-all duration-500`}
                  style={{ width: `${category.score}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Key Features**:
- 4 horizontal bars (Security, Quality, A11y, Performance)
- Icons from Lucide
- Weight percentages displayed
- Color-coded bars
- Smooth CSS transition animation
- Neumorphic card design

**Lines**: ~95 lines

---

### Step 6: TrendGraph Component (Recharts)

**File**: `components/health/TrendGraph.tsx`

**Type**: Client Component (Recharts is client-only)

```typescript
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface TrendGraphProps {
  data: Array<{
    overallScore: number;
    calculatedAt: Date;
  }>;
}

/**
 * Display 30-day health score trend using Recharts
 */
export function TrendGraph({ data }: TrendGraphProps) {
  // Transform data for Recharts
  const chartData = data.map((item) => ({
    date: format(new Date(item.calculatedAt), 'MMM dd'),
    score: item.overallScore,
    fullDate: new Date(item.calculatedAt).toLocaleDateString(),
  }));

  return (
    <div className="neu-raised rounded-3xl p-6">
      <h2 className="mb-4 text-sm font-bold uppercase text-white">30-Day Trend</h2>

      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-slate">
          <div className="text-center">
            <i className="fas fa-chart-line mb-3 text-4xl"></i>
            <p>Run multiple scans to see trend analysis</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#ffffff',
              }}
              labelStyle={{ color: '#94a3b8' }}
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
      )}

      {/* Stats Summary */}
      {chartData.length > 0 && (
        <div className="mt-4 flex justify-around border-t border-white/10 pt-4">
          <div className="text-center">
            <div className="text-xs text-slate">Highest</div>
            <div className="text-lg font-bold text-green-400">
              {Math.max(...chartData.map((d) => d.score))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate">Lowest</div>
            <div className="text-lg font-bold text-red-400">
              {Math.min(...chartData.map((d) => d.score))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate">Average</div>
            <div className="text-lg font-bold text-white">
              {Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Key Features**:
- Recharts LineChart with coral color
- Date formatting (MMM dd)
- Empty state (no data yet)
- Stats summary (highest, lowest, average)
- Responsive container
- Dark theme styling
- Neumorphic card design

**Dependencies**: `recharts`, `date-fns` (already in project)

**Lines**: ~115 lines

---

### Step 7: FindingsTable Component

**File**: `components/health/FindingsTable.tsx`

**Type**: Client Component (filters, pagination)

```typescript
'use client';

import { useState } from 'react';
import { HealthFilter } from './HealthFilter';
import { FindingRow } from './FindingRow';

interface Finding {
  id: number;
  category: string;
  severity: string;
  ruleId: string;
  message: string;
  filePath: string;
  lineNumber: number | null;
  status: string;
  scanner: {
    name: string;
    type: string;
  };
}

interface FindingsTableProps {
  findings: Finding[];
}

/**
 * Display findings table with filters and pagination
 */
export function FindingsTable({ findings }: FindingsTableProps) {
  const [filters, setFilters] = useState({
    category: 'all',
    severity: 'all',
    scanner: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 50;

  // Filter findings
  const filteredFindings = findings.filter((finding) => {
    if (filters.category !== 'all' && finding.category !== filters.category) return false;
    if (filters.severity !== 'all' && finding.severity !== filters.severity) return false;
    if (filters.scanner !== 'all' && finding.scanner.type !== filters.scanner) return false;
    return true;
  });

  // Paginate findings
  const totalPages = Math.ceil(filteredFindings.length / perPage);
  const paginatedFindings = filteredFindings.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Handle filter change
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  return (
    <div className="neu-raised rounded-3xl p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase text-white">
          Findings ({filteredFindings.length})
        </h2>
        <HealthFilter filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Findings List */}
      {paginatedFindings.length === 0 ? (
        <div className="py-12 text-center">
          <i className="fas fa-check-circle mb-3 text-6xl text-green-400"></i>
          <h3 className="mb-2 text-xl font-semibold text-white">No Findings</h3>
          <p className="text-slate">
            {filteredFindings.length === 0 && findings.length > 0
              ? 'No findings match current filters'
              : 'All clear! No health issues detected.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedFindings.map((finding) => (
            <FindingRow key={finding.id} finding={finding} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="text-sm text-slate">
            Showing {(currentPage - 1) * perPage + 1}-
            {Math.min(currentPage * perPage, filteredFindings.length)} of {filteredFindings.length}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="neu-raised rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current, and neighbors
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis for gaps
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;

                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsis && <span className="text-slate">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-xl px-3 py-1 text-sm font-semibold ${
                          page === currentPage
                            ? 'neu-pressed bg-coral text-white'
                            : 'text-slate hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="neu-raised rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Key Features**:
- Client-side filtering (category, severity, scanner)
- Pagination (50 per page)
- Empty states (no findings, no matches)
- Reset page on filter change
- Smart pagination UI (ellipsis for gaps)
- Findings count display
- Neumorphic card design

**Lines**: ~180 lines

---

### Step 8: HealthFilter Component

**File**: `components/health/HealthFilter.tsx`

**Type**: Client Component (dropdowns)

```typescript
'use client';

import { SlidersHorizontal } from 'lucide-react';

interface HealthFilterProps {
  filters: {
    category: string;
    severity: string;
    scanner: string;
  };
  onFilterChange: (filters: { category: string; severity: string; scanner: string }) => void;
}

/**
 * Filter controls for findings table
 */
export function HealthFilter({ filters, onFilterChange }: HealthFilterProps) {
  const handleChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex items-center gap-3">
      <SlidersHorizontal className="h-4 w-4 text-slate" />

      {/* Category Filter */}
      <select
        value={filters.category}
        onChange={(e) => handleChange('category', e.target.value)}
        className="neu-pressed rounded-xl border-0 bg-transparent px-3 py-2 text-sm text-white focus:ring-2 focus:ring-coral"
      >
        <option value="all">All Categories</option>
        <option value="SECURITY">Security</option>
        <option value="CODE_QUALITY">Code Quality</option>
        <option value="PERFORMANCE">Performance</option>
        <option value="ACCESSIBILITY">Accessibility</option>
      </select>

      {/* Severity Filter */}
      <select
        value={filters.severity}
        onChange={(e) => handleChange('severity', e.target.value)}
        className="neu-pressed rounded-xl border-0 bg-transparent px-3 py-2 text-sm text-white focus:ring-2 focus:ring-coral"
      >
        <option value="all">All Severities</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      {/* Scanner Filter */}
      <select
        value={filters.scanner}
        onChange={(e) => handleChange('scanner', e.target.value)}
        className="neu-pressed rounded-xl border-0 bg-transparent px-3 py-2 text-sm text-white focus:ring-2 focus:ring-coral"
      >
        <option value="all">All Scanners</option>
        <option value="SEMGREP">Semgrep</option>
        <option value="ESLINT">ESLint</option>
        <option value="LIGHTHOUSE">Lighthouse</option>
        <option value="AXECORE">Axe Core</option>
      </select>
    </div>
  );
}
```

**Key Features**:
- 3 dropdown filters (category, severity, scanner)
- Controlled components
- Neumorphic dropdowns
- Focus ring styling
- Icon indicator

**Lines**: ~75 lines

---

### Step 9: FindingRow Component

**File**: `components/health/FindingRow.tsx`

**Type**: Client Component (could be Server, but keeping consistent)

```typescript
'use client';

import { FileCode, AlertTriangle, AlertCircle, Info, Shield, Code, Zap, Eye } from 'lucide-react';

interface FindingRowProps {
  finding: {
    id: number;
    category: string;
    severity: string;
    ruleId: string;
    message: string;
    filePath: string;
    lineNumber: number | null;
    status: string;
    scanner: {
      name: string;
      type: string;
    };
  };
}

/**
 * Display individual finding as card
 */
export function FindingRow({ finding }: FindingRowProps) {
  // Category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return <Shield className="h-4 w-4 text-purple-400" />;
      case 'CODE_QUALITY':
        return <Code className="h-4 w-4 text-blue-400" />;
      case 'PERFORMANCE':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'ACCESSIBILITY':
        return <Eye className="h-4 w-4 text-green-400" />;
      default:
        return <Info className="h-4 w-4 text-slate" />;
    }
  };

  // Severity icon and color
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
        };
      case 'HIGH':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
        };
      case 'MEDIUM':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
        };
      case 'LOW':
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'text-slate',
          bg: 'bg-slate/10',
        };
    }
  };

  const categoryIcon = getCategoryIcon(finding.category);
  const { icon: severityIcon, color, bg } = getSeverityStyle(finding.severity);

  return (
    <div className="neu-pressed smooth-transition group rounded-2xl p-4 hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className="neu-raised flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
          {categoryIcon}
        </div>

        {/* Finding Details */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-white group-hover:text-coral smooth-transition">
                {finding.message}
              </h3>
              <p className="mt-1 text-xs text-slate">
                <FileCode className="mr-1 inline h-3 w-3" />
                {finding.filePath}
                {finding.lineNumber && `:${finding.lineNumber}`}
              </p>
            </div>

            {/* Severity Badge */}
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bg} ${color}`}>
              {severityIcon}
              <span className="capitalize">{finding.severity.toLowerCase()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 text-xs text-slate">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Category:</span>
              <span className="capitalize">{finding.category.toLowerCase().replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Scanner:</span>
              <span>{finding.scanner.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Rule:</span>
              <span className="font-mono">{finding.ruleId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Key Features**:
- Category icons (Shield, Code, Zap, Eye)
- Severity badges with color coding
- File path display with line number
- Rule ID in monospace font
- Scanner name display
- Hover effect (lift + color change)
- Neumorphic card design

**Lines**: ~150 lines

---

### Step 10: Update Sidebar Navigation

**File**: `components/Sidebar.tsx` (modify existing)

**Change**: Update navigation link from "Security" to "Health"

```typescript
// BEFORE
{
  icon: Shield,
  label: 'Security',
  href: '/security',
}

// AFTER
{
  icon: Activity, // Change icon from Shield to Activity
  label: 'Health',
  href: '/health', // Change route from /security to /health
}
```

**Lines**: ~5 lines modified

**Import needed**: Add `Activity` to Lucide imports

---

## Data Fetching Plan

### Where: Server Component (page.tsx)

**Rationale**: Next.js 14 App Router best practice - fetch data in Server Components.

### Method: Direct Prisma Queries

**Rationale**: Mac mini deployment - all code runs on same server, no benefit to HTTP layer.

### Caching: ISR with 1-hour revalidation

```typescript
export const revalidate = 3600; // 1 hour
```

**Rationale**:
- Health scans run infrequently (manual trigger)
- Most users see cached data (<10ms)
- Fresh data every hour (acceptable staleness)
- Balances performance vs freshness

### Query Strategy: Parallel

```typescript
const [latestScore, historicalScores, findings] = await Promise.all([
  prisma.healthScore.findFirst({ /* ... */ }),
  prisma.healthScore.findMany({ /* ... */ }),
  prisma.healthFinding.findMany({ /* ... */ }),
]);
```

**Performance**:
- Sequential: 150ms + 150ms + 150ms = 450ms
- Parallel: max(150ms, 150ms, 150ms) = 150ms
- **Savings**: 66% reduction in latency

---

## Performance Considerations

### Bundle Size

**Impact**: TrendGraph component adds Recharts library

**Mitigation**:
- Recharts is tree-shakeable (only import LineChart, not full library)
- Gzipped size: ~45KB (acceptable for chart functionality)
- Lazy load if needed: `const TrendGraph = dynamic(() => import('./TrendGraph'), { ssr: false })`

**Recommendation**: No lazy loading needed - 45KB is acceptable for core feature.

### Data Fetching

**Strategy**: Parallel fetch on server (3 queries simultaneously)

**Performance**:
- Parallel queries: 150ms total
- ISR cache hit: <10ms
- 99% of requests served from cache

**Optimization**:
- Use `select` to exclude large fields (e.g., `codeSnippet` in findings list)
- Limit historical scores to 30 days (reasonable for trend visualization)

### Caching

**Strategy**: ISR with 1-hour revalidation

**Cache Hit Rate**: Expected 99% (scans run infrequently)

**Trade-offs**:
- Pro: <10ms page load for most users
- Pro: Reduces database load (no query on cache hits)
- Con: Up to 1-hour staleness (acceptable for health monitoring)

**Alternative**: Dynamic rendering if real-time updates critical (not recommended)

---

## Loading/Error States

### Loading State (Suspense Boundary)

**File**: `app/(dashboard)/health/loading.tsx` (optional)

```typescript
export default function HealthLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 h-12 w-64 animate-pulse rounded-lg bg-white/10"></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-3xl bg-white/10"></div>
        <div className="h-64 animate-pulse rounded-3xl bg-white/10 lg:col-span-2"></div>
      </div>
    </div>
  );
}
```

**When shown**: During ISR revalidation or first load

**Recommendation**: OPTIONAL - ISR cache hits are so fast (<10ms) that loading state rarely visible

### Error State (Error Boundary)

**File**: `app/(dashboard)/health/error.tsx` (optional)

```typescript
'use client';

export default function HealthError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto p-6">
      <div className="neu-raised rounded-3xl p-12 text-center">
        <i className="fas fa-exclamation-triangle mb-4 text-6xl text-red-400"></i>
        <h2 className="mb-2 text-xl font-semibold text-white">Failed to Load Health Data</h2>
        <p className="mb-6 text-slate">{error.message}</p>
        <button onClick={reset} className="neu-raised rounded-2xl bg-coral px-6 py-3 font-semibold text-white">
          Try Again
        </button>
      </div>
    </div>
  );
}
```

**When shown**: Database errors, Prisma query failures

**Recommendation**: OPTIONAL - but good practice for production

### Empty State

**Handled in page component**: No health scores yet (never scanned)

```typescript
if (!latestScore) {
  return <EmptyStateUI />;
}
```

**UI**: Large icon, message, "Run First Scan" button

---

## Client Interactivity

### "Run New Scan" Button

**Location**: Main page header

**Current**: Static button (placeholder)

**Future**: Click triggers MCP tool `health.runScan(projectId)`

**Implementation** (Phase 2):

```typescript
'use client';

import { useTransition } from 'react';
import { runHealthScan } from '@/app/actions/health';

export function RunScanButton({ projectId }: { projectId: number }) {
  const [isPending, startTransition] = useTransition();

  const handleScan = () => {
    startTransition(async () => {
      const result = await runHealthScan(projectId);
      if (result.success) {
        // Revalidate page data
        window.location.reload();
      }
    });
  };

  return (
    <button onClick={handleScan} disabled={isPending}>
      {isPending ? 'Scanning...' : 'Run New Scan'}
    </button>
  );
}
```

**Server Action**:

```typescript
// app/actions/health.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function runHealthScan(projectId: number) {
  try {
    // Call MCP tool (health.runScan) here
    // Wait for scan completion
    // Score auto-calculated via MCP tool

    // Revalidate health page
    revalidatePath('/health');

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**For Day 13**: Button is **placeholder only** (no action). MCP integration is **future work**.

---

## Testing Recommendations

### TypeScript Compilation

```bash
cd apps/web
pnpm type-check
```

**Expected**: 0 errors

### Manual Testing

1. **Access page**: http://192.168.1.15:3000/health
2. **Verify empty state**: Shows if no HealthScore records exist
3. **Seed data** (if needed):
   ```sql
   INSERT INTO "HealthScore" (projectId, overallScore, securityScore, qualityScore, performanceScore, accessibilityScore, calculatedAt)
   VALUES (1, 85, 80, 90, 75, 88, NOW());
   ```
4. **Verify components**:
   - HealthOverviewCard displays score, grade, trend
   - CategoryBreakdown shows 4 bars
   - TrendGraph renders (if historical data exists)
   - FindingsTable displays findings
5. **Test filters**: Category, severity, scanner dropdowns work
6. **Test pagination**: Navigate pages (if >50 findings)
7. **Verify neumorphic design**: Consistent with other pages

### Performance Testing

1. **First load** (no cache):
   ```bash
   curl -w "@curl-format.txt" http://192.168.1.15:3000/health
   ```
   **Expected**: ~150-200ms

2. **Cached load** (ISR):
   ```bash
   curl -w "@curl-format.txt" http://192.168.1.15:3000/health
   ```
   **Expected**: <10ms

### Error States

1. **Database down**: Verify error.tsx displays
2. **No data**: Verify empty state renders
3. **Filters no match**: Verify "No findings match filters" message

---

## Next Steps for Parent Agent

### 1. Install Recharts Dependency

**On Mac mini**:
```bash
cd ~/projects/AI_HUB/apps/web
pnpm add recharts
```

### 2. Implement Components in Order

**Recommended sequence**:
1. `FindingRow.tsx` - Simplest component (no dependencies)
2. `HealthOverviewCard.tsx` - Simple component (score display)
3. `CategoryBreakdown.tsx` - Simple component (bars)
4. `HealthFilter.tsx` - Simple component (dropdowns)
5. `FindingsTable.tsx` - Uses FindingRow + HealthFilter
6. `TrendGraph.tsx` - Uses Recharts (install first!)
7. `app/(dashboard)/health/page.tsx` - Main page (uses all components)
8. Update `components/Sidebar.tsx` - Navigation change

### 3. Create Directory Structure

```bash
cd apps/web
mkdir -p app/\(dashboard\)/health
mkdir -p components/health
```

### 4. Verify TypeScript Compilation

After each component:
```bash
pnpm type-check
```

### 5. Test on Mac Mini

**Start dev server** (if not running):
```bash
docker-compose -f docker-compose.cloud.yml up nextjs
```

**Access**: http://192.168.1.15:3000/health

### 6. Seed Test Data (if needed)

If no HealthScore records exist, create seed data:

```sql
-- Insert test project (if not exists)
INSERT INTO "Project" (id, name, description) VALUES (1, 'Test Project', 'Test project for health dashboard')
ON CONFLICT (id) DO NOTHING;

-- Insert scanners
INSERT INTO "HealthScanner" (name, type, projectId, lastRun)
VALUES
  ('Semgrep Security Scanner', 'SEMGREP', 1, NOW()),
  ('ESLint Quality Scanner', 'ESLINT', 1, NOW()),
  ('Lighthouse Performance', 'LIGHTHOUSE', 1, NOW()),
  ('Axe Accessibility', 'AXECORE', 1, NOW());

-- Insert health score
INSERT INTO "HealthScore" (projectId, overallScore, securityScore, qualityScore, performanceScore, accessibilityScore, calculatedAt)
VALUES (1, 85, 80, 90, 75, 88, NOW());

-- Insert findings (example)
INSERT INTO "HealthFinding" (scannerId, category, severity, ruleId, message, filePath, lineNumber, status)
SELECT
  (SELECT id FROM "HealthScanner" WHERE type = 'SEMGREP' AND projectId = 1),
  'SECURITY',
  'CRITICAL',
  'semgrep.sql-injection',
  'Potential SQL injection vulnerability detected',
  'src/lib/db.ts',
  42,
  'OPEN';
```

### 7. Commit and Push

**Files to commit**:
- `apps/web/app/(dashboard)/health/page.tsx`
- `apps/web/components/health/*.tsx` (6 files)
- `apps/web/components/Sidebar.tsx` (modified)
- `apps/web/package.json` (recharts added)
- `apps/web/pnpm-lock.yaml` (updated)

**Commit message**:
```
feat(health): Complete Day 13 Health Dashboard UI (US-119)

- Add Health page with ISR (1-hour cache)
- Implement 6 components (Overview, Breakdown, TrendGraph, Findings, Filter, FindingRow)
- Direct Prisma queries (parallel fetch)
- Update navigation: Security → Health
- Install recharts for trend visualization

Total: ~950 LOC, 8 files created, 1 file modified
```

---

## Files Summary

**To Create** (8 files, ~950 lines):

1. `app/(dashboard)/health/page.tsx` (~250 lines) - Server Component with ISR
2. `components/health/HealthOverviewCard.tsx` (~80 lines) - Score display
3. `components/health/CategoryBreakdown.tsx` (~95 lines) - 4 bars
4. `components/health/TrendGraph.tsx` (~115 lines) - Recharts line chart
5. `components/health/FindingsTable.tsx` (~180 lines) - Table with filters + pagination
6. `components/health/HealthFilter.tsx` (~75 lines) - Dropdown controls
7. `components/health/FindingRow.tsx` (~150 lines) - Individual finding card
8. `app/(dashboard)/health/loading.tsx` (~20 lines) - OPTIONAL loading state

**To Modify** (1 file):

1. `components/Sidebar.tsx` (~5 lines) - Update navigation link

**To Install** (1 dependency):

1. `recharts` - Line chart library for TrendGraph

---

## Estimated Effort

- **Dependencies**: 5 minutes (pnpm add recharts)
- **Components**: 3-4 hours (6 components, ~950 lines total)
- **Main Page**: 45 minutes (250 lines with parallel queries)
- **Navigation**: 10 minutes (Sidebar.tsx modification)
- **Testing**: 1 hour (manual testing + TypeScript check)
- **Seed Data** (if needed): 15 minutes (SQL inserts)

**Total**: 5-6 hours (800-1000 LOC as estimated in session file)

---

## Architecture Summary

### ✅ Server Component Strategy

**Main page**: Server Component with ISR (1-hour cache)
- Direct Prisma queries (no API route)
- Parallel data fetching (3 queries)
- Handles empty state

### ✅ Client Components for Interactivity

**6 components**: All Client Components
- `HealthOverviewCard`: Score display (could be Server, but consistent)
- `CategoryBreakdown`: 4 bars (could be Server, but consistent)
- `TrendGraph`: **MUST be Client** (Recharts library)
- `FindingsTable`: **MUST be Client** (filters, pagination)
- `HealthFilter`: **MUST be Client** (dropdowns, state)
- `FindingRow`: Could be Server, but consistent

### ✅ Data Fetching Strategy

**Direct Prisma** (recommended)
- Faster than API route (no HTTP)
- Simpler codebase (no duplicate logic)
- Mac mini deployment: All on same server
- Follows Next.js 14 App Router patterns

### ✅ Caching Strategy

**ISR with 1-hour revalidation**
- Fast page loads (<10ms cache hits)
- Fresh data every hour (acceptable staleness)
- Balances performance vs freshness

### ✅ Responsive Design

**Grid layout**: 1 column mobile, 3 columns desktop
- Left: Overview + Category Breakdown (1/3 width)
- Right: Trend Graph (2/3 width)
- Full width: Findings Table

### ✅ Neumorphic Coral Theme

**Consistent styling**: neu-raised, neu-pressed, coral accents
- Matches existing pages (wiki, security, dashboard)
- Dark theme with coral highlights
- Smooth transitions and hover effects

---

**Ready for implementation!** 🚀

Parent agent should read this file and implement components in recommended sequence.
