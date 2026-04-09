import { useRoadmapOverview } from '@/hooks/useRoadmapOverview';
import { PhaseCard } from '@/components/sprints/PhaseCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Milestone } from 'lucide-react';

export default function Sprints() {
  const { data: phases, isLoading } = useRoadmapOverview();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!phases?.length) {
    return (
      <EmptyState
        icon={Milestone}
        title="No phases found"
        description="Create a roadmap to see phases and sprints."
      />
    );
  }

  // Calculate overall progress
  const totalProgress = phases.length
    ? Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length)
    : 0;

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Sprints</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-xs">
            <div
              className="h-full bg-coral rounded-full transition-all"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">{totalProgress}% overall</span>
          <span className="text-sm text-gray-600">
            {phases.length} phase{phases.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Phase list */}
      <div className="space-y-3">
        {phases.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </div>
    </div>
  );
}
