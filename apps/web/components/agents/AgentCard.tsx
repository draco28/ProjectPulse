'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toggleAgentStatus } from '@/app/agents/actions';
import { AgentDetailModal } from './AgentDetailModal';

interface AgentCardProps {
  agent: {
    id: number;
    name: string;
    description: string | null;
    expertise: string[];
    isActive: boolean;
    personality: string | null;
  };
}

const getAgentEmoji = (name: string, expertise: string[]): string => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('review')) return '🔍';
  if (lowerName.includes('bug')) return '🐛';
  if (lowerName.includes('architect') || lowerName.includes('architecture')) return '🏗️';
  if (lowerName.includes('security') || lowerName.includes('audit')) return '🛡️';
  if (lowerName.includes('doc')) return '📝';
  if (lowerName.includes('test')) return '🧪';

  if (expertise.includes('testing')) return '🧪';
  if (expertise.includes('security')) return '🛡️';

  return '🤖';
};

export function AgentCard({ agent }: AgentCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // useOptimistic for instant UI feedback
  const [optimisticAgent, setOptimisticAgent] = useOptimistic(
    agent,
    (state, newStatus: boolean) => ({ ...state, isActive: newStatus })
  );

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when toggling
    startTransition(async () => {
      // Optimistic update (instant UI change)
      setOptimisticAgent(!optimisticAgent.isActive);

      // Server Action (runs in background)
      const result = await toggleAgentStatus(agent.id, agent.isActive);

      if (!result.success) {
        // Revert optimistic update on error
        console.error('Failed to toggle agent:', result.error);
        // Note: In production, show error toast
      }
    });
  };

  const isActive = optimisticAgent.isActive;

  return (
    <>
      <div
        className={`neu-raised agent-card smooth-transition relative cursor-pointer overflow-hidden rounded-3xl p-6 hover:shadow-lg ${
          isActive ? 'ring-2 ring-coral/50' : ''
        }`}
        onClick={() => setModalOpen(true)}
        data-testid="agent-card"
      >
        {/* Header: Avatar, name, status, toggle */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="icon-coral flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-3xl shadow-lg">
              {getAgentEmoji(optimisticAgent.name, optimisticAgent.expertise)}
            </div>
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">{optimisticAgent.name}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isActive
                      ? 'border border-coral/30 bg-coral/20 text-coral'
                      : 'neu-pressed text-slate'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mb-3 text-sm text-slate">
                {optimisticAgent.description ?? 'No description provided'}
              </p>
              {/* Expertise Tags */}
              <div className="flex flex-wrap gap-2">
                {optimisticAgent.expertise.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="skill-badge neu-pressed rounded-full px-3 py-1 text-xs font-semibold text-slate"
                  >
                    {skill}
                  </span>
                ))}
                {optimisticAgent.expertise.length > 5 && (
                  <span className="skill-badge neu-pressed rounded-full px-3 py-1 text-xs font-semibold text-slate">
                    +{optimisticAgent.expertise.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            disabled={isPending}
            data-testid="agent-toggle"
            className={`smooth-transition relative h-7 w-12 flex-shrink-0 rounded-full ${
              isActive ? 'bg-coral' : 'bg-black/20'
            } ${isPending ? 'opacity-50' : ''}`}
            aria-label={isActive ? 'Deactivate agent' : 'Activate agent'}
          >
            <div
              className={`smooth-transition absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md ${
                isActive ? 'left-6' : 'left-0.5'
              }`}
            ></div>
          </button>
        </div>

        {/* Personality */}
        {optimisticAgent.personality && (
          <div className="mb-4 rounded-2xl bg-black/20 p-3">
            <p className="text-xs italic text-slate">&quot;{optimisticAgent.personality}&quot;</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="neu-pressed rounded-2xl p-3">
              <div className="mb-1 text-2xl font-bold text-coral">--</div>
              <div className="text-xs text-slate">Reviews Done</div>
            </div>
            <div className="neu-pressed rounded-2xl p-3">
              <div className="mb-1 text-2xl font-bold text-white">--</div>
              <div className="text-xs text-slate">Issues Found</div>
            </div>
            <div className="neu-pressed rounded-2xl p-3">
              <div className="mb-1 text-2xl font-bold text-green-400">--</div>
              <div className="text-xs text-slate">Time Saved</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="bg-coral-gradient coral-gradient flex-1 rounded-2xl px-4 py-2 text-sm font-medium text-white shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
            >
              Configure
            </button>
            <button
              className="neu-raised flex-1 rounded-2xl px-4 py-2 text-sm text-white"
              onClick={(e) => e.stopPropagation()}
            >
              View Analytics
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-coral" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Agent Detail Modal */}
      <AgentDetailModal agentId={agent.id} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
