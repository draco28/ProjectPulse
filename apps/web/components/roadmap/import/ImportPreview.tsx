'use client';

/**
 * ImportPreview Component
 *
 * Shows parsed roadmap structure before import
 * - Phase/Sprint hierarchy preview
 * - Summary stats
 * - Confirm/Cancel actions
 */

import { Layers, Zap, Target, Package, Loader2, ArrowLeft, Upload } from 'lucide-react';
import type { ParsedRoadmap } from './RoadmapImport';

interface ImportPreviewProps {
  roadmap: ParsedRoadmap;
  onConfirm: () => void;
  onCancel: () => void;
  isImporting: boolean;
}

export function ImportPreview({ roadmap, onConfirm, onCancel, isImporting }: ImportPreviewProps) {
  // Calculate stats
  const totalPhases = roadmap.phases.length;
  const totalSprints = roadmap.phases.reduce((acc, p) => acc + (p.sprints?.length || 0), 0);
  const totalGoals = roadmap.phases.reduce(
    (acc, p) => acc + (p.sprints?.reduce((sAcc, s) => sAcc + (s.goals?.length || 0), 0) || 0),
    0
  );
  const totalDeliverables = roadmap.phases.reduce(
    (acc, p) =>
      acc + (p.sprints?.reduce((sAcc, s) => sAcc + (s.deliverables?.length || 0), 0) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Preview Import</h2>
        <p className="text-sm text-slate">Review the structure before importing</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="neu-pressed rounded-2xl p-4 text-center">
          <div className="mb-1 text-3xl font-bold text-coral">{totalPhases}</div>
          <div className="text-xs text-slate">Phases</div>
        </div>
        <div className="neu-pressed rounded-2xl p-4 text-center">
          <div className="mb-1 text-3xl font-bold text-coral">{totalSprints}</div>
          <div className="text-xs text-slate">Sprints</div>
        </div>
        <div className="neu-pressed rounded-2xl p-4 text-center">
          <div className="mb-1 text-3xl font-bold text-coral">{totalGoals}</div>
          <div className="text-xs text-slate">Goals</div>
        </div>
        <div className="neu-pressed rounded-2xl p-4 text-center">
          <div className="mb-1 text-3xl font-bold text-coral">{totalDeliverables}</div>
          <div className="text-xs text-slate">Deliverables</div>
        </div>
      </div>

      {/* Phase Tree */}
      <div className="max-h-[400px] space-y-4 overflow-y-auto pr-2">
        {roadmap.phases.map((phase, phaseIndex) => (
          <div key={phaseIndex} className="neu-flat overflow-hidden rounded-2xl">
            {/* Phase Header */}
            <div className="flex items-center gap-3 border-b border-dark-pressed p-4">
              <div className="icon-coral flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">
                  {phase.title || phase.name || `Phase ${phaseIndex + 1}`}
                </h4>
                <p className="text-xs text-slate">
                  {phase.duration || 'No duration'} • {phase.sprints?.length || 0} sprint
                  {(phase.sprints?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Sprints */}
            {phase.sprints && phase.sprints.length > 0 && (
              <div className="space-y-3 p-4">
                {phase.sprints.map((sprint, sprintIndex) => (
                  <div key={sprintIndex} className="neu-pressed ml-4 rounded-xl p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-coral" />
                      <span className="text-sm font-medium text-white">{sprint.name}</span>
                      {sprint.weeks && (
                        <span className="ml-auto text-xs text-slate">{sprint.weeks}</span>
                      )}
                    </div>

                    {/* Goals */}
                    {sprint.goals && sprint.goals.length > 0 && (
                      <div className="mb-2">
                        <div className="mb-1 flex items-center gap-1 text-xs text-slate">
                          <Target className="h-3 w-3" />
                          Goals
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {sprint.goals.slice(0, 3).map((goal, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400"
                            >
                              {goal}
                            </span>
                          ))}
                          {sprint.goals.length > 3 && (
                            <span className="text-xs text-slate">
                              +{sprint.goals.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deliverables */}
                    {sprint.deliverables && sprint.deliverables.length > 0 && (
                      <div>
                        <div className="mb-1 flex items-center gap-1 text-xs text-slate">
                          <Package className="h-3 w-3" />
                          Deliverables
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {sprint.deliverables.slice(0, 3).map((del, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400"
                            >
                              {del}
                            </span>
                          ))}
                          {sprint.deliverables.length > 3 && (
                            <span className="text-xs text-slate">
                              +{sprint.deliverables.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Materialization Note */}
      <div className="neu-flat rounded-xl border border-coral/30 p-4">
        <p className="text-sm text-slate">
          <span className="font-medium text-coral">Note:</span> After import, your roadmap will be
          automatically materialized into Phases → Sprints → Weeks → Days for detailed tracking.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-dark-pressed pt-4">
        <button
          onClick={onCancel}
          disabled={isImporting}
          className={`
            inline-flex items-center gap-2 rounded-xl px-6 py-3
            font-medium transition-all duration-200
            ${
              isImporting
                ? 'cursor-not-allowed text-slate opacity-50'
                : 'neu-flat hover:neu-raised text-slate hover:text-white'
            }
          `}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          onClick={onConfirm}
          disabled={isImporting}
          className={`
            inline-flex items-center gap-2 rounded-xl px-8 py-3
            font-semibold transition-all duration-200
            ${
              isImporting
                ? 'cursor-not-allowed bg-coral/50 text-white opacity-50'
                : 'coral-gradient text-white hover:shadow-lg hover:shadow-coral/20'
            }
          `}
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import Roadmap
            </>
          )}
        </button>
      </div>
    </div>
  );
}
