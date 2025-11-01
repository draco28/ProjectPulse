import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Shield } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { SecurityScoreMeter } from '@/components/security/SecurityScoreMeter';
import { VulnerabilityCard } from '@/components/security/VulnerabilityCard';
import { VulnerabilityFilter } from '@/components/security/VulnerabilityFilter';

interface PageProps {
  searchParams: {
    severity?: string; // 'ERROR' | 'WARNING' | 'INFO'
    status?: string; // 'open' | 'fixed' | 'false_positive'
  };
}

export const dynamic = 'force-dynamic'; // Real-time security data

// Calculate security score from findings
async function calculateSecurityScore() {
  const findings = await prisma.securityFinding.findMany({
    where: { status: 'open' }, // Only count open issues
    select: { severity: true },
  });

  if (findings.length === 0) return 100;

  // Score weights: ERROR=10, WARNING=4, INFO=1
  const totalPenalty = findings.reduce((sum, finding) => {
    if (finding.severity === 'ERROR') return sum + 10;
    if (finding.severity === 'WARNING') return sum + 4;
    return sum + 1; // INFO
  }, 0);

  // Calculate score (max penalty ~200 for very bad codebase)
  const score = Math.max(0, 100 - totalPenalty);
  return Math.round(score);
}

// Get vulnerability breakdown
async function getVulnerabilityStats() {
  const findings = await prisma.securityFinding.groupBy({
    by: ['severity'],
    _count: {
      id: true,
    },
    where: {
      status: 'open',
    },
  });

  return {
    critical: findings.find((f) => f.severity === 'ERROR')?._count.id || 0,
    high: 0, // Placeholder (extend model if needed)
    medium: findings.find((f) => f.severity === 'WARNING')?._count.id || 0,
    low: findings.find((f) => f.severity === 'INFO')?._count.id || 0,
  };
}

async function getSecurityFindings(searchParams: PageProps['searchParams']) {
  const { severity, status = 'open' } = searchParams;

  const where: Prisma.SecurityFindingWhereInput = {};

  if (severity) {
    where.severity = severity;
  }

  if (status) {
    where.status = status;
  }

  const findings = await prisma.securityFinding.findMany({
    where,
    select: {
      id: true,
      ruleId: true,
      severity: true,
      message: true,
      filePath: true,
      lineNumber: true,
      codeSnippet: true,
      status: true,
      scanDate: true,
      issue: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      { severity: 'asc' }, // ERROR first
      { scanDate: 'desc' },
    ],
    take: 50, // Limit for performance
  });

  return findings.map((finding) => ({
    ...finding,
    // Ensure severity is the expected union type for VulnerabilityCard props
    severity: finding.severity as 'ERROR' | 'WARNING' | 'INFO',
    scanDate: finding.scanDate.toISOString(),
  }));
}

export default async function SecurityPage({ searchParams }: PageProps) {
  // Parallel queries for performance
  const [securityScore, stats, findings] = await Promise.all([
    calculateSecurityScore(),
    getVulnerabilityStats(),
    getSecurityFindings(searchParams),
  ]);

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
                <h2 className="mb-1 text-3xl font-bold text-white">Security Dashboard</h2>
                <p className="text-sm text-slate">
                  {findings.length} vulnerabilities • {stats.critical + stats.high + stats.medium}{' '}
                  need attention
                </p>
              </div>
              <button
                className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg"
                aria-label="Run security scan"
              >
                <Shield className="h-5 w-5" aria-hidden="true" />
                <span>Run Scan</span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Security Score Card */}
              <div className="neu-raised smooth-transition rounded-3xl p-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {/* Score Meter */}
                  <div className="flex items-center justify-center">
                    <SecurityScoreMeter score={securityScore} label="Security Score" />
                  </div>

                  {/* Stats Breakdown */}
                  <div className="flex flex-col justify-center space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Critical (ERROR)</span>
                      <span className="text-2xl font-bold text-red-500">{stats.critical}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Medium (WARNING)</span>
                      <span className="text-2xl font-bold text-orange-500">{stats.medium}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate">Low (INFO)</span>
                      <span className="text-2xl font-bold text-blue-500">{stats.low}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <VulnerabilityFilter
                selectedSeverity={searchParams.severity}
                selectedStatus={searchParams.status}
              />

              {/* Vulnerabilities List */}
              {findings.length > 0 ? (
                <div className="space-y-4">
                  {findings.map((finding) => (
                    <VulnerabilityCard key={finding.id} finding={finding} />
                  ))}
                </div>
              ) : (
                <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                  <Shield className="mb-4 h-16 w-16 text-green-500" aria-hidden="true" />
                  <h3 className="mb-2 text-xl font-bold text-white">All Clear!</h3>
                  <p className="text-slate">No vulnerabilities found matching your filters</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
