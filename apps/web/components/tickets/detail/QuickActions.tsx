/**
 * QuickActions Component
 *
 * Client Component with quick action buttons for ticket operations
 * Sprint 10.5: Renamed from issue to ticket terminology
 *
 * Architecture (per react-expert recommendation):
 * - Client Component ("use client")
 * - Minimal state (just UI feedback)
 * - Explicit props (ticketId, ticketTitle)
 *
 * Features:
 * - Copy ticket link to clipboard
 * - Pin ticket (future)
 * - Watch/Subscribe (future)
 * - Share ticket (future)
 * - Print view (future)
 *
 * Props:
 * - ticketId: Ticket identifier
 * - ticketTitle: Ticket title for sharing
 *
 * Reference: mockups/Default theme/03-issue-detail-dark-neumorphic-coral.html
 */

'use client';

import { useState } from 'react';
import { Zap, Link, Check, Pin, Eye, Share2, Printer, Lightbulb } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface QuickActionsProps {
  ticketId: string;
  ticketTitle: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickActions({ ticketId, ticketTitle }: QuickActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  /**
   * Copy issue link to clipboard
   */
  async function handleCopyLink() {
    const url = `${window.location.origin}/tickets/${ticketId}`;

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
        <Zap className="h-5 w-5 text-coral" aria-hidden="true" />
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
          {copiedLink ? (
            <Check className="h-5 w-5 text-green-500" aria-hidden="true" />
          ) : (
            <Link className="h-5 w-5 text-coral" aria-hidden="true" />
          )}
          <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
        </button>

        {/* Pin Issue (Future) */}
        <button
          className="neu-pressed smooth-transition flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate hover:text-white"
          aria-label="Pin issue"
          disabled
        >
          <Pin className="h-5 w-5 text-coral" aria-hidden="true" />
          <span>Pin Issue</span>
        </button>

        {/* Watch Issue (Future) */}
        <button
          className="neu-pressed smooth-transition flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate hover:text-white"
          aria-label="Watch issue"
          disabled
        >
          <Eye className="h-5 w-5 text-coral" aria-hidden="true" />
          <span>Watch Issue</span>
        </button>

        {/* Share Issue (Future) */}
        <button
          className="neu-pressed smooth-transition flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate hover:text-white"
          aria-label="Share issue"
          disabled
        >
          <Share2 className="h-5 w-5 text-coral" aria-hidden="true" />
          <span>Share</span>
        </button>

        {/* Print View */}
        <button
          onClick={handlePrint}
          className="neu-pressed smooth-transition flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate hover:text-white"
          aria-label="Print issue"
        >
          <Printer className="h-5 w-5 text-coral" aria-hidden="true" />
          <span>Print</span>
        </button>
      </div>

      {/* Future Enhancement Note */}
      <div className="mt-4 rounded-2xl border border-dashed border-[#2A2A2A] p-3 text-center">
        <p className="flex items-center justify-center gap-2 text-xs text-slate">
          <Lightbulb className="h-4 w-4 text-coral" aria-hidden="true" />
          Additional shortcuts coming soon
        </p>
      </div>
    </div>
  );
}
