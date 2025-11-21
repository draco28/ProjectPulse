'use client';

/**
 * Command Footer Component
 * 
 * Footer with keyboard navigation hints
 */

export function CommandFooter() {
  return (
    <div className="command-footer border-t border-[#1F1F1F] bg-[#1F1F1F]/50 p-4">
      <div className="flex items-center justify-between text-xs text-slate">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="rounded px-1.5 py-0.5 font-mono neu-raised">↑</kbd>
            <kbd className="rounded px-1.5 py-0.5 font-mono neu-raised ml-1">↓</kbd>
            <span className="ml-1">to navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded px-1.5 py-0.5 font-mono neu-raised">↵</kbd>
            <span className="ml-1">to select</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded px-1.5 py-0.5 font-mono neu-raised">ESC</kbd>
            <span className="ml-1">to close</span>
          </span>
        </div>
        <span className="text-coral">Type to search...</span>
      </div>
    </div>
  );
}
