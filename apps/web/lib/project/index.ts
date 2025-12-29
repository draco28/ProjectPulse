/**
 * Unified Project Context Utilities
 *
 * Export all project-related utilities from a single entry point.
 *
 * @example
 * // Server components
 * import { withProjectAuth, withProjectOnly } from '@/lib/project';
 *
 * // API routes
 * import { withProjectApi, apiSuccess, apiError } from '@/lib/project';
 *
 * // Client components
 * import { useProject, ProjectProvider } from '@/lib/project';
 */

// Server-side utilities
export {
  withProjectAuth,
  withProjectOnly,
  type ProjectAuthContext,
  type WithProjectAuthOptions,
} from './withProjectAuth';

// API route utilities
export {
  withProjectApi,
  apiSuccess,
  apiError,
  type ProjectApiContext,
  type ApiHandler,
  type WithProjectApiOptions,
} from './withProjectApi';

// Client-side utilities
export {
  ProjectProvider,
  useProject,
  useProjectOptional,
  type ProjectContextValue,
} from './ProjectContext';
