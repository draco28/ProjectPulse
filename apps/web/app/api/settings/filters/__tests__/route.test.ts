/**
 * API Route Tests: GET /api/settings/filters
 *
 * Tests app/api/settings/filters/route.ts endpoint configuration.
 *
 * Note: Full integration testing of this route is done via E2E tests.
 * Unit testing Next.js route handlers requires complex Response mocking.
 * The core logic (getFilterOptions, Zod validation) is tested separately.
 *
 * @see apps/web/lib/__tests__/filters.test.ts for getFilterOptions tests
 * @see apps/web/types/filters.ts for Zod schema tests
 */

// Mock Next.js modules before importing the route
jest.mock('next/cache', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  unstable_cache: <T>(fn: () => Promise<T>) => fn,
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {},
}));

// Mock Response before importing the route
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.Response = class Response {} as any;
});

describe('GET /api/settings/filters - Configuration', () => {
  it('should export ISR revalidate constant (1 hour)', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { revalidate } = require('../route');
    expect(revalidate).toBe(3600); // 1 hour in seconds
  });

  it('should export dynamic constant for static generation', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { dynamic } = require('../route');
    expect(dynamic).toBe('force-static');
  });

  it('should export GET function', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GET } = require('../route');
    expect(typeof GET).toBe('function');
  });
});

/**
 * Integration Test Notes:
 *
 * Full API route testing should be done with:
 * 1. Playwright E2E tests for actual HTTP requests
 * 2. Manual testing with curl/Postman
 *
 * The route behavior is straightforward:
 * - Calls getFilterOptions() (tested in lib/__tests__/filters.test.ts)
 * - Validates with filtersDTOSchema (Zod schema is self-validating)
 * - Returns NextResponse.json with ISR headers
 *
 * Example E2E test:
 * ```typescript
 * test('GET /api/settings/filters returns filter options', async ({ request }) => {
 *   const response = await request.get('/api/settings/filters');
 *   expect(response.status()).toBe(200);
 *   const data = await response.json();
 *   expect(data).toHaveProperty('data');
 *   expect(data.data).toHaveProperty('status');
 *   expect(data.data).toHaveProperty('priority');
 * });
 * ```
 */
