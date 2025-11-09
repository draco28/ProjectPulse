/**
 * Standard API Response Types
 *
 * All API routes should return responses conforming to these types.
 */

/**
 * Standard API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Standard API response wrapper
 *
 * Success: { data: T, error: null }
 * Error: { data: null, error: ApiError }
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}
