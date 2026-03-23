/**
 * Undo Toast Hook for Kanban board operations
 *
 * Provides a 5-second undo window after ticket moves with visual countdown.
 * Uses sonner for toast notifications.
 *
 * @example
 * ```tsx
 * const { showUndoToast, dismiss } = useUndoToast();
 *
 * // After a successful move
 * showUndoToast({
 *   message: 'Ticket moved to In Progress',
 *   onUndo: () => moveTicket(previousState),
 * });
 * ```
 */

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

interface UndoToastOptions {
  /** Message to display in the toast */
  message: string;
  /** Callback when user clicks Undo */
  onUndo: () => void | Promise<void>;
  /** Duration in ms before auto-dismiss (default: 5000) */
  duration?: number;
  /** Optional callback after toast is dismissed without undo */
  onDismiss?: () => void;
}

interface UseUndoToastReturn {
  /** Show an undo toast with countdown */
  showUndoToast: (options: UndoToastOptions) => string;
  /** Dismiss a specific toast by ID */
  dismiss: (toastId: string) => void;
  /** Dismiss all undo toasts */
  dismissAll: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DURATION = 5000;
const COUNTDOWN_INTERVAL = 100; // Update every 100ms for smooth animation

// ============================================================================
// Hook
// ============================================================================

export function useUndoToast(): UseUndoToastReturn {
  // Track active toast IDs for cleanup
  const activeToastsRef = useRef<Set<string>>(new Set());

  /**
   * Show an undo toast with visual countdown
   */
  const showUndoToast = useCallback((options: UndoToastOptions): string => {
    const { message, onUndo, duration = DEFAULT_DURATION, onDismiss } = options;

    let undoClicked = false;
    let timeRemaining = duration;

    // Create unique ID for this toast
    const toastId = `undo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    activeToastsRef.current.add(toastId);

    // Handle undo action
    const handleUndo = async () => {
      undoClicked = true;
      toast.dismiss(toastId);
      activeToastsRef.current.delete(toastId);

      try {
        await onUndo();
        toast.success('Action undone', { duration: 2000 });
      } catch (error) {
        console.error('[useUndoToast] Undo failed:', error);
        toast.error('Failed to undo action', { duration: 3000 });
      }
    };

    // Show toast with custom render for countdown
    toast.custom(
      (t) => (
        <div className="flex min-w-[300px] items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white shadow-lg">
          {/* Progress ring - shows countdown visually */}
          <div className="relative h-8 w-8 flex-shrink-0">
            <svg className="h-8 w-8 -rotate-90 transform">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-600"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - timeRemaining / duration)}`}
                className="text-coral transition-all duration-100"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-xs">
              {Math.ceil(timeRemaining / 1000)}
            </span>
          </div>

          {/* Message */}
          <span className="flex-1 text-sm">{message}</span>

          {/* Undo button */}
          <button
            onClick={handleUndo}
            className="rounded px-3 py-1 text-sm font-medium text-coral transition-colors hover:bg-coral/10 hover:text-coral/80"
          >
            Undo
          </button>
        </div>
      ),
      {
        id: toastId,
        duration,
        onDismiss: () => {
          activeToastsRef.current.delete(toastId);
          if (!undoClicked && onDismiss) {
            onDismiss();
          }
        },
      }
    );

    // Update countdown (for progress ring animation)
    // Note: The toast itself handles the countdown display via CSS animation
    // This interval is for the numeric countdown
    const intervalId = setInterval(() => {
      timeRemaining -= COUNTDOWN_INTERVAL;
      if (timeRemaining <= 0) {
        clearInterval(intervalId);
      }
    }, COUNTDOWN_INTERVAL);

    return toastId;
  }, []);

  /**
   * Dismiss a specific toast
   */
  const dismiss = useCallback((toastId: string) => {
    toast.dismiss(toastId);
    activeToastsRef.current.delete(toastId);
  }, []);

  /**
   * Dismiss all undo toasts
   */
  const dismissAll = useCallback(() => {
    activeToastsRef.current.forEach((id) => {
      toast.dismiss(id);
    });
    activeToastsRef.current.clear();
  }, []);

  return {
    showUndoToast,
    dismiss,
    dismissAll,
  };
}
