/**
 * useSessionDuration Hook - Sprint 15 Phase F
 *
 * Real-time duration timer for active agent sessions.
 * Updates every second to show elapsed time.
 *
 * @example
 * ```tsx
 * const { duration, durationMs } = useSessionDuration(session.startedAt);
 * // duration = "02:34:12"
 * // durationMs = 9252000
 * ```
 */

import { useState, useEffect, useMemo } from 'react';

interface UseSessionDurationReturn {
  /** Formatted duration string: "HH:MM:SS" */
  duration: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Formatted short duration: "2h 34m" */
  durationShort: string;
}

/**
 * Format milliseconds to HH:MM:SS
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':');
}

/**
 * Format milliseconds to short form: "2h 34m" or "45m"
 */
function formatDurationShort(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculate elapsed time since a start date.
 * Returns 0 if startedAt is in the future.
 */
function calculateElapsed(startedAt: string | Date): number {
  const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
  const elapsed = Date.now() - start.getTime();
  return Math.max(0, elapsed);
}

/**
 * Hook for real-time session duration tracking.
 *
 * @param startedAt - Session start timestamp (ISO string or Date)
 * @param enabled - Whether to run the timer (default: true)
 * @returns Duration in multiple formats
 */
export function useSessionDuration(
  startedAt: string | Date | null | undefined,
  enabled: boolean = true
): UseSessionDurationReturn {
  const [durationMs, setDurationMs] = useState(() => {
    if (!startedAt) return 0;
    return calculateElapsed(startedAt);
  });

  // Update duration every second when enabled
  useEffect(() => {
    if (!enabled || !startedAt) {
      setDurationMs(0);
      return;
    }

    // Initial calculation
    setDurationMs(calculateElapsed(startedAt));

    // Update every second
    const interval = setInterval(() => {
      setDurationMs(calculateElapsed(startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, enabled]);

  // Memoize formatted strings
  const duration = useMemo(() => formatDuration(durationMs), [durationMs]);
  const durationShort = useMemo(() => formatDurationShort(durationMs), [durationMs]);

  return {
    duration,
    durationMs,
    durationShort,
  };
}

/**
 * Calculate static duration between two dates (for completed sessions).
 *
 * @param startedAt - Session start timestamp
 * @param completedAt - Session end timestamp
 * @returns Duration in multiple formats
 */
export function calculateSessionDuration(
  startedAt: string | Date,
  completedAt: string | Date
): Omit<UseSessionDurationReturn, never> {
  const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
  const end = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;
  const durationMs = Math.max(0, end.getTime() - start.getTime());

  return {
    duration: formatDuration(durationMs),
    durationMs,
    durationShort: formatDurationShort(durationMs),
  };
}

export default useSessionDuration;
