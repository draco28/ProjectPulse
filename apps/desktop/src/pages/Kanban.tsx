import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSprints } from '@/hooks/useSprints';
import { useKanbanBoard } from '@/hooks/useKanbanBoard';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { SprintSelector } from '@/components/kanban/SprintSelector';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LayoutGrid } from 'lucide-react';
import type { SprintListItem } from '@/types/kanban';

export default function Kanban() {
  const [searchParams] = useSearchParams();
  const { data: sprints, isLoading: sprintsLoading } = useSprints();
  const [selectedSprint, setSelectedSprint] = useState<SprintListItem | undefined>();

  // Auto-select sprint from URL param or first active sprint
  useEffect(() => {
    if (!sprints?.length) return;
    const paramId = searchParams.get('sprint');
    if (paramId) {
      const match = sprints.find((s) => s.id === paramId);
      if (match) {
        setSelectedSprint(match);
        return;
      }
    }
    // Default: pick the first IN_PROGRESS sprint, or the last one
    const active = sprints.find((s) => s.status === 'IN_PROGRESS');
    setSelectedSprint(active ?? sprints[sprints.length - 1]);
  }, [sprints, searchParams]);

  const { data: board, isLoading: boardLoading } = useKanbanBoard(selectedSprint?.id);

  if (sprintsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!sprints?.length) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No sprints found"
        description="Create a roadmap with sprints to see the kanban board."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Kanban Board</h1>
          {board?.sprint && (
            <p className="text-sm text-gray-400 mt-0.5">
              Progress: {board.sprint.progress}% — {board.stats.done}/{board.stats.total} done
            </p>
          )}
        </div>
        <SprintSelector
          sprints={sprints}
          selected={selectedSprint}
          onChange={setSelectedSprint}
        />
      </div>

      {/* Board */}
      {boardLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      ) : board ? (
        <KanbanBoard board={board} sprintId={selectedSprint!.id} />
      ) : (
        <EmptyState
          icon={LayoutGrid}
          title="No board data"
          description="Select a sprint to view its kanban board."
        />
      )}
    </div>
  );
}
