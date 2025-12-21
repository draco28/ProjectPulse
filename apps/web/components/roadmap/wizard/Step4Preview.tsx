'use client';

/**
 * Step4Preview Component
 *
 * Fourth wizard step: Full roadmap preview before creation
 * - Read-only tree view
 * - Summary stats
 * - Final review
 */

import { Layers, Zap, Calendar, Target, Package, CheckCircle, AlertCircle } from 'lucide-react';
import type { WizardData } from './RoadmapWizard';

interface Step4Props {
  data: WizardData;
  errors: Record<string, string>;
}

export function Step4Preview({ data, errors }: Step4Props) {
  // Calculate stats
  const totalPhases = data.phases.length;
  const totalSprints = data.phases.reduce((acc, p) => acc + p.sprints.length, 0);
  const totalGoals = data.phases.reduce(
    (acc, p) => acc + p.sprints.reduce((sAcc, s) => sAcc + s.goals.length, 0),
    0
  );
  const totalDeliverables = data.phases.reduce(
    (acc, p) => acc + p.sprints.reduce((sAcc, s) => sAcc + s.deliverables.length, 0),
    0
  );

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Review Your Roadmap</h2>
        <p className="text-sm text-slate">Review everything before creating your roadmap</p>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="neu-flat rounded-xl border border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{errors.submit}</span>
          </div>
        </div>
      )}

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

      {/* Project Info */}
      <div className="neu-flat rounded-2xl p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <CheckCircle className="h-5 w-5 text-coral" />
          {data.title}
        </h3>

        {data.description && <p className="mb-4 text-sm text-slate">{data.description}</p>}

        <div className="flex items-center gap-2 text-sm text-slate">
          <Calendar className="h-4 w-4" />
          Starting: {formatDate(data.startDate)}
        </div>
      </div>

      {/* Phase Tree Preview */}
      <div className="space-y-4">
        {data.phases.map((phase) => (
          <div key={phase.id} className="neu-raised overflow-hidden rounded-2xl">
            {/* Phase Header */}
            <div className="flex items-center gap-3 border-b border-dark-pressed p-4">
              <div className="icon-coral flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{phase.title}</h4>
                <p className="text-xs text-slate">
                  {phase.duration} • {phase.sprints.length} sprint
                  {phase.sprints.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Sprints */}
            <div className="space-y-3 p-4">
              {phase.sprints.map((sprint) => (
                <div key={sprint.id} className="neu-flat ml-8 rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-coral" />
                    <span className="font-medium text-white">{sprint.name}</span>
                    <span className="ml-auto text-xs text-slate">
                      {sprint.duration} • {sprint.weeks}
                    </span>
                  </div>

                  {/* Goals */}
                  {sprint.goals.length > 0 && (
                    <div className="mb-2">
                      <div className="mb-1 flex items-center gap-1 text-xs text-slate">
                        <Target className="h-3 w-3" />
                        Goals
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {sprint.goals.map((goal, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400"
                          >
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deliverables */}
                  {sprint.deliverables.length > 0 && (
                    <div>
                      <div className="mb-1 flex items-center gap-1 text-xs text-slate">
                        <Package className="h-3 w-3" />
                        Deliverables
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {sprint.deliverables.map((del, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400"
                          >
                            {del}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Materialization Note */}
      <div className="neu-flat rounded-xl border border-coral/30 p-4">
        <p className="text-sm text-slate">
          <span className="font-medium text-coral">Note:</span> After creation, your roadmap will be
          automatically materialized into Phases → Sprints → Weeks → Days hierarchy for detailed
          tracking.
        </p>
      </div>
    </div>
  );
}
