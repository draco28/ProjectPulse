/**
 * Date Formatting Utilities
 *
 * Provides consistent date formatting across server and client to prevent hydration errors.
 * Uses 'en-US' locale explicitly to ensure MM/DD/YYYY format everywhere.
 */

/**
 * Format date consistently across server and client (MM/DD/YYYY)
 * @param date Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format datetime consistently across server and client
 * @param date Date string or Date object
 * @returns Formatted datetime string
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format date range consistently (e.g., "11/17/2025 → 11/24/2025" or "11/17/2025 → Ongoing")
 * @param startDate Start date
 * @param endDate End date (optional)
 * @returns Formatted date range
 */
export function formatDateRange(startDate: string | Date, endDate?: string | Date | null): string {
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : 'Ongoing';
  return `${start} → ${end}`;
}
