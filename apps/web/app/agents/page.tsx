import { prisma } from '@/lib/prisma';
import { Plus, Info, Bot } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { AgentCard } from '@/components/agents/AgentCard';

export const dynamic = 'force-dynamic'; // Real-time agent status

async function getAgents() {
  // TODO: Get projectId from auth/session when available
  const projectId = 1; // Default project for MVP
  
  const agents = await prisma.agentPersona.findMany({
    where: {
      projectId: projectId, // Sprint 8.5 Phase 3: Filter agents by project
    },
    orderBy: [
      { isActive: 'desc' }, // Active agents first
      { name: 'asc' },
    ],
    select: {
      id: true,
      name: true,
      description: true,
      expertise: true,
      isActive: true,
      personality: true,
    },
  });

  return agents;
}

async function getAgentStats() {
  // TODO: Get projectId from auth/session when available
  const projectId = 1; // Default project for MVP
  
  const [total, active] = await Promise.all([
    prisma.agentPersona.count({ where: { projectId: projectId } }),
    prisma.agentPersona.count({ where: { projectId: projectId, isActive: true } }),
  ]);

  return { total, active };
}

export default async function AgentsPage() {
  const [agents, stats] = await Promise.all([getAgents(), getAgentStats()]);

  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="content-wrapper flex flex-1 flex-col gap-4 px-6 py-4 md:px-8">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-3xl font-bold text-white">Agent Personas</h2>
                <p className="text-sm text-slate">Manage your AI-powered development assistants</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="neu-raised smooth-transition rounded-2xl px-6 py-3 text-sm font-medium text-white"
                  aria-label="Import agent configuration"
                >
                  <span className="mr-2">
                    {/* Icon placeholder to match mockup styling */}
                    <span className="hidden" aria-hidden="true">
                      Import
                    </span>
                  </span>
                  Import Config
                </button>
                <button
                  className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg"
                  aria-label="Create custom agent"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  <span>Create Custom Agent</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-4 px-2 md:px-4">
              {/* Info Banner */}
              <div className="neu-raised neu-no-hover smooth-transition rounded-3xl bg-blue-500/10 p-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-blue-500" aria-hidden="true" />
                  <div>
                    <h3 className="mb-1 font-semibold text-white">What are Agent Personas?</h3>
                    <p className="text-sm text-slate">
                      Agent Personas are specialized AI assistants with unique expertise and
                      personalities. Toggle agents on/off to customize your DevHub experience.
                      Active agents will participate in conversations and provide specialized
                      assistance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {/* Active Agents */}
                <div className="neu-raised neu-no-hover smooth-transition rounded-3xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="icon-coral flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
                      <span className="text-xl">🤖</span>
                    </div>
                    <span className="pulse-glow h-2 w-2 rounded-full bg-coral" />
                  </div>
                  <div className="mb-1 text-3xl font-bold text-coral">{stats.active}</div>
                  <div className="text-sm text-slate">Active Agents</div>
                </div>

                {/* Total Agents / Tasks Completed placeholder */}
                <div className="neu-raised neu-no-hover smooth-transition rounded-3xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="neu-raised flex h-12 w-12 items-center justify-center rounded-2xl">
                      <span className="text-xl">📋</span>
                    </div>
                  </div>
                  <div className="mb-1 text-3xl font-bold text-white">{stats.total}</div>
                  <div className="text-sm text-slate">Total Agents</div>
                </div>

                {/* Time Saved (placeholder for future metrics) */}
                <div className="neu-raised neu-no-hover smooth-transition rounded-3xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="neu-raised flex h-12 w-12 items-center justify-center rounded-2xl">
                      <span className="text-xl">⏱️</span>
                    </div>
                  </div>
                  <div className="mb-1 text-3xl font-bold text-white">--</div>
                  <div className="text-sm text-slate">Time Saved (coming soon)</div>
                </div>

                {/* Success Rate (placeholder for future metrics) */}
                <div className="neu-raised neu-no-hover smooth-transition rounded-3xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="neu-raised flex h-12 w-12 items-center justify-center rounded-2xl">
                      <span className="text-xl">📈</span>
                    </div>
                  </div>
                  <div className="mb-1 text-3xl font-bold text-green-400">--</div>
                  <div className="text-sm text-slate">Success Rate (coming soon)</div>
                </div>
              </div>

              {/* Agent Cards */}
              {agents.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              ) : (
                <div className="neu-raised smooth-transition flex flex-col items-center justify-center rounded-3xl p-12 text-center">
                  <Bot className="mb-4 h-16 w-16 text-slate" aria-hidden="true" />
                  <h3 className="mb-2 text-xl font-bold text-white">No Agents Found</h3>
                  <p className="mb-4 text-slate">Create your first agent to get started</p>
                  <button className="coral-gradient smooth-transition rounded-2xl px-6 py-3 font-semibold text-white shadow-lg">
                    <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
                    Create Agent
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
