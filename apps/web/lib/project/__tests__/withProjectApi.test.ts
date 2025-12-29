/**
 * Unit Tests: withProjectApi.ts
 *
 * Tests for the API route wrapper utility:
 * - withProjectApi()
 * - apiSuccess()
 * - apiError()
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Mocks - Must be defined inside factory due to Jest hoisting
// ============================================================================

// Jest hoists this to run before anything else, so we define classes inline
jest.mock('@/lib/auth/validateRequest', () => {
  // Define the class inside the factory to avoid hoisting issues
  class AuthErrorMock extends Error {
    constructor(
      message: string,
      public statusCode: number = 401
    ) {
      super(message);
      this.name = 'AuthError';
    }
  }

  return {
    getAuthorizedProjectId: jest.fn(),
    AuthError: AuthErrorMock,
    authErrorResponse: (error: { message: string; statusCode: number }) => {
      // Import NextResponse at runtime to avoid circular issues
      const { NextResponse } = jest.requireActual('next/server');
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    },
  };
});

// Import module under test after mocks
import { withProjectApi, apiSuccess, apiError } from '../withProjectApi';
import { getAuthorizedProjectId, AuthError } from '@/lib/auth/validateRequest';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockRequest(
  url: string = 'http://localhost:3000/api/test',
  method: string = 'GET'
): NextRequest {
  return new NextRequest(url, { method });
}

// ============================================================================
// Setup
// ============================================================================

// Get the mocked function for test assertions
const mockedGetAuthorizedProjectId = getAuthorizedProjectId as jest.MockedFunction<
  typeof getAuthorizedProjectId
>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// withProjectApi() Tests
// ============================================================================

describe('withProjectApi()', () => {
  describe('projectId extraction', () => {
    it('should extract projectId from query params', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?projectId=42');
      mockedGetAuthorizedProjectId.mockResolvedValue({
        auth: { userId: 'user-123' },
        projectId: 42,
      });

      const handler = jest.fn().mockResolvedValue({ success: true });
      await withProjectApi(request, handler);

      expect(mockedGetAuthorizedProjectId).toHaveBeenCalledWith(request, 42);
    });

    it('should return 400 for invalid projectId (NaN)', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?projectId=invalid');

      const handler = jest.fn().mockResolvedValue({ success: true });
      const response = await withProjectApi(request, handler);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Invalid projectId: must be a number');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should use custom param name when specified', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?customId=42');
      mockedGetAuthorizedProjectId.mockResolvedValue({
        auth: { userId: 'user-123' },
        projectId: 42,
      });

      const handler = jest.fn().mockResolvedValue({ success: true });
      await withProjectApi(request, handler, { paramName: 'customId' });

      expect(mockedGetAuthorizedProjectId).toHaveBeenCalledWith(request, 42);
    });

    it('should skip query extraction when fromQuery=false', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?projectId=42');
      mockedGetAuthorizedProjectId.mockResolvedValue({
        auth: { userId: 'user-123' },
        projectId: undefined,
      });

      const handler = jest.fn().mockResolvedValue({ success: true });
      await withProjectApi(request, handler, { fromQuery: false });

      // Should pass undefined instead of 42
      expect(mockedGetAuthorizedProjectId).toHaveBeenCalledWith(request, undefined);
    });
  });

  describe('allowDefault option', () => {
    it('should return 400 when projectId missing and allowDefault=false', async () => {
      const request = createMockRequest('http://localhost:3000/api/test');
      mockedGetAuthorizedProjectId.mockResolvedValue({
        auth: { userId: 'user-123' },
        projectId: undefined, // No project resolved
      });

      const handler = jest.fn();
      const response = await withProjectApi(request, handler, { allowDefault: false });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('projectId is required');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow missing projectId when allowDefault=true (default)', async () => {
      const request = createMockRequest('http://localhost:3000/api/test');
      mockedGetAuthorizedProjectId.mockResolvedValue({
        auth: { userId: 'user-123' },
        projectId: undefined,
      });

      const handler = jest.fn().mockResolvedValue({ success: true });
      const response = await withProjectApi(request, handler);

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('handler execution', () => {
    it('should call handler with ProjectApiContext', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?projectId=3');
      const mockAuth = { userId: 'user-123', email: 'test@example.com' };
      mockedGetAuthorizedProjectId.mockResolvedValue({
        auth: mockAuth,
        projectId: 3,
      });

      const handler = jest.fn().mockResolvedValue({ items: [] });
      await withProjectApi(request, handler);

      expect(handler).toHaveBeenCalledWith({
        projectId: 3,
        auth: mockAuth,
        request,
      });
    });

    it('should return handler result as JSON response', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?projectId=3');
      mockedGetAuthorizedProjectId.mockResolvedValue({
        auth: { userId: 'user-123' },
        projectId: 3,
      });

      const handlerResult = { items: [1, 2, 3], count: 3 };
      const handler = jest.fn().mockResolvedValue(handlerResult);
      const response = await withProjectApi(request, handler);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(handlerResult);
    });
  });

  describe('error handling', () => {
    it('should return 401 for AuthError', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?projectId=3');
      // Use AuthError from mocked module so instanceof check works
      mockedGetAuthorizedProjectId.mockRejectedValue(new AuthError('Unauthorized', 401));

      const handler = jest.fn();
      const response = await withProjectApi(request, handler);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 403 for AuthError with 403 status', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?projectId=3');
      // Use AuthError from mocked module so instanceof check works
      mockedGetAuthorizedProjectId.mockRejectedValue(
        new AuthError('Access denied to project', 403)
      );

      const handler = jest.fn();
      const response = await withProjectApi(request, handler);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Access denied to project');
    });

    it('should return 500 for unexpected errors', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?projectId=3');
      mockedGetAuthorizedProjectId.mockResolvedValue({
        auth: { userId: 'user-123' },
        projectId: 3,
      });

      const handler = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await withProjectApi(request, handler);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
      expect(body.message).toBe('Database connection failed');

      consoleSpy.mockRestore();
    });

    it('should handle non-Error objects thrown', async () => {
      const request = createMockRequest('http://localhost:3000/api/test?projectId=3');
      mockedGetAuthorizedProjectId.mockResolvedValue({
        auth: { userId: 'user-123' },
        projectId: 3,
      });

      const handler = jest.fn().mockRejectedValue('String error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await withProjectApi(request, handler);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
      expect(body.message).toBe('Unknown error');

      consoleSpy.mockRestore();
    });
  });
});

// ============================================================================
// apiSuccess() Tests
// ============================================================================

describe('apiSuccess()', () => {
  it('should return JSON response with 200 status by default', async () => {
    const data = { id: 1, name: 'Test' };
    const response = apiSuccess(data);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(data);
  });

  it('should use custom status code', async () => {
    const data = { id: 1 };
    const response = apiSuccess(data, 201);

    expect(response.status).toBe(201);
  });

  it('should handle array data', async () => {
    const data = [1, 2, 3];
    const response = apiSuccess(data);

    const body = await response.json();
    expect(body).toEqual([1, 2, 3]);
  });

  it('should handle null data', async () => {
    const response = apiSuccess(null);

    const body = await response.json();
    expect(body).toBeNull();
  });
});

// ============================================================================
// apiError() Tests
// ============================================================================

describe('apiError()', () => {
  it('should return JSON error response with 400 status by default', async () => {
    const response = apiError('Bad request');

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Bad request');
  });

  it('should use custom status code', async () => {
    const response = apiError('Not found', 404);

    expect(response.status).toBe(404);
  });

  it('should include error code when provided', async () => {
    const response = apiError('Validation failed', 400, 'VALIDATION_ERROR');

    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('should not include code when not provided', async () => {
    const response = apiError('Bad request');

    const body = await response.json();
    expect(body.error).toBe('Bad request');
    expect(body.code).toBeUndefined();
  });
});
