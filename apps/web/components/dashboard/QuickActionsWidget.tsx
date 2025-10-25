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

import { Plus, Book, Shield } from 'lucide-react';

export function QuickActionsWidget() {
  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <h3 className="mb-4 text-lg font-bold text-white">Quick Actions</h3>
      <div className="space-y-3">
        <button className="coral-gradient smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white">
          <Plus className="h-5 w-5" />
          <span>New Issue</span>
        </button>
        <button className="neu-raised smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-slate hover:text-white">
          <Book className="h-5 w-5" />
          <span>Add Knowledge</span>
        </button>
        <button className="neu-raised smooth-transition flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold text-slate hover:text-white">
          <Shield className="h-5 w-5" />
          <span>Security Scan</span>
        </button>
      </div>
    </div>
  );
}
