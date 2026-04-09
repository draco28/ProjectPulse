import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { usePhaseProgress } from '@/hooks/usePhaseProgress';
import { Spinner } from '@/components/ui/Spinner';
import type { PhaseOverview } from '@/hooks/useRoadmapOverview';

const statusDisplay: Record<string, string> = {
  NOT_STARTED: 'backlog',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'done',
  BLOCKED: 'critical',
  CANCELLED: 'low',
};

interface PhaseCardProps {
  phase: PhaseOverview;
}

export function PhaseCard({ phase }: PhaseCardProps) {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="rounded-lg border border-gray-700/50 bg-surface-raised overflow-hidden">
          <DisclosureButton className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover transition-colors">
            <ChevronRight
              size={16}
              className={`text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-200 truncate">
                  {phase.title}
                </span>
                <Badge variant={statusDisplay[phase.status] ?? 'task'}>
                  {phase.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-xs">
                  <div
                    className="h-full bg-coral rounded-full transition-all"
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{phase.progress}%</span>
                <span className="text-xs text-gray-600">
                  {phase.sprint_count} sprint{phase.sprint_count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </DisclosureButton>

          <DisclosurePanel>
            <PhaseSprintList phaseId={phase.id} />
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  );
}

function PhaseSprintList({ phaseId }: { phaseId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = usePhaseProgress(phaseId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!data?.sprints.length) {
    return <p className="px-4 pb-3 text-xs text-gray-500">No sprints in this phase.</p>;
  }

  return (
    <div className="border-t border-gray-700/50">
      {data.sprints.map((sprint) => (
        <button
          key={sprint.id}
          onClick={() => navigate(`/kanban?sprint=${sprint.id}`)}
          className="w-full flex items-center gap-3 px-4 py-2.5 pl-10 text-left hover:bg-surface-hover transition-colors border-b border-gray-800/30 last:border-0"
        >
          <span className="text-xs font-mono text-gray-500 w-6">
            S{sprint.sprint_number}
          </span>
          <span className="text-sm text-gray-300 flex-1 truncate">{sprint.title}</span>
          <Badge variant={statusDisplay[sprint.status] ?? 'task'}>
            {sprint.status.replace('_', ' ')}
          </Badge>
          <div className="flex items-center gap-2 w-32">
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-coral rounded-full transition-all"
                style={{ width: `${sprint.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{sprint.progress}%</span>
          </div>
          <span className="text-xs text-gray-600 w-16 text-right">
            {sprint.done_count}/{sprint.ticket_count}
          </span>
        </button>
      ))}
    </div>
  );
}
