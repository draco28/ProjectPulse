/**
 * Unified API Route Handler with Project Validation
 *
 * USAGE in API Routes:
 *
 * export async function GET(request: NextRequest) {
 *   return withProjectApi(request, async ({ projectId, auth }) => {
 *     const items = await prisma.item.findMany({
 *       where: { projectId }, // Always filtered!
 *     });
 *     return { items };
 *   });
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthorizedProjectId,
  AuthError,
  authErrorResponse,
  type AuthResult,
} from '@/lib/auth/validateRequest';

export interface ProjectApiContext {
  projectId: number;
  auth: AuthResult;
  request: NextRequest;
}

export type ApiHandler<T> = (context: ProjectApiContext) => Promise<T>;

export interface WithProjectApiOptions {
  /** Extract projectId from query params (default: true) */
  fromQuery?: boolean;
  /** Query param name for projectId (default: 'projectId') */
  paramName?: string;
  /** Allow requests without projectId (uses default project) */
  allowDefault?: boolean;
}

/**
 * Wraps an API route handler with authentication and project validation.
 *
 * Features:
 * - Automatic auth validation (session or bearer token)
 * - Project access verification
 * - Standardized error responses
 * - Consistent response format
 *
 * @example
 * // GET with projectId from query
 * export async function GET(request: NextRequest) {
 *   return withProjectApi(request, async ({ projectId }) => {
 *     const items = await prisma.item.findMany({ where: { projectId } });
 *     return { items, count: items.length };
 *   });
 * }
 *
 * @example
 * // POST with projectId from body
 * export async function POST(request: NextRequest) {
 *   const body = await request.json();
 *   return withProjectApi(
 *     request,
 *     async ({ projectId }) => {
 *       const created = await prisma.item.create({
 *         data: { ...body, projectId },
 *       });
 *       return created;
 *     },
 *     { fromQuery: false }
 *   );
 * }
 */
export async function withProjectApi<T>(
  request: NextRequest,
  handler: ApiHandler<T>,
  options: WithProjectApiOptions = {}
): Promise<NextResponse> {
  const {
    fromQuery = true,
    paramName = 'projectId',
    allowDefault = true,
  } = options;

  try {
    // Extract projectId from request
    let requestedProjectId: number | undefined;

    if (fromQuery) {
      const param = request.nextUrl.searchParams.get(paramName);
      if (param) {
        requestedProjectId = parseInt(param, 10);
        if (isNaN(requestedProjectId)) {
          return NextResponse.json(
            { error: `Invalid ${paramName}: must be a number` },
            { status: 400 }
          );
        }
      }
    }

    // Validate auth and project access
    const { auth, projectId } = await getAuthorizedProjectId(
      request,
      requestedProjectId
    );

    // If no projectId and not allowed to default, error
    if (!projectId && !allowDefault) {
      return NextResponse.json(
        { error: `${paramName} is required` },
        { status: 400 }
      );
    }

    // Execute handler with validated context
    const result = await handler({ projectId, auth, request });

    // Return success response
    return NextResponse.json(result);
  } catch (error) {
    // Handle auth errors with proper status codes
    if (error instanceof AuthError) {
      return authErrorResponse(error) as NextResponse;
    }

    // Log unexpected errors
    console.error('[withProjectApi] Unexpected error:', error);

    // Return generic error
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to create a standardized success response
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Helper to create a standardized error response
 */
export function apiError(
  message: string,
  status: number = 400,
  code?: string
): NextResponse {
  return NextResponse.json(
    { error: message, ...(code && { code }) },
    { status }
  );
}
