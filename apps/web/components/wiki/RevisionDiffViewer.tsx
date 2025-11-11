'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Loader2 } from 'lucide-react';

interface RevisionDiffViewerProps {
  slug: string;
  version: number;
  isLatest?: boolean;
}

export function RevisionDiffViewer({ slug, version, isLatest }: RevisionDiffViewerProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRevert = () => {
    if (isLatest) {
      return;
    }

    const confirmText = `Revert /wiki/${slug} to version v${version}?`;
    if (!window.confirm(confirmText)) {
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(`/api/wiki/${slug}/revert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version,
            reason: reason.trim() ? reason.trim() : undefined,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          setError(payload.error ?? 'Failed to revert page');
          return;
        }

        setReason('');
        router.refresh();
      } catch (err) {
        console.error('Revert failed', err);
        setError('Unexpected error while reverting page');
      }
    });
  };

  return (
    <div className="mt-4 rounded-2xl bg-black/30 p-4">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate">
        Revert note (optional)
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Describe why you're reverting..."
          className="mt-1 w-full rounded-xl border border-white/5 bg-black/30 p-3 text-sm text-white placeholder:text-slate focus:border-coral focus:outline-none"
          rows={2}
          disabled={isPending}
        />
      </label>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-slate/80">
          Restoring this revision will create a new entry and bump the version counter.
        </p>
        <button
          type="button"
          onClick={handleRevert}
          disabled={isPending || isLatest}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            isLatest
              ? 'cursor-not-allowed bg-black/40 text-slate'
              : 'bg-coral text-white hover:bg-coral/80'
          } ${isPending ? 'opacity-70' : ''}`}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          )}
          {isLatest ? 'Latest snapshot' : `Revert to v${version}`}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
