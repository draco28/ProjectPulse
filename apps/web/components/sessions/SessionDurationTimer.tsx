'use client';

/**
 * SessionDurationTimer - Real-time session duration display
 *
 * Sprint 15 Phase F
 *
 * Features:
 * - Real-time countdown (updates every second)
 * - JetBrains Mono font for consistent digits
 * - Configurable size variants
 */

import { memo } from 'react';
import { useSessionDuration, calculateSessionDuration } from '@/hooks/useSessionDuration';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SessionDurationTimerProps {
  /** Session start time (ISO string) */
  startedAt: string;
  /** Session end time for completed sessions (ISO string) */
  completedAt?: string | null;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
  /** Whether to show the short format (2h 34m) instead of full (02:34:12) */
  shortFormat?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const SessionDurationTimer = memo(function SessionDurationTimer({
  startedAt,
  completedAt,
  size = 'md',
  className,
  shortFormat = false,
}: SessionDurationTimerProps) {
  // For completed sessions, calculate static duration
  // For active sessions, use real-time hook
  const isCompleted = !!completedAt;

  const liveTimer = useSessionDuration(startedAt, !isCompleted);

  const staticDuration = isCompleted
    ? calculateSessionDuration(startedAt, completedAt)
    : null;

  const displayDuration = staticDuration || liveTimer;
  const displayValue = shortFormat ? displayDuration.durationShort : displayDuration.duration;

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <span
      className={cn(
        'font-mono tabular-nums tracking-tight text-white',
        sizeClasses[size],
        className
      )}
      title={`Duration: ${displayDuration.duration}`}
    >
      {displayValue}
    </span>
  );
});

SessionDurationTimer.displayName = 'SessionDurationTimer';

export default SessionDurationTimer;
