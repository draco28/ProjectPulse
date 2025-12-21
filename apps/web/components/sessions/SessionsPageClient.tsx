/**
 * SessionsPageClient Component
 *
 * Sprint 14: Client wrapper for sessions page filter sidebar
 * Handles mobile drawer behavior and desktop sidebar
 */
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SessionFilterSidebar } from './SessionFilterSidebar';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface SessionsPageClientProps {
  counts: {
    active: number;
    paused: number;
    completed: number;
  };
  projectId: number;
}

export function SessionsPageClient({ counts, projectId }: SessionsPageClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Custom hooks for accessibility
  const drawerRef = useFocusTrap(isDrawerOpen);
  useBodyScrollLock(isDrawerOpen);

  // Close drawer on navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };

    if (isDrawerOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDrawerOpen]);

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <SessionFilterSidebar counts={counts} projectId={projectId} />
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="coral-gradient smooth-transition fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-xl md:hidden"
        aria-label="Open filters"
      >
        <Filter className="h-6 w-6 text-white" />
      </button>

      {/* Mobile Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-80 bg-background p-4 shadow-xl transition-transform duration-300 md:hidden',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Filter sessions"
      >
        {/* Close Button */}
        <button
          onClick={() => setIsDrawerOpen(false)}
          className="neu-raised smooth-transition absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate hover:text-white"
          aria-label="Close filters"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Drawer Title */}
        <h2 className="mb-6 mt-2 text-lg font-bold text-white">Filters</h2>

        {/* Filter Content */}
        <SessionFilterSidebar counts={counts} projectId={projectId} />
      </div>
    </>
  );
}
