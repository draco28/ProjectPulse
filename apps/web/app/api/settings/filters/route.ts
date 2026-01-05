/**
 * GET /api/settings/filters
 *
 * Returns all available filter options for issues (status, priority, module, labels).
 * Used for dynamic filter rendering in FilterSidebar and other client components.
 *
 * Response is cached with ISR (1 hour revalidation) to minimize database queries.
 *
 * @see apps/web/lib/filters.ts for cached helper function
 * @see apps/web/types/filters.ts for response types
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFilterOptions } from '@/lib/filters';
import { filtersDTOSchema } from '@/types/filters';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

/**
 * GET handler - Fetch all filter options
 *
 * @returns {Promise<NextResponse>} JSON response with filter options or error
 *
 * Success Response (200):
 * {
 *   "data": {
 *     "status": [{ "value": "open", "label": "Open", "colorClass": "text-blue-600" }],
 *     "priority": [{ "value": "high", "label": "High", "dotColorClass": "bg-orange-600", ... }],
 *     "modules": [{ "value": "core", "label": "Core" }],
 *     "labels": [{ "id": "uuid", "name": "bug", "color": "#d73a4a" }]
 *   }
 * }
 *
 * Error Response (500):
 * {
 *   "error": "Failed to fetch filter options"
 * }
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    // Fetch filter options (uses unstable_cache with 1-hour revalidation)
    const options = await getFilterOptions();

    // Validate response shape with Zod
    const validationResult = filtersDTOSchema.safeParse(options);

    if (!validationResult.success) {
      log.error({ error: validationResult.error.message }, 'Filter options validation failed');
      return NextResponse.json({ error: 'Invalid filter options format' }, { status: 500 });
    }

    // Return validated data
    return NextResponse.json(
      { data: validationResult.data },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Error fetching filter options');
    return NextResponse.json({ error: 'Failed to fetch filter options' }, { status: 500 });
  }
}

/**
 * Route configuration
 *
 * - dynamic: 'force-static' - Pre-render at build time
 * - revalidate: 3600 - Revalidate every hour (ISR)
 */
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour
