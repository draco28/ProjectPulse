'use client';

/**
 * Global Keyboard Shortcuts Hook
 * 
 * Registers individual command shortcuts (⌘D, ⌘I, ⌘W, etc.)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export function useGlobalShortcuts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const buildHref = (path: string) => {
    if (!projectId) return path;
    return `${path}?project=${projectId}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Cmd/Ctrl is pressed
      if (!(e.metaKey || e.ctrlKey)) return;

      // Check if we're in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow ⌘K even in input fields
        if (e.key === 'k') return;
        // Block other shortcuts in input fields
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'd':
          e.preventDefault();
          router.push(buildHref('/dashboard'));
          break;
        case 'i':
          e.preventDefault();
          router.push(buildHref('/tickets'));
          break;
        case 'b':
          e.preventDefault();
          router.push(buildHref('/knowledge'));
          break;
        case 'w':
          e.preventDefault();
          router.push(buildHref('/wiki'));
          break;
        case 'e':
          e.preventDefault();
          router.push(buildHref('/health'));
          break;
        case 'a':
          e.preventDefault();
          router.push(buildHref('/agents'));
          break;
        case 'r':
          e.preventDefault();
          router.push(buildHref('/roadmap'));
          break;
        case 'n':
          e.preventDefault();
          router.push(buildHref('/tickets/create'));
          break;
        case ',':
          e.preventDefault();
          if (projectId) {
            router.push(`/projects/${projectId}/settings`);
          } else {
            router.push('/app');
          }
          break;
        case '/':
          e.preventDefault();
          alert('Keyboard Shortcuts:\n\n⌘K - Command Palette\n⌘D - Dashboard\n⌘I - Issues\n⌘B - Knowledge\n⌘W - Wiki\n⌘E - Security\n⌘A - Agents\n⌘R - Roadmap\n⌘N - New Issue\n⌘, - Settings');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, projectId]);
}
