/**
 * Dashboard Page - Server Component
 *
 * Fetches real data from PostgreSQL via Prisma:
 * - Issue statistics
 * - Recent issues
 * - Knowledge base count
 * - Security findings
 * - Active agent personas
 */

import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { StatCard } from '@/components/dashboard/StatCard';
import { IssueCard } from '@/components/dashboard/IssueCard';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { AgentPersonasWidget } from '@/components/dashboard/AgentPersonasWidget';
import { ListTodo, Lightbulb, Shield, CheckCircle2 } from 'lucide-react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getDashboardData() {
  // Fetch all data in parallel for performance
  const [
    openIssuesCount,
    inProgressIssuesCount,
    closedIssuesCount,
    knowledgeItemsCount,
    securityFindingsCount,
    recentIssues,
    activeAgents,
  ] = await Promise.all([
    prisma.issue.count({ where: { status: 'open' } }),
    prisma.issue.count({ where: { status: 'in-progress' } }),
    prisma.issue.count({ where: { status: 'closed' } }),
    prisma.knowledgeItem.count(),
    prisma.securityFinding.count({ where: { status: 'open' } }),
    prisma.issue.findMany({
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
      where: { isBuiltIn: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
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
      return {
        id: agent.id.toString(),
        name: agent.name,
        description: agent.description || '',
        status: 'active' as const,
        lastActivity: 'Active now',
        avatar: agent.name.slice(0, 2).toUpperCase(),
        color: colors[index % colors.length] || '#00D4FF',
      };
    }),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6 p-6">
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
          iconClassName="bg-error/10"
        />
        <StatCard
          title="Completed"
          value={data.stats.completed}
          icon={CheckCircle2}
          trend={{ value: 23, label: 'from last week' }}
          iconClassName="bg-success/10"
        />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Recent Issues (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">Recent Issues</h2>
            <a href="/issues" className="text-sm text-accent-primary hover:underline">
              View all
            </a>
          </div>

          <div className="space-y-3">
            {data.recentIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>

        {/* Right Column - Widgets (1/3) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActionsWidget />

          {/* Agent Personas */}
          <AgentPersonasWidget agents={data.agents} />
        </div>
      </div>
    </div>
  );
}
