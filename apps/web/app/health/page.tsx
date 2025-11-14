import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Activity } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { ScoreCardsGrid } from '@/components/health/ScoreCardsGrid';
import { VulnerabilityBreakdown } from '@/components/health/VulnerabilityBreakdown';
import { ScannerStatusCards } from '@/components/health/ScannerStatusCards';
import { TrendGraph } from '@/components/health/TrendGraph';
import { FindingsTable } from '@/components/health/FindingsTable';
import { SecurityTimeline } from '@/components/health/SecurityTimeline';
import { ComplianceStatus } from '@/components/health/ComplianceStatus';

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
    scanDate: Date;
    scanner: {
      name: string;
      type: string;
    };
  }>;
  scanners: Array<{
    id: number;
    name: string;
    type: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
    lastRunAt: Date | null;
    findingsCount: number;
  }>;
  vulnerabilityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * Fetch health data for project
 * Parallel queries: Latest score + historical scores + findings + scanners
 */
async function getHealthData(projectId: number): Promise<HealthData> {
  // Parallel fetch: 4 queries run simultaneously
  const [latestScore, historicalScores, findings, scanners] = await Promise.all([
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
        scanDate: true,
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

    // Query 4: Scanners with findings count
    prisma.healthScanner.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            findings: {
              where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] },
              },
            },
          },
        },
      },
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

  // Calculate vulnerability counts by severity
  const vulnerabilityCounts = {
    critical: findings.filter((f) => f.severity === 'CRITICAL').length,
    high: findings.filter((f) => f.severity === 'HIGH').length,
    medium: findings.filter((f) => f.severity === 'MEDIUM').length,
    low: findings.filter((f) => f.severity === 'LOW').length,
  };

  // Transform scanners data (derive status from lastRun)
  const scannersData = scanners.map((s) => {
    // Derive status: ACTIVE if run within 24 hours, otherwise INACTIVE
    const now = new Date();
    const lastRunMs = s.lastRun ? now.getTime() - s.lastRun.getTime() : Infinity;
    const hoursSinceLastRun = lastRunMs / (1000 * 60 * 60);
    const status: 'ACTIVE' | 'INACTIVE' | 'ERROR' =
      hoursSinceLastRun < 24 ? 'ACTIVE' : 'INACTIVE';

    return {
      id: s.id,
      name: s.name,
      type: s.type,
      status,
      lastRunAt: s.lastRun,
      findingsCount: s._count.findings,
    };
  });

  return {
    latestScore,
    historicalScores,
    findings,
    scanners: scannersData,
    vulnerabilityCounts,
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

  const { latestScore, historicalScores, findings, scanners, vulnerabilityCounts, trend } =
    await getHealthData(projectId);

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

  // Format last scan time as relative (e.g., "2h ago")
  const formatLastScan = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Create timeline events from recent findings
  const timelineEvents = findings.slice(0, 5).map((finding) => ({
    id: finding.id,
    type: 'alert' as const,
    title: finding.ruleId || 'Security Finding',
    description: finding.message.substring(0, 80) + '...',
    timestamp: finding.scanDate,
    severity: finding.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  }));

  // Hardcoded compliance data (future: calculate from findings)
  const complianceStandards = [
    {
      name: 'OWASP Top 10',
      description: 'Web application security risks',
      status: (vulnerabilityCounts.critical === 0 ? 'compliant' : 'partial') as 'compliant' | 'partial' | 'non-compliant',
      percentage: Math.max(0, 100 - vulnerabilityCounts.critical * 10),
    },
    {
      name: 'CWE Top 25',
      description: 'Most dangerous software weaknesses',
      status: (vulnerabilityCounts.critical + vulnerabilityCounts.high < 5 ? 'partial' : 'non-compliant') as 'compliant' | 'partial' | 'non-compliant',
      percentage: Math.max(0, 100 - (vulnerabilityCounts.critical + vulnerabilityCounts.high) * 5),
    },
    {
      name: 'SOC 2',
      description: 'Security and availability controls',
      status: (latestScore.securityScore >= 80 ? 'compliant' : 'partial') as 'compliant' | 'partial' | 'non-compliant',
      percentage: latestScore.securityScore,
    },
  ];

  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div>
              <h2 className="mb-1 text-3xl font-bold text-white">Project Health</h2>
              <p className="text-sm text-slate-400">
                Last updated: {latestScore.calculatedAt.toLocaleString()} • {findings.length}{' '}
                findings
              </p>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Top Section: 4-Card Score Grid */}
              <ScoreCardsGrid
                overallScore={latestScore.overallScore}
                criticalCount={vulnerabilityCounts.critical}
                highPriorityCount={vulnerabilityCounts.high}
                lastScanTime={formatLastScan(latestScore.calculatedAt)}
              />

              {/* Middle Section: 2-Column Layout */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Left Column: Vulnerability Breakdown + Scanner Status */}
                <div className="space-y-4 lg:col-span-1">
                  <VulnerabilityBreakdown
                    critical={vulnerabilityCounts.critical}
                    high={vulnerabilityCounts.high}
                    medium={vulnerabilityCounts.medium}
                    low={vulnerabilityCounts.low}
                  />
                  <ScannerStatusCards scanners={scanners} />
                </div>

                {/* Right Column: Trend Graph */}
                <div className="lg:col-span-2">
                  <TrendGraph data={historicalScores} />
                </div>
              </div>

              {/* Bottom Section: Timeline + Compliance */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SecurityTimeline events={timelineEvents} maxEvents={5} />
                <ComplianceStatus standards={complianceStandards} />
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
