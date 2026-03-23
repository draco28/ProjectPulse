'use client';

/**
 * NewSessionModal - Instructions for starting a new session
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Portal-rendered modal
 * - Instructions on how to start session via Claude Code
 * - Copy-to-clipboard code snippet
 * - Link to MCP tools documentation
 */

import { memo, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

// ============================================================================
// Component
// ============================================================================

export const NewSessionModal = memo(function NewSessionModal({
  isOpen,
  onClose,
  projectId,
}: NewSessionModalProps) {
  const [copied, setCopied] = useState(false);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Copy code snippet
  const codeSnippet = `projectpulse_agent_session_start({
  projectId: ${projectId},
  name: "Working on feature X",
  plan: "## Implementation Plan\\n1. First step\\n2. Second step",
  todos: [
    { content: "Task 1", status: "pending" },
    { content: "Task 2", status: "pending" }
  ],
  activeTicketIds: [123, 124]  // Optional: link to tickets
})`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [codeSnippet]);

  // Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-2xl border border-white/10 bg-dark-card',
          'animate-slide-in-up shadow-2xl'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h2 id="modal-title" className="text-lg font-semibold text-white">
            Start New Session
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate transition hover:bg-white/5 hover:text-white"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-slate">
            Agent sessions are started via Claude Code using MCP tools. Use the following command in
            your Claude Code conversation:
          </p>

          {/* Code Snippet */}
          <div className="relative">
            <pre className="neu-inset overflow-x-auto whitespace-pre rounded-lg p-4 font-mono text-xs text-green-400">
              {codeSnippet}
            </pre>
            <button
              onClick={handleCopy}
              className={cn(
                'absolute right-2 top-2 rounded px-2.5 py-1 text-xs font-medium transition',
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-slate hover:bg-white/10 hover:text-white'
              )}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Tips */}
          <div className="space-y-2 text-sm text-slate">
            <p className="font-medium text-white">Tips:</p>
            <ul className="list-inside list-disc space-y-1 text-slate/80">
              <li>
                Link tickets using <code className="text-coral">activeTicketIds</code> for automatic
                progress tracking
              </li>
              <li>
                Add a <code className="text-coral">plan</code> to preserve context across
                compactions
              </li>
              <li>
                Use <code className="text-coral">todos</code> to break work into trackable steps
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between rounded-b-2xl border-t border-white/10 bg-white/[0.02] p-5">
          <a
            href="/docs/mcp-tools-guide"
            className="text-sm text-coral transition hover:text-coral-light"
            target="_blank"
            rel="noopener noreferrer"
          >
            View MCP Tools Docs →
          </a>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Render via portal
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
});

NewSessionModal.displayName = 'NewSessionModal';

export default NewSessionModal;
