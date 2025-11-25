'use client';

/**
 * Step3Sprints Component
 *
 * Third wizard step: Sprints per phase
 * - Accordion of phases
 * - Add/edit sprints within each phase
 * - Sprint: name, duration, goals, deliverables
 */

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Target, Package, Zap } from 'lucide-react';
import type { Phase, Sprint } from './RoadmapWizard';

interface Step3Props {
  phases: Phase[];
  errors: Record<string, string>;
  onChange: (phases: Phase[]) => void;
}

// Generate unique ID
function generateId(): string {
  return `sprint_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Duration options for sprints
const SPRINT_DURATION_OPTIONS = [
  { value: '1 week', label: '1 Week' },
  { value: '2 weeks', label: '2 Weeks' },
  { value: '3 weeks', label: '3 Weeks' },
  { value: '4 weeks', label: '4 Weeks' },
];

export function Step3Sprints({ phases, errors, onChange }: Step3Props) {
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(
    phases[0]?.id || null
  );

  // Add sprint to phase
  const handleAddSprint = (phaseId: string, _phaseIndex: number) => {
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;

    const newSprint: Sprint = {
      id: generateId(),
      name: `Sprint ${phase.sprints.length + 1}`,
      duration: '2 weeks',
      weeks: `Weeks ${phase.sprints.length * 2 + 1}-${phase.sprints.length * 2 + 2}`,
      goals: [],
      deliverables: [],
    };

    onChange(
      phases.map((p) =>
        p.id === phaseId ? { ...p, sprints: [...p.sprints, newSprint] } : p
      )
    );
  };

  // Update sprint
  const handleUpdateSprint = (phaseId: string, sprintId: string, updates: Partial<Sprint>) => {
    onChange(
      phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              sprints: p.sprints.map((s) =>
                s.id === sprintId ? { ...s, ...updates } : s
              ),
            }
          : p
      )
    );
  };

  // Delete sprint
  const handleDeleteSprint = (phaseId: string, sprintId: string) => {
    onChange(
      phases.map((p) =>
        p.id === phaseId
          ? { ...p, sprints: p.sprints.filter((s) => s.id !== sprintId) }
          : p
      )
    );
  };

  // Handle goal/deliverable as comma-separated input
  const handleArrayInput = (
    phaseId: string,
    sprintId: string,
    field: 'goals' | 'deliverables',
    value: string
  ) => {
    const items = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    handleUpdateSprint(phaseId, sprintId, { [field]: items });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Define Sprints</h2>
        <p className="text-slate text-sm">
          Break each phase into sprints with goals and deliverables
        </p>
      </div>

      {/* Phase Accordion */}
      <div className="space-y-4">
        {phases.map((phase, phaseIndex) => {
          const isExpanded = expandedPhaseId === phase.id;
          const sprintsError = errors[`phase_${phaseIndex}_sprints`];

          return (
            <div
              key={phase.id}
              className={`
                neu-raised rounded-2xl overflow-hidden
                ${sprintsError ? 'ring-2 ring-red-500' : ''}
              `}
            >
              {/* Phase Header */}
              <button
                onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-dark-pressed/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-coral" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate" />
                )}

                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-white">{phase.title}</h3>
                  <p className="text-xs text-slate">
                    {phase.sprints.length} sprint{phase.sprints.length !== 1 ? 's' : ''} •{' '}
                    {phase.duration}
                  </p>
                </div>

                {sprintsError && (
                  <span className="text-xs text-red-400">{sprintsError}</span>
                )}
              </button>

              {/* Sprints (Expanded) */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t border-dark-pressed">
                  {/* Sprint List */}
                  {phase.sprints.map((sprint, sprintIndex) => {
                    const nameError = errors[`phase_${phaseIndex}_sprint_${sprintIndex}_name`];

                    return (
                      <div
                        key={sprint.id}
                        className="neu-flat rounded-xl p-4 space-y-3"
                      >
                        {/* Sprint Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-coral" />
                            <span className="text-sm font-medium text-white">
                              Sprint {sprintIndex + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSprint(phase.id, sprint.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Sprint Name */}
                        <div>
                          <label className="text-xs text-slate mb-1 block">
                            Sprint Name <span className="text-coral">*</span>
                          </label>
                          <input
                            type="text"
                            value={sprint.name}
                            onChange={(e) =>
                              handleUpdateSprint(phase.id, sprint.id, { name: e.target.value })
                            }
                            placeholder="e.g., Setup & Foundation"
                            className={`
                              w-full px-3 py-2 rounded-lg text-sm
                              neu-pressed bg-transparent
                              text-white placeholder:text-slate/50
                              focus:outline-none focus:ring-2 focus:ring-coral/50
                              ${nameError ? 'ring-2 ring-red-500' : ''}
                            `}
                          />
                          {nameError && (
                            <span className="text-xs text-red-400">{nameError}</span>
                          )}
                        </div>

                        {/* Duration & Weeks */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate mb-1 block">Duration</label>
                            <select
                              value={sprint.duration}
                              onChange={(e) =>
                                handleUpdateSprint(phase.id, sprint.id, { duration: e.target.value })
                              }
                              className="
                                w-full px-3 py-2 rounded-lg text-sm
                                neu-pressed bg-transparent text-white
                                focus:outline-none focus:ring-2 focus:ring-coral/50
                                [&>option]:bg-dark-surface [&>option]:text-white
                              "
                            >
                              {SPRINT_DURATION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate mb-1 block">Week Range</label>
                            <input
                              type="text"
                              value={sprint.weeks}
                              onChange={(e) =>
                                handleUpdateSprint(phase.id, sprint.id, { weeks: e.target.value })
                              }
                              placeholder="e.g., Weeks 1-2"
                              className="
                                w-full px-3 py-2 rounded-lg text-sm
                                neu-pressed bg-transparent
                                text-white placeholder:text-slate/50
                                focus:outline-none focus:ring-2 focus:ring-coral/50
                              "
                            />
                          </div>
                        </div>

                        {/* Goals */}
                        <div>
                          <label className="flex items-center gap-1 text-xs text-slate mb-1">
                            <Target className="h-3 w-3" />
                            Goals <span className="text-slate/50">(comma-separated)</span>
                          </label>
                          <input
                            type="text"
                            value={sprint.goals.join(', ')}
                            onChange={(e) =>
                              handleArrayInput(phase.id, sprint.id, 'goals', e.target.value)
                            }
                            placeholder="e.g., Setup project, Configure CI/CD, Write tests"
                            className="
                              w-full px-3 py-2 rounded-lg text-sm
                              neu-pressed bg-transparent
                              text-white placeholder:text-slate/50
                              focus:outline-none focus:ring-2 focus:ring-coral/50
                            "
                          />
                        </div>

                        {/* Deliverables */}
                        <div>
                          <label className="flex items-center gap-1 text-xs text-slate mb-1">
                            <Package className="h-3 w-3" />
                            Deliverables <span className="text-slate/50">(comma-separated)</span>
                          </label>
                          <input
                            type="text"
                            value={sprint.deliverables.join(', ')}
                            onChange={(e) =>
                              handleArrayInput(phase.id, sprint.id, 'deliverables', e.target.value)
                            }
                            placeholder="e.g., Working API, Documentation, Test suite"
                            className="
                              w-full px-3 py-2 rounded-lg text-sm
                              neu-pressed bg-transparent
                              text-white placeholder:text-slate/50
                              focus:outline-none focus:ring-2 focus:ring-coral/50
                            "
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Sprint Button */}
                  <button
                    onClick={() => handleAddSprint(phase.id, phaseIndex)}
                    className="
                      w-full py-3 rounded-xl
                      neu-flat border-2 border-dashed border-slate/30
                      text-slate hover:text-coral hover:border-coral/50
                      transition-all duration-200
                      flex items-center justify-center gap-2 text-sm
                    "
                  >
                    <Plus className="h-4 w-4" />
                    Add Sprint to {phase.title}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="neu-flat rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-coral">{phases.length}</div>
            <div className="text-xs text-slate">Phases</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-coral">
              {phases.reduce((acc, p) => acc + p.sprints.length, 0)}
            </div>
            <div className="text-xs text-slate">Sprints</div>
          </div>
        </div>
      </div>
    </div>
  );
}
