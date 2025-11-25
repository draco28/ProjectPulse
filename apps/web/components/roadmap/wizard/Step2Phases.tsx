'use client';

/**
 * Step2Phases Component
 *
 * Second wizard step: Phase definition
 * - Add/edit/remove phases
 * - Each phase has title, description, duration
 */

import { useState } from 'react';
import { Plus, Trash2, Layers, GripVertical, Clock } from 'lucide-react';
import type { Phase } from './RoadmapWizard';

interface Step2Props {
  phases: Phase[];
  errors: Record<string, string>;
  onChange: (phases: Phase[]) => void;
}

// Generate unique ID
function generateId(): string {
  return `phase_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Duration options
const DURATION_OPTIONS = [
  { value: '1 week', label: '1 Week' },
  { value: '2 weeks', label: '2 Weeks' },
  { value: '3 weeks', label: '3 Weeks' },
  { value: '4 weeks', label: '4 Weeks' },
  { value: '6 weeks', label: '6 Weeks' },
  { value: '8 weeks', label: '8 Weeks' },
  { value: '12 weeks', label: '12 Weeks' },
];

export function Step2Phases({ phases, errors, onChange }: Step2Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add new phase
  const handleAddPhase = () => {
    const newPhase: Phase = {
      id: generateId(),
      title: `Phase ${phases.length + 1}`,
      description: '',
      duration: '4 weeks',
      sprints: [],
    };
    onChange([...phases, newPhase]);
    setExpandedId(newPhase.id);
  };

  // Update phase
  const handleUpdatePhase = (id: string, updates: Partial<Phase>) => {
    onChange(phases.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Delete phase
  const handleDeletePhase = (id: string) => {
    if (phases.length === 1) return; // Keep at least one
    onChange(phases.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Define Phases</h2>
        <p className="text-slate text-sm">
          Break your roadmap into major phases or milestones
        </p>
      </div>

      {/* Phase List */}
      <div className="space-y-4">
        {phases.map((phase, index) => {
          const isExpanded = expandedId === phase.id;
          const titleError = errors[`phase_${index}_title`];

          return (
            <div
              key={phase.id}
              className={`
                neu-raised rounded-2xl overflow-hidden
                transition-all duration-300
                ${isExpanded ? 'ring-2 ring-coral/30' : ''}
              `}
            >
              {/* Phase Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : phase.id)}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-dark-pressed/50 transition-colors"
              >
                <GripVertical className="h-5 w-5 text-slate/50" />
                
                <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0">
                  <Layers className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {phase.title || `Phase ${index + 1}`}
                  </h3>
                  <p className="text-xs text-slate">
                    {phase.duration} • {phase.sprints.length} sprint{phase.sprints.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhase(phase.id);
                  }}
                  disabled={phases.length === 1}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${phases.length === 1
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-red-500/20 text-slate hover:text-red-400'
                    }
                  `}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Phase Details (Expanded) */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t border-dark-pressed">
                  {/* Title */}
                  <div>
                    <label className="text-xs font-medium text-slate mb-1 block">
                      Phase Title <span className="text-coral">*</span>
                    </label>
                    <input
                      type="text"
                      value={phase.title}
                      onChange={(e) => handleUpdatePhase(phase.id, { title: e.target.value })}
                      placeholder="e.g., Foundation, API Development, UI Polish"
                      maxLength={200}
                      className={`
                        w-full px-3 py-2 rounded-lg
                        neu-pressed bg-transparent
                        text-white placeholder:text-slate/50
                        focus:outline-none focus:ring-2 focus:ring-coral/50
                        ${titleError ? 'ring-2 ring-red-500' : ''}
                      `}
                    />
                    {titleError && (
                      <span className="text-xs text-red-400 mt-1 block">{titleError}</span>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-slate mb-1">
                      <Clock className="h-3 w-3" />
                      Duration
                    </label>
                    <select
                      value={phase.duration}
                      onChange={(e) => handleUpdatePhase(phase.id, { duration: e.target.value })}
                      className="
                        w-full px-3 py-2 rounded-lg
                        neu-pressed bg-transparent
                        text-white
                        focus:outline-none focus:ring-2 focus:ring-coral/50
                        [&>option]:bg-dark-surface [&>option]:text-white
                      "
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium text-slate mb-1 block">
                      Description <span className="text-slate/50">(optional)</span>
                    </label>
                    <textarea
                      value={phase.description}
                      onChange={(e) => handleUpdatePhase(phase.id, { description: e.target.value })}
                      placeholder="What will be accomplished in this phase?"
                      rows={2}
                      maxLength={500}
                      className="
                        w-full px-3 py-2 rounded-lg
                        neu-pressed bg-transparent
                        text-white placeholder:text-slate/50
                        focus:outline-none focus:ring-2 focus:ring-coral/50
                        resize-none
                      "
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Error */}
      {errors.phases && (
        <div className="text-center">
          <span className="text-sm text-red-400">{errors.phases}</span>
        </div>
      )}

      {/* Add Phase Button */}
      <button
        onClick={handleAddPhase}
        className="
          w-full py-4 rounded-2xl
          neu-flat border-2 border-dashed border-slate/30
          text-slate hover:text-coral hover:border-coral/50
          transition-all duration-200
          flex items-center justify-center gap-2
        "
      >
        <Plus className="h-5 w-5" />
        Add Phase
      </button>

      {/* Summary */}
      <div className="neu-flat rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate">Total Phases:</span>
          <span className="text-lg font-bold text-coral">{phases.length}</span>
        </div>
      </div>
    </div>
  );
}
