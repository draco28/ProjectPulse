// Force dynamic rendering (no pre-render during build)
export const dynamic = 'force-dynamic';

/**
 * Dashboard Page - Server Component
 * Sprint 8.9: Now with auth and project ownership
 *
 * Fetches real data from PostgreSQL via Prisma:
 * - Issue statistics
 * - Recent issues
 * - Knowledge base count
 * - Security findings
 * - Active agent personas
 */

import { redirect } from 'next/navigation';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { StatCard } from '@/components/dashboard/StatCard';
import { TicketCard } from '@/components/dashboard/TicketCard';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { AgentPersonasWidget } from '@/components/dashboard/AgentPersonasWidget';
import { ActiveSessionsWidget } from '@/components/dashboard/ActiveSessionsWidget';
import { ListTodo, Lightbulb, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';
import { PrismaClient } from '@prisma/client';
import { withProjectAuth } from '@/lib/project';
import { ProjectLayoutWrapper } from '@/components/layout';
import Link from 'next/link';

// Singleton pattern for PrismaClient to avoid too many connections
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

async function getDashboardData(projectId: number) {
  // Time windows for trend calculations
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Fetch all data in parallel for performance
  const [
    openIssuesCount,
    inProgressIssuesCount,
    closedIssuesCount,
    knowledgeItemsCount,
    securityFindingsCount,
    recentIssues,
    activeAgents,
    onboardingSessions,
    project,
    issuesCreatedLast7,
    issuesCreatedPrev7,
    knowledgeCreatedLast30,
    knowledgeCreatedPrev30,
    findingsCreatedLast7,
    findingsCreatedPrev7,
    issuesClosedLast7,
    issuesClosedPrev7,
    activeSessions,
  ] = await Promise.all([
    // Current snapshot counts
    // Sprint 10: Use ticket model (issues are tickets with kind IN ('issue','bug','scanner_finding'))
    prisma.ticket.count({
      where: { projectId, status: 'open', kind: { in: ['issue', 'bug', 'scanner_finding'] } },
    }),
    prisma.ticket.count({
      where: {
        projectId,
        status: 'in-progress',
        kind: { in: ['issue', 'bug', 'scanner_finding'] },
      },
    }),
    prisma.ticket.count({
      where: { projectId, status: 'closed', kind: { in: ['issue', 'bug', 'scanner_finding'] } },
    }),
    prisma.knowledgeItem.count({ where: { projectId } }),
    prisma.securityFinding.count({ where: { projectId, status: 'open' } }),
    prisma.ticket.findMany({
      where: { projectId, kind: { in: ['issue', 'bug', 'scanner_finding'] } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        labels: true,
        _count: {
          select: { comments: true },
        },
      },
    }),
    prisma.agentPersona.findMany({
      where: { projectId, isActive: true },
      orderBy: { name: 'asc' },
    }),
    // Fetch onboarding status for QuickActions widget
    prisma.onboardingSession.findMany({
      where: { projectId },
      select: {
        sessionNumber: true,
        status: true,
      },
    }),
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, ownerId: true },
    }),
    // Historical windows for trends (issues created)
    prisma.ticket.count({
      where: {
        projectId,
        kind: { in: ['issue', 'bug', 'scanner_finding'] },
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.ticket.count({
      where: {
        projectId,
        kind: { in: ['issue', 'bug', 'scanner_finding'] },
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
    // Knowledge items created
    prisma.knowledgeItem.count({
      where: {
        projectId,
        createdAt: { gte: monthAgo },
      },
    }),
    prisma.knowledgeItem.count({
      where: {
        projectId,
        createdAt: { gte: twoMonthsAgo, lt: monthAgo },
      },
    }),
    // Security findings created
    prisma.securityFinding.count({
      where: {
        projectId,
        createdAt: { gte: weekAgo },
      },
    }),
    prisma.securityFinding.count({
      where: {
        projectId,
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
    // Issues closed (completed) by updatedAt window
    prisma.ticket.count({
      where: {
        projectId,
        kind: { in: ['issue', 'bug', 'scanner_finding'] },
        status: 'closed',
        updatedAt: { gte: weekAgo },
      },
    }),
    prisma.ticket.count({
      where: {
        projectId,
        kind: { in: ['issue', 'bug', 'scanner_finding'] },
        status: 'closed',
        updatedAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
    // Sprint 14: Active agent sessions for dashboard widget
    prisma.agentSession.findMany({
      where: {
        projectId,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        startedAt: true,
        todos: true,
        activeTicketIds: true,
      },
    }),
  ]);

  const completedCount = onboardingSessions.filter((s) => s.status === 'complete').length;

  const trends = {
    // Positive = more activity in current window vs previous
    openIssues: issuesCreatedLast7 - issuesCreatedPrev7,
    knowledgeItems: knowledgeCreatedLast30 - knowledgeCreatedPrev30,
    securityFindings: findingsCreatedLast7 - findingsCreatedPrev7,
    completed: issuesClosedLast7 - issuesClosedPrev7,
  };

  return {
    project,
    stats: {
      openIssues: openIssuesCount + inProgressIssuesCount,
      knowledgeItems: knowledgeItemsCount,
      securityFindings: securityFindingsCount,
      completed: closedIssuesCount,
    },
    trends,
    recentIssues: recentIssues.map((issue) => ({
      id: issue.id.toString(),
      title: issue.title,
      description: issue.description || 'No description provided',
      priority: issue.priority as 'critical' | 'high' | 'medium' | 'low',
      category: issue.module || 'General',
      isActive: issue.status === 'in-progress',
      createdAt: new Date(issue.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    })),
    agents: activeAgents.map((agent, index) => {
      const colors = ['#00D4FF', '#FF0055', '#FFD600', '#00FF88'];
      const statuses = ['active', 'idle', 'offline'] as const;
      const status = statuses[index % statuses.length] || 'active';
      return {
        id: agent.id.toString(),
        name: agent.name,
        description: agent.description || '',
        status,
        lastActivity:
          status === 'active' ? 'Active now' : status === 'idle' ? '2 mins ago' : '1 hour ago',
        avatar: agent.name.slice(0, 2).toUpperCase(),
        color: colors[index % colors.length] || '#00D4FF',
      };
    }),
    onboarding: {
      completedSessions: completedCount,
      isComplete: completedCount === 3,
    },
    // Sprint 14: Active agent sessions
    sessions: activeSessions.map((session) => {
      const todos = Array.isArray(session.todos)
        ? (session.todos as Array<{ content: string; status: string }>)
        : [];
      const todosCompleted = todos.filter((t) => t.status === 'completed').length;
      const todosTotal = todos.length;
      return {
        id: session.id,
        name: session.name,
        status: session.status as 'IN_PROGRESS' | 'PAUSED',
        startedAt: session.startedAt.toISOString(),
        todosCompleted,
        todosTotal,
        activeTicketIds: session.activeTicketIds,
      };
    }),
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  // Unified auth + project resolution (replaces inline project logic)
  const { project, projectId } = await withProjectAuth(searchParams.project);

  const data = await getDashboardData(projectId);
  const hasTrendActivity =
    data.trends.openIssues !== 0 ||
    data.trends.knowledgeItems !== 0 ||
    data.trends.securityFindings !== 0 ||
    data.trends.completed !== 0;

  const trendLabel = hasTrendActivity ? 'vs previous period' : 'no data yet';

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <div className="space-y-4">
      {/* Back to Projects Link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Welcome Banner */}
      <WelcomeBanner projectName={project.name} projectId={projectId} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Tickets"
          value={data.stats.openIssues}
          icon={ListTodo}
          trend={{ value: data.trends.openIssues, label: trendLabel }}
        />
        <StatCard
          title="Knowledge Items"
          value={data.stats.knowledgeItems}
          icon={Lightbulb}
          trend={{ value: data.trends.knowledgeItems, label: trendLabel }}
        />
        <StatCard
          title="Security Findings"
          value={data.stats.securityFindings}
          icon={Shield}
          trend={{ value: data.trends.securityFindings, label: trendLabel }}
          iconClassName="icon-slate"
        />
        <StatCard
          title="Completed"
          value={data.stats.completed}
          icon={CheckCircle2}
          trend={{ value: data.trends.completed, label: trendLabel }}
          iconClassName="icon-slate"
        />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left Column - Recent Tickets (2/3) */}
        <div className="lg:col-span-2">
          <div className="neu-raised smooth-transition rounded-3xl">
            <div className="border-b border-white/5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Recent Tickets</h3>
                <Link
                  href={`/tickets?project=${projectId}`}
                  className="hover:text-coralLight smooth-transition text-sm font-semibold text-coral"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="space-y-4 p-6">
              {data.recentIssues.map((issue) => (
                <TicketCard key={issue.id} issue={issue} projectId={projectId} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Widgets (1/3) */}
        <div className="space-y-4">
          {/* Quick Actions - with onboarding status */}
          <QuickActionsWidget onboardingStatus={data.onboarding} projectId={projectId} />

          {/* Active Agent Sessions (Sprint 14) */}
          <ActiveSessionsWidget sessions={data.sessions} projectId={projectId} />

          {/* Agent Personas */}
          <AgentPersonasWidget agents={data.agents} />
        </div>
      </div>
      </div>
    </ProjectLayoutWrapper>
  );
}
