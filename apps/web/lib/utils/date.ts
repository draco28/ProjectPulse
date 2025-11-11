/**
 * Date utility functions for ProjectPulse
 * Shared across components for consistent date/time formatting
 */

/**
 * Format an ISO date string to relative time (e.g., "2 hours ago")
 * Handles edge cases: future dates, invalid dates, very old dates
 *
 * @param isoString - ISO 8601 date string
 * @returns Human-readable relative time string
 *
 * @example
 * formatRelativeTime('2025-11-11T10:00:00Z') // '2 hours ago'
 * formatRelativeTime('2025-11-12T10:00:00Z') // 'in 1 day' (future)
 * formatRelativeTime('2020-01-01T00:00:00Z') // 'Jan 1, 2020' (old date)
 */
export function formatRelativeTime(isoString: string): string {
  if (!isoString || typeof isoString !== 'string') {
    return 'Unknown date';
  }

  const date = new Date(isoString);
  const now = new Date();

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Handle future dates
  if (diffMs < 0) {
    const futureDiffMins = Math.floor(-diffMs / 60000);
    const futureDiffHours = Math.floor(futureDiffMins / 60);
    const futureDiffDays = Math.floor(futureDiffHours / 24);

    if (futureDiffMins < 60) return `in ${futureDiffMins} minute${futureDiffMins === 1 ? '' : 's'}`;
    if (futureDiffHours < 24) return `in ${futureDiffHours} hour${futureDiffHours === 1 ? '' : 's'}`;
    if (futureDiffDays < 7) return `in ${futureDiffDays} day${futureDiffDays === 1 ? '' : 's'}`;

    // Future date more than a week away - show formatted date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Handle past dates
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  // More than a week ago - show formatted date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a date to a short readable format
 *
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "Nov 11, 2025")
 */
export function formatShortDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
