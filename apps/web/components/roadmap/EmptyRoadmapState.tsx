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
    <div className="neu-raised rounded-3xl p-12 text-center max-w-2xl mx-auto">
      {/* Icon */}
      <div className="icon-coral flex h-20 w-20 items-center justify-center rounded-2xl mx-auto mb-6">
        <Map className="h-10 w-10 text-white" />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-white mb-4">
        No Roadmap Found
      </h2>

      {/* Description */}
      <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
        Create your development roadmap to track phases, sprints, weeks, days, and tasks.
      </p>

      {/* Primary CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        {/* Create Roadmap - Primary */}
        <Link
          href={`/roadmap/create?project=${projectId}`}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white font-semibold transition-all group"
        >
          <Plus className="h-5 w-5" />
          <span>Create Roadmap</span>
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Import Roadmap - Secondary */}
        <Link
          href={`/roadmap/import?project=${projectId}`}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl neu-flat text-slate hover:text-white font-semibold transition-all group"
        >
          <Upload className="h-5 w-5" />
          <span>Import JSON</span>
        </Link>
      </div>

      {/* Info - Wizard Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        {/* Step 1 */}
        <div className="neu-flat rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-coral-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-coral-400">1</span>
            </div>
            <h4 className="font-semibold text-white text-sm">Project Info</h4>
          </div>
          <p className="text-xs text-slate-500">
            Set roadmap title, description, and start date
          </p>
        </div>

        {/* Step 2 */}
        <div className="neu-flat rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">2</span>
            </div>
            <h4 className="font-semibold text-white text-sm">Define Phases</h4>
          </div>
          <p className="text-xs text-slate-500">
            Add phases with title, duration, and description
          </p>
        </div>

        {/* Step 3 */}
        <div className="neu-flat rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-400">3</span>
            </div>
            <h4 className="font-semibold text-white text-sm">Add Sprints</h4>
          </div>
          <p className="text-xs text-slate-500">
            Define sprints with goals and deliverables
          </p>
        </div>
      </div>

      {/* Onboarding Option */}
      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <p className="text-sm text-slate-500 mb-4">
          Or use AI-assisted onboarding to generate your roadmap automatically
        </p>
        <Link
          href={`/onboarding?project=${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-coral-400 hover:text-coral-300 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Start AI Onboarding
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
