import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Activity } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { HealthOverviewCard } from '@/components/health/HealthOverviewCard';
import { CategoryBreakdown } from '@/components/health/CategoryBreakdown';
import { TrendGraph } from '@/components/health/TrendGraph';
import { FindingsTable } from '@/components/health/FindingsTable';

// ISR: Revalidate every hour (health scans run infrequently)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Project Health | ProjectPulse',
  description: 'Comprehensive health monitoring dashboard with security, quality, accessibility, and performance metrics',
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

    // Query 3: All findings with scanner info (limit to 100 most recent)
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
        { scanDate: 'desc' },
      ],
      take: 100, // Limit for performance
    }),
  ]);

  // Calculate trend (improving/declining/stable)
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (historicalScores.length >= 2) {
    const oldest = historicalScores[0]!.overallScore; // Non-null assertion: length check guarantees existence
    const newest = historicalScores[historicalScores.length - 1]!.overallScore;
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
  // Hardcode project ID = 7 for now (future: from context/params)
  const projectId = 7;

  const { latestScore, historicalScores, findings, trend } = await getHealthData(projectId);

  // Handle no data case (never scanned)
  if (!latestScore) {
    return (
      <>
        <FloatingBackground />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />

          <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden p-4">
            <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
              <h2 className="text-3xl font-bold text-white">Project Health</h2>
            </header>

            <main className="flex-1 overflow-auto">
              <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                <Activity className="mb-4 h-16 w-16 text-slate-400" aria-hidden="true" />
                <h3 className="mb-2 text-xl font-semibold text-white">No Health Data Yet</h3>
                <p className="mb-6 text-slate-400">
                  Run your first scan to see project health insights.
                </p>
                <button
                  className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg"
                  aria-label="Run first health scan"
                >
                  <Activity className="h-5 w-5" aria-hidden="true" />
                  <span>Run First Scan</span>
                </button>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-3xl font-bold text-white">Project Health</h2>
                <p className="text-sm text-slate-400">
                  Last updated: {latestScore.calculatedAt.toLocaleString()} • {findings.length}{' '}
                  findings
                </p>
              </div>
              <button
                className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg"
                aria-label="Run new health scan"
              >
                <Activity className="h-5 w-5" aria-hidden="true" />
                <span>Run New Scan</span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Grid Layout: Overview + Category on left, Trend Graph on right */}
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

              {/* Findings Table with Filters */}
              <FindingsTable findings={findings} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
