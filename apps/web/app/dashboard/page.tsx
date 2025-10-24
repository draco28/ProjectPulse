/**
 * Dashboard Page
 *
 * Main dashboard with:
 * - Welcome banner
 * - Stats grid (4 cards)
 * - Two-column layout:
 *   - Left: Recent issues
 *   - Right: Quick actions + Agent personas
 */
'use client';

import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { StatCard } from '@/components/dashboard/StatCard';
import { IssueCard } from '@/components/dashboard/IssueCard';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { AgentPersonasWidget } from '@/components/dashboard/AgentPersonasWidget';
import { ListTodo, Lightbulb, Shield, CheckCircle2 } from 'lucide-react';
import { mockIssues, mockStats, mockAgents } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Issues"
          value={mockStats.openIssues.value}
          icon={ListTodo}
          trend={mockStats.openIssues.trend}
        />
        <StatCard
          title="Knowledge Items"
          value={mockStats.knowledgeItems.value}
          icon={Lightbulb}
          trend={mockStats.knowledgeItems.trend}
        />
        <StatCard
          title="Security Findings"
          value={mockStats.securityFindings.value}
          icon={Shield}
          trend={mockStats.securityFindings.trend}
          iconClassName="bg-error/10"
        />
        <StatCard
          title="Completed"
          value={mockStats.completed.value}
          icon={CheckCircle2}
          trend={mockStats.completed.trend}
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
            {mockIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>

        {/* Right Column - Widgets (1/3) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActionsWidget />

          {/* Agent Personas */}
          <AgentPersonasWidget agents={mockAgents} />
        </div>
      </div>
    </div>
  );
}
