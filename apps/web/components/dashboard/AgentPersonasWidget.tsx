/**
 * AgentPersonasWidget Component
 *
 * Neumorphic agent personas widget matching the mockup
 * (dashboard-dark-neumorphic-coral.html lines 526-559)
 *
 * Features:
 * - neu-raised container with rounded-3xl
 * - glass-dark agent cards
 * - icon-coral containers with emojis
 * - pulse-glow indicator for active agents
 */
'use client';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle' | 'offline';
  lastActivity: string;
  avatar: string;
  color: string;
}

interface AgentPersonasWidgetProps {
  agents: Agent[];
}

export function AgentPersonasWidget({ agents }: AgentPersonasWidgetProps) {
  // Only show first 3 agents
  const displayedAgents = agents.slice(0, 3);

  const agentEmojis = ['🔍', '🐛', '🏗️'];

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <h3 className="mb-4 text-lg font-bold text-white">Agent Personas</h3>
      <div className="space-y-3">
        {displayedAgents.map((agent, index) => (
          <div
            key={agent.id}
            className="glass-dark smooth-transition flex cursor-pointer items-center gap-3 rounded-2xl p-4 hover:shadow-lg"
          >
            <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-lg">
              {agentEmojis[index]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{agent.name}</p>
              <p className="text-xs text-slate">
                {agent.status === 'active' ? 'Active' : 'Available'}
              </p>
            </div>
            {agent.status === 'active' && (
              <div className="pulse-glow h-2 w-2 rounded-full bg-green-400" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
