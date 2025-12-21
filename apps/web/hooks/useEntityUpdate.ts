'use client';

/**
 * useEntityUpdate Hook - Standalone Roadmap UI Phase E
 *
 * Hook for updating roadmap hierarchy entities (phases, sprints, weeks, days, tasks)
 * Provides optimistic updates with rollback on error
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

type EntityType = 'phases' | 'sprints' | 'weeks' | 'days' | 'tasks';
type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

interface UpdateFields {
  title?: string;
  description?: string;
  status?: Status;
}

interface UseEntityUpdateOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  refreshOnSuccess?: boolean;
}

export function useEntityUpdate(
  entityType: EntityType,
  entityId: string,
  options: UseEntityUpdateOptions = {}
) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { onSuccess, onError, refreshOnSuccess = true } = options;

  const updateEntity = useCallback(
    async (fields: UpdateFields) => {
      setIsUpdating(true);
      setError(null);

      try {
        const response = await fetch(`/api/${entityType}/${entityId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || 'Update failed');
        }

        if (refreshOnSuccess) {
          router.refresh();
        }

        onSuccess?.();
        return result.data.entity;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [entityType, entityId, refreshOnSuccess, router, onSuccess, onError]
  );

  const updateTitle = useCallback((title: string) => updateEntity({ title }), [updateEntity]);

  const updateDescription = useCallback(
    (description: string) => updateEntity({ description }),
    [updateEntity]
  );

  const updateStatus = useCallback((status: Status) => updateEntity({ status }), [updateEntity]);

  return {
    updateEntity,
    updateTitle,
    updateDescription,
    updateStatus,
    isUpdating,
    error,
  };
}

/**
 * useProgressUpdate Hook
 *
 * Hook specifically for progress updates (uses different endpoint)
 */
export function useProgressUpdate(
  entityType: EntityType,
  entityId: string,
  options: UseEntityUpdateOptions = {}
) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { onSuccess, onError, refreshOnSuccess = true } = options;

  const updateProgress = useCallback(
    async (progress: number) => {
      setIsUpdating(true);
      setError(null);

      try {
        const response = await fetch(`/api/${entityType}/${entityId}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || 'Progress update failed');
        }

        if (refreshOnSuccess) {
          router.refresh();
        }

        onSuccess?.();
        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [entityType, entityId, refreshOnSuccess, router, onSuccess, onError]
  );

  return {
    updateProgress,
    isUpdating,
    error,
  };
}
