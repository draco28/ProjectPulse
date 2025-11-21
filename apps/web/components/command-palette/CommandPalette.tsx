'use client';

/**
 * Command Palette Component
 * 
 * Main command palette modal with search, commands, and keyboard navigation
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCommandPalette } from './CommandPaletteProvider';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useGlobalShortcuts } from './useGlobalShortcuts';
import { CommandSearch } from './CommandSearch';
import { CommandList } from './CommandList';
import { CommandFooter } from './CommandFooter';
import { createCommands, getAllCommands } from './commands';

export function CommandPalette() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { isOpen, close, registerCommands } = useCommandPalette();

  // Enable global shortcuts
  useGlobalShortcuts();

  // Lock body scroll when open
  useBodyScrollLock(isOpen);

  // Register commands on mount
  useEffect(() => {
    const categories = createCommands(router, projectId ? parseInt(projectId, 10) : undefined);
    const allCommands = getAllCommands(categories);
    registerCommands(allCommands);
  }, [router, projectId, registerCommands]);

  if (!isOpen) return null;

  const categories = createCommands(router, projectId ? parseInt(projectId, 10) : undefined);

  return (
    <>
      {/* Backdrop */}
      <div
        className="backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Command Palette Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-32">
        <div
          className="command-palette w-full max-w-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-dark-card to-dark-lighter shadow-2xl"
          style={{
            boxShadow:
              '0 40px 120px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          {/* Search Input */}
          <CommandSearch />

          {/* Command List */}
          <CommandList categories={categories} />

          {/* Footer */}
          <CommandFooter />
        </div>
      </div>
    </>
  );
}
