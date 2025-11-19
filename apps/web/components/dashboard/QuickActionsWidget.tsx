/**
 * QuickActionsWidget Component
 *
 * Neumorphic quick actions widget matching the mockup
 * (dashboard-dark-neumorphic-coral.html lines 507-523)
 *
 * Features:
 * - neu-raised container with rounded-3xl
 * - coral-gradient primary button
 * - neu-raised secondary buttons
 * - Dynamic onboarding link (prominent when incomplete, reference when complete)
 */

import { Plus, Book, Bot, Rocket, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface QuickActionsWidgetProps {
  onboardingStatus?: {
    completedSessions: number; // 0-3
    isComplete: boolean;
  };
}

export function QuickActionsWidget({ onboardingStatus }: QuickActionsWidgetProps) {
  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <h3 className="mb-4 text-lg font-bold text-white">Quick Actions</h3>
      <div className="space-y-3">
        {/* Onboarding Action - Show if incomplete (Primary coral button) */}
        {onboardingStatus && !onboardingStatus.isComplete && (
          <Link
            href="/onboarding"
            className="coral-gradient smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white hover:opacity-90"
            aria-label="Complete project setup"
          >
            <Rocket className="h-5 w-5" aria-hidden="true" />
            <span>
              {onboardingStatus.completedSessions === 0
                ? 'Start Setup'
                : `Continue Setup (${onboardingStatus.completedSessions}/3)`}
            </span>
          </Link>
        )}

        {/* Onboarding Complete - Reference link (green border) */}
        {onboardingStatus?.isComplete && (
          <Link
            href="/onboarding"
            className="neu-raised smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-green-400 hover:text-green-300 border border-green-500/20"
            aria-label="View onboarding summary"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span>Setup Complete</span>
          </Link>
        )}

        {/* Create Issue - Primary action when setup complete, secondary otherwise */}
        <button
          className={
            onboardingStatus?.isComplete
              ? 'coral-gradient smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white'
              : 'neu-raised smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-slate hover:text-white'
          }
          aria-label="Create new issue"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          <span>Create Issue</span>
        </button>
        <button
          className="neu-raised smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-slate hover:text-white"
          aria-label="Add knowledge base item"
        >
          <Book className="h-5 w-5" aria-hidden="true" />
          <span>Add Knowledge</span>
        </button>
        <button
          className="neu-raised smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-slate hover:text-white"
          aria-label="Run agent"
        >
          <Bot className="h-5 w-5" aria-hidden="true" />
          <span>Run Agent</span>
        </button>
      </div>
    </div>
  );
}
