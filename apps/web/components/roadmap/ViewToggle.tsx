'use client';

/**
 * ViewToggle Component - Standalone Roadmap UI Phase D
 *
 * Toggle between Tree and Timeline views
 */

import { TreePine, BarChart3 } from 'lucide-react';

interface ViewToggleProps {
  view: 'tree' | 'timeline';
  onChange: (view: 'tree' | 'timeline') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="neu-pressed inline-flex items-center gap-1 rounded-xl p-1">
      <button
        onClick={() => onChange('tree')}
        className={`
          inline-flex items-center gap-2 rounded-lg px-4 py-2
          text-sm font-medium transition-all duration-200
          ${view === 'tree' ? 'coral-gradient text-white shadow-sm' : 'text-slate hover:text-white'}
        `}
        aria-pressed={view === 'tree'}
      >
        <TreePine className="h-4 w-4" />
        Tree
      </button>
      <button
        onClick={() => onChange('timeline')}
        className={`
          inline-flex items-center gap-2 rounded-lg px-4 py-2
          text-sm font-medium transition-all duration-200
          ${
            view === 'timeline'
              ? 'coral-gradient text-white shadow-sm'
              : 'text-slate hover:text-white'
          }
        `}
        aria-pressed={view === 'timeline'}
      >
        <BarChart3 className="h-4 w-4" />
        Timeline
      </button>
    </div>
  );
}
