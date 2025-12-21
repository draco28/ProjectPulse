'use client';

/**
 * EmptyRoadmapState Component - Standalone Roadmap UI
 *
 * Displays when no roadmap exists for the project
 * - Create roadmap via wizard (primary CTA)
 * - Import roadmap from JSON
 * - Start onboarding (secondary option)
 *
 * IMPORTANT: Must receive projectId to maintain project context across navigation
 */

import { Map, ArrowRight, Plus, Upload, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface EmptyRoadmapStateProps {
  projectId: number;
}

export function EmptyRoadmapState({ projectId }: EmptyRoadmapStateProps) {
  return (
    <div className="neu-raised mx-auto max-w-2xl rounded-3xl p-12 text-center">
      {/* Icon */}
      <div className="icon-coral mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
        <Map className="h-10 w-10 text-white" />
      </div>

      {/* Title */}
      <h2 className="mb-4 text-3xl font-bold text-white">No Roadmap Found</h2>

      {/* Description */}
      <p className="mx-auto mb-8 max-w-lg text-lg text-slate-400">
        Create your development roadmap to track phases, sprints, weeks, days, and tasks.
      </p>

      {/* Primary CTAs */}
      <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
        {/* Create Roadmap - Primary */}
        <Link
          href={`/roadmap/create?project=${projectId}`}
          className="from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r px-8 py-4 font-semibold text-white transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Create Roadmap</span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Import Roadmap - Secondary */}
        <Link
          href={`/roadmap/import?project=${projectId}`}
          className="neu-flat group inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-semibold text-slate transition-all hover:text-white"
        >
          <Upload className="h-5 w-5" />
          <span>Import JSON</span>
        </Link>
      </div>

      {/* Info - Wizard Steps */}
      <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
        {/* Step 1 */}
        <div className="neu-flat rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-coral-500/20 flex h-6 w-6 items-center justify-center rounded-lg">
              <span className="text-coral-400 text-xs font-bold">1</span>
            </div>
            <h4 className="text-sm font-semibold text-white">Project Info</h4>
          </div>
          <p className="text-xs text-slate-500">Set roadmap title, description, and start date</p>
        </div>

        {/* Step 2 */}
        <div className="neu-flat rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20">
              <span className="text-xs font-bold text-blue-400">2</span>
            </div>
            <h4 className="text-sm font-semibold text-white">Define Phases</h4>
          </div>
          <p className="text-xs text-slate-500">Add phases with title, duration, and description</p>
        </div>

        {/* Step 3 */}
        <div className="neu-flat rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20">
              <span className="text-xs font-bold text-emerald-400">3</span>
            </div>
            <h4 className="text-sm font-semibold text-white">Add Sprints</h4>
          </div>
          <p className="text-xs text-slate-500">Define sprints with goals and deliverables</p>
        </div>
      </div>

      {/* Onboarding Option */}
      <div className="mt-8 border-t border-slate-700/50 pt-6">
        <p className="mb-4 text-sm text-slate-500">
          Or use AI-assisted onboarding to generate your roadmap automatically
        </p>
        <Link
          href={`/onboarding?project=${projectId}`}
          className="text-coral-400 hover:text-coral-300 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Start AI Onboarding
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
