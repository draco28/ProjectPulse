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

export function ImportPreview({
  roadmap,
  onConfirm,
  onCancel,
  isImporting,
}: ImportPreviewProps) {
  // Calculate stats
  const totalPhases = roadmap.phases.length;
  const totalSprints = roadmap.phases.reduce((acc, p) => acc + (p.sprints?.length || 0), 0);
  const totalGoals = roadmap.phases.reduce(
    (acc, p) =>
      acc + (p.sprints?.reduce((sAcc, s) => sAcc + (s.goals?.length || 0), 0) || 0),
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
        <h2 className="text-2xl font-bold text-white mb-2">Preview Import</h2>
        <p className="text-slate text-sm">
          Review the structure before importing
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="neu-pressed rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-coral mb-1">{totalPhases}</div>
          <div className="text-xs text-slate">Phases</div>
        </div>
        <div className="neu-pressed rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-coral mb-1">{totalSprints}</div>
          <div className="text-xs text-slate">Sprints</div>
        </div>
        <div className="neu-pressed rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-coral mb-1">{totalGoals}</div>
          <div className="text-xs text-slate">Goals</div>
        </div>
        <div className="neu-pressed rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-coral mb-1">{totalDeliverables}</div>
          <div className="text-xs text-slate">Deliverables</div>
        </div>
      </div>

      {/* Phase Tree */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {roadmap.phases.map((phase, phaseIndex) => (
          <div key={phaseIndex} className="neu-flat rounded-2xl overflow-hidden">
            {/* Phase Header */}
            <div className="flex items-center gap-3 p-4 border-b border-dark-pressed">
              <div className="icon-coral flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">
                  {phase.title || phase.name || `Phase ${phaseIndex + 1}`}
                </h4>
                <p className="text-xs text-slate">
                  {phase.duration || 'No duration'} •{' '}
                  {phase.sprints?.length || 0} sprint{(phase.sprints?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Sprints */}
            {phase.sprints && phase.sprints.length > 0 && (
              <div className="p-4 space-y-3">
                {phase.sprints.map((sprint, sprintIndex) => (
                  <div
                    key={sprintIndex}
                    className="neu-pressed rounded-xl p-3 ml-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-coral" />
                      <span className="font-medium text-white text-sm">{sprint.name}</span>
                      {sprint.weeks && (
                        <span className="text-xs text-slate ml-auto">{sprint.weeks}</span>
                      )}
                    </div>

                    {/* Goals */}
                    {sprint.goals && sprint.goals.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 text-xs text-slate mb-1">
                          <Target className="h-3 w-3" />
                          Goals
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {sprint.goals.slice(0, 3).map((goal, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs"
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
                        <div className="flex items-center gap-1 text-xs text-slate mb-1">
                          <Package className="h-3 w-3" />
                          Deliverables
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {sprint.deliverables.slice(0, 3).map((del, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs"
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
      <div className="neu-flat rounded-xl p-4 border border-coral/30">
        <p className="text-sm text-slate">
          <span className="text-coral font-medium">Note:</span> After import, your roadmap
          will be automatically materialized into Phases → Sprints → Weeks → Days for
          detailed tracking.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-pressed">
        <button
          onClick={onCancel}
          disabled={isImporting}
          className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-xl
            font-medium transition-all duration-200
            ${isImporting
              ? 'opacity-50 cursor-not-allowed text-slate'
              : 'neu-flat text-slate hover:text-white hover:neu-raised'
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
            inline-flex items-center gap-2 px-8 py-3 rounded-xl
            font-semibold transition-all duration-200
            ${isImporting
              ? 'opacity-50 cursor-not-allowed bg-coral/50 text-white'
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
