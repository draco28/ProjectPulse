/**
 * QuickActions Component
 *
 * Client Component with quick action buttons for issue operations
 *
 * Architecture (per react-expert recommendation):
 * - Client Component ("use client")
 * - Minimal state (just UI feedback)
 * - Explicit props (issueId, issueTitle)
 *
 * Features:
 * - Copy issue link to clipboard
 * - Pin issue (future)
 * - Watch/Subscribe (future)
 * - Share issue (future)
 * - Print view (future)
 *
 * Props:
 * - issueId: Issue identifier
 * - issueTitle: Issue title for sharing
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

'use client';

import { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface QuickActionsProps {
  issueId: string;
  issueTitle: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickActions({ issueId, issueTitle }: QuickActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  /**
   * Copy issue link to clipboard
   */
  async function handleCopyLink() {
    const url = `${window.location.origin}/issues/${issueId}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);

      // Reset after 2 seconds
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link to clipboard');
    }
  }

  /**
   * Handle print view
   */
  function handlePrint() {
    window.print();
  }

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <i className="fas fa-bolt text-coral" aria-hidden="true"></i>
        Quick Actions
      </h3>

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="neu-pressed smooth-transition flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate hover:text-white"
          aria-label="Copy issue link"
        >
          <i
            className={`fas ${copiedLink ? 'fa-check text-green-500' : 'fa-link text-coral'}`}
            aria-hidden="true"
          ></i>
          <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
        </button>

        {/* Pin Issue (Future) */}
        <button
          className="neu-pressed smooth-transition flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate hover:text-white"
          aria-label="Pin issue"
          disabled
        >
          <i className="fas fa-thumbtack text-coral" aria-hidden="true"></i>
          <span>Pin Issue</span>
        </button>

        {/* Watch Issue (Future) */}
        <button
          className="neu-pressed smooth-transition flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate hover:text-white"
          aria-label="Watch issue"
          disabled
        >
          <i className="fas fa-eye text-coral" aria-hidden="true"></i>
          <span>Watch Issue</span>
        </button>

        {/* Share Issue (Future) */}
        <button
          className="neu-pressed smooth-transition flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate hover:text-white"
          aria-label="Share issue"
          disabled
        >
          <i className="fas fa-share-alt text-coral" aria-hidden="true"></i>
          <span>Share</span>
        </button>

        {/* Print View */}
        <button
          onClick={handlePrint}
          className="neu-pressed smooth-transition flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate hover:text-white"
          aria-label="Print issue"
        >
          <i className="fas fa-print text-coral" aria-hidden="true"></i>
          <span>Print</span>
        </button>
      </div>

      {/* Future Enhancement Note */}
      <div className="mt-4 rounded-2xl border border-dashed border-[#2A2A2A] p-3 text-center">
        <p className="text-xs text-slate">
          <i className="fas fa-lightbulb mr-2 text-coral" aria-hidden="true"></i>
          More quick actions coming soon
        </p>
      </div>
    </div>
  );
}
