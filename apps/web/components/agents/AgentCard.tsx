'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleAgentStatus } from '@/app/agents/actions';

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

export function AgentCard({ agent }: AgentCardProps) {
  const [isPending, startTransition] = useTransition();

  // useOptimistic for instant UI feedback
  const [optimisticAgent, setOptimisticAgent] = useOptimistic(
    agent,
    (state, newStatus: boolean) => ({ ...state, isActive: newStatus })
  );

  const handleToggle = () => {
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

  // Agent icon based on expertise
  const getAgentIcon = (expertise: string[]) => {
    if (expertise.includes('frontend') || expertise.includes('react')) return 'fa-react';
    if (expertise.includes('backend') || expertise.includes('api')) return 'fa-server';
    if (expertise.includes('database') || expertise.includes('prisma')) return 'fa-database';
    if (expertise.includes('testing')) return 'fa-flask';
    if (expertise.includes('design') || expertise.includes('ui')) return 'fa-paint-brush';
    return 'fa-robot';
  };

  // Color theme based on status
  const isActive = optimisticAgent.isActive;

  return (
    <div
      className={`neu-raised smooth-transition relative overflow-hidden rounded-3xl p-6 ${
        isActive ? 'ring-2 ring-coral/50' : ''
      }`}
    >
      {/* Status Badge */}
      <div className="mb-4 flex items-center justify-between">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            isActive ? 'bg-green-500/10 text-green-500' : 'bg-slate/10 text-slate'
          }`}
        >
          <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate'}`}></div>
          {isActive ? 'Active' : 'Inactive'}
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`smooth-transition relative h-6 w-11 rounded-full ${
            isActive ? 'bg-coral' : 'bg-black/20'
          } ${isPending ? 'opacity-50' : ''}`}
        >
          <div
            className={`smooth-transition absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md ${
              isActive ? 'left-5' : 'left-0.5'
            }`}
          ></div>
        </button>
      </div>

      {/* Agent Info */}
      <div className="mb-4 flex items-start gap-4">
        {/* Icon */}
        <div className="neu-raised flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl">
          <i className={`fab ${getAgentIcon(optimisticAgent.expertise)} text-2xl text-coral`}></i>
        </div>

        {/* Name and Description */}
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-bold text-white">{optimisticAgent.name}</h3>
          <p className="line-clamp-2 text-sm text-slate">
            {optimisticAgent.description ?? 'No description provided'}
          </p>
        </div>
      </div>

      {/* Personality */}
      {optimisticAgent.personality && (
        <div className="mb-4 rounded-2xl bg-black/20 p-3">
          <p className="text-xs italic text-slate">&quot;{optimisticAgent.personality}&quot;</p>
        </div>
      )}

      {/* Expertise Tags */}
      <div className="flex flex-wrap gap-2">
        {optimisticAgent.expertise.slice(0, 5).map((skill, index) => (
          <span
            key={index}
            className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-slate"
          >
            {skill}
          </span>
        ))}
        {optimisticAgent.expertise.length > 5 && (
          <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-slate">
            +{optimisticAgent.expertise.length - 5} more
          </span>
        )}
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
          <i className="fas fa-spinner fa-spin text-2xl text-coral"></i>
        </div>
      )}
    </div>
  );
}
