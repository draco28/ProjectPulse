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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'w-full max-w-lg bg-dark-card rounded-2xl border border-white/10',
          'shadow-2xl animate-slide-in-up'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 id="modal-title" className="text-lg font-semibold text-white">
            Start New Session
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate hover:text-white transition"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate leading-relaxed">
            Agent sessions are started via Claude Code using MCP tools. Use the following command in your Claude Code conversation:
          </p>

          {/* Code Snippet */}
          <div className="relative">
            <pre className="neu-inset p-4 rounded-lg text-xs font-mono text-green-400 overflow-x-auto whitespace-pre">
              {codeSnippet}
            </pre>
            <button
              onClick={handleCopy}
              className={cn(
                'absolute top-2 right-2 px-2.5 py-1 rounded text-xs font-medium transition',
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
            <ul className="list-disc list-inside space-y-1 text-slate/80">
              <li>Link tickets using <code className="text-coral">activeTicketIds</code> for automatic progress tracking</li>
              <li>Add a <code className="text-coral">plan</code> to preserve context across compactions</li>
              <li>Use <code className="text-coral">todos</code> to break work into trackable steps</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/10 bg-white/[0.02] rounded-b-2xl">
          <a
            href="/docs/mcp-tools-guide"
            className="text-sm text-coral hover:text-coral-light transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            View MCP Tools Docs →
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition"
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
