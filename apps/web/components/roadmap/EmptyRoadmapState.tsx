'use client';

/**
 * EmptyRoadmapState Component - Sprint 8.5 Phase 1B
 *
 * Displays when no roadmap exists for the project
 * - Helpful message
 * - CTA to start onboarding
 * - Neumorphic design matching roadmap page
 */

import { Map, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function EmptyRoadmapState() {
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
        This project doesn't have a roadmap yet. Complete the onboarding process to generate your
        development roadmap with phases, sprints, weeks, days, and tasks.
      </p>

      {/* CTA Button */}
      <Link
        href="/onboarding"
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white font-semibold neu-raised-hover transition-all group"
      >
        <span>Start Onboarding</span>
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        {/* Session 1 */}
        <div className="neu-flat rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-coral-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-coral-400">1</span>
            </div>
            <h4 className="font-semibold text-white text-sm">Project Overview</h4>
          </div>
          <p className="text-xs text-slate-500">
            Define your project name, goals, and target audience
          </p>
        </div>

        {/* Session 2 */}
        <div className="neu-flat rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">2</span>
            </div>
            <h4 className="font-semibold text-white text-sm">Documentation</h4>
          </div>
          <p className="text-xs text-slate-500">
            Generate 15 key documents including project plan
          </p>
        </div>

        {/* Session 3 */}
        <div className="neu-flat rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-400">3</span>
            </div>
            <h4 className="font-semibold text-white text-sm">Roadmap</h4>
          </div>
          <p className="text-xs text-slate-500">
            Auto-generate roadmap from project plan
          </p>
        </div>
      </div>

      {/* Additional Help */}
      <p className="mt-8 text-sm text-slate-500">
        Need help?{' '}
        <Link href="/docs" className="text-coral-400 hover:text-coral-300 transition-colors">
          View documentation
        </Link>
      </p>
    </div>
  );
}
