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
 */
'use client';

import { Plus, Book, Bot } from 'lucide-react';

export function QuickActionsWidget() {
  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <h3 className="mb-4 text-lg font-bold text-white">Quick Actions</h3>
      <div className="space-y-3">
        <button
          className="coral-gradient smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white"
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
