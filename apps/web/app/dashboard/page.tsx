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
import { IssueCard } from '@/components/dashboard/IssueCard';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { AgentPersonasWidget } from '@/components/dashboard/AgentPersonasWidget';
import { ListTodo, Lightbulb, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth-server';
import Link from 'next/link';

// Singleton pattern for PrismaClient to avoid too many connections
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

async function getDashboardData(projectId: number) {
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
  ] = await Promise.all([
    prisma.issue.count({ where: { projectId, status: 'open' } }),
    prisma.issue.count({ where: { projectId, status: 'in-progress' } }),
    prisma.issue.count({ where: { projectId, status: 'closed' } }),
    prisma.knowledgeItem.count(),
    prisma.securityFinding.count({ where: { status: 'open' } }),
    prisma.issue.findMany({
      where: { projectId },
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
  ]);

  const completedCount = onboardingSessions.filter((s) => s.status === 'complete').length;

  return {
    project,
    stats: {
      openIssues: openIssuesCount + inProgressIssuesCount,
      knowledgeItems: knowledgeItemsCount,
      securityFindings: securityFindingsCount,
      completed: closedIssuesCount,
    },
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
        lastActivity: status === 'active' ? 'Active now' : status === 'idle' ? '2 mins ago' : '1 hour ago',
        avatar: agent.name.slice(0, 2).toUpperCase(),
        color: colors[index % colors.length] || '#00D4FF',
      };
    }),
    onboarding: {
      completedSessions: completedCount,
      isComplete: completedCount === 3,
    },
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Get projectId from query param or use first owned project
  let projectId: number;
  if (searchParams.project) {
    projectId = parseInt(searchParams.project, 10);
  } else {
    // Get user's first project
    const firstProject = await prisma.project.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    });

    if (!firstProject) {
      // No projects - redirect to /app to create one
      redirect('/app');
    }

    projectId = firstProject.id;
  }

  // Verify ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!project || project.ownerId !== user.id) {
    // Unauthorized or project doesn't exist - redirect to /app
    redirect('/app');
  }

  const data = await getDashboardData(projectId);

  return (
    <div className="space-y-4">
      {/* Back to Projects Link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Issues"
          value={data.stats.openIssues}
          icon={ListTodo}
          trend={{ value: 12, label: 'from last week' }}
        />
        <StatCard
          title="Knowledge Items"
          value={data.stats.knowledgeItems}
          icon={Lightbulb}
          trend={{ value: 8, label: 'from last month' }}
        />
        <StatCard
          title="Security Findings"
          value={data.stats.securityFindings}
          icon={Shield}
          trend={{ value: -15, label: 'from last week' }}
          iconClassName="icon-slate"
        />
        <StatCard
          title="Completed"
          value={data.stats.completed}
          icon={CheckCircle2}
          trend={{ value: 23, label: 'from last week' }}
          iconClassName="icon-slate"
        />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left Column - Recent Issues (2/3) */}
        <div className="lg:col-span-2">
          <div className="neu-raised smooth-transition rounded-3xl">
            <div className="border-b border-white/5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Recent Issues</h3>
                <a
                  href="/issues"
                  className="hover:text-coralLight smooth-transition text-sm font-semibold text-coral"
                >
                  View all →
                </a>
              </div>
            </div>
            <div className="space-y-4 p-6">
              {data.recentIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Widgets (1/3) */}
        <div className="space-y-4">
          {/* Quick Actions - with onboarding status */}
          <QuickActionsWidget onboardingStatus={data.onboarding} />

          {/* Agent Personas */}
          <AgentPersonasWidget agents={data.agents} />
        </div>
      </div>
    </div>
  );
}
