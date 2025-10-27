import { prisma } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/ui/FloatingBackground';
import { AgentCard } from '@/components/agents/AgentCard';

export const dynamic = 'force-dynamic'; // Real-time agent status

async function getAgents() {
  const agents = await prisma.agentPersona.findMany({
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
  const [total, active] = await Promise.all([
    prisma.agentPersona.count(),
    prisma.agentPersona.count({ where: { isActive: true } }),
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

        <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-3xl font-bold text-white">
                  Agent Personas
                </h2>
                <p className="text-sm text-slate">
                  {stats.active} active • {stats.total} total agents
                </p>
              </div>
              <button className="coral-gradient smooth-transition flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-white shadow-lg">
                <i className="fas fa-plus"></i>
                <span>New Agent</span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="neu-raised smooth-transition rounded-3xl bg-blue-500/10 p-6">
                <div className="flex items-start gap-4">
                  <i className="fas fa-info-circle text-2xl text-blue-500"></i>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">
                      What are Agent Personas?
                    </h3>
                    <p className="text-sm text-slate">
                      Agent Personas are specialized AI assistants with unique expertise and
                      personalities. Toggle agents on/off to customize your DevHub experience.
                      Active agents will participate in conversations and provide specialized
                      assistance.
                    </p>
                  </div>
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
                  <i className="fas fa-robot mb-4 text-5xl text-slate"></i>
                  <h3 className="mb-2 text-xl font-bold text-white">
                    No Agents Found
                  </h3>
                  <p className="mb-4 text-slate">
                    Create your first agent to get started
                  </p>
                  <button className="coral-gradient smooth-transition rounded-2xl px-6 py-3 font-semibold text-white shadow-lg">
                    <i className="fas fa-plus mr-2"></i>
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
