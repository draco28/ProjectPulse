/**
 * Request Context Unit Tests
 *
 * Tests for request context utilities (Ticket #135).
 * Part of Phase 2: Observability Infrastructure DoD verification (Ticket #138).
 *
 * @module lib/__tests__/request-context.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  REQUEST_ID_HEADER,
  getRequestId,
  getRequestContext,
  type RequestContext,
} from '../request-context';

// ─────────────────────────────────────────────────────────────
// Test Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Create a mock Request object with specified headers.
 */
function createMockRequest(
  headers: Record<string, string> = {},
  url = 'http://localhost:3000/api/test',
  method = 'GET'
): Request {
  return new Request(url, {
    method,
    headers: new Headers(headers),
  });
}

// ─────────────────────────────────────────────────────────────
// REQUEST_ID_HEADER Constant Tests
// ─────────────────────────────────────────────────────────────

describe('Request Context', () => {
  describe('REQUEST_ID_HEADER constant', () => {
    it('exports the correct header name', () => {
      expect(REQUEST_ID_HEADER).toBe('x-request-id');
    });

    it('is lowercase (HTTP/2 standard)', () => {
      expect(REQUEST_ID_HEADER).toBe(REQUEST_ID_HEADER.toLowerCase());
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getRequestId Tests
  // ─────────────────────────────────────────────────────────────

  describe('getRequestId', () => {
    it('returns request ID from x-request-id header', () => {
      const request = createMockRequest({
        'x-request-id': 'test-id-123',
      });

      const result = getRequestId(request);

      expect(result).toBe('test-id-123');
    });

    it('returns empty string when header is missing', () => {
      const request = createMockRequest({});

      const result = getRequestId(request);

      expect(result).toBe('');
    });

    it('handles UUID format request IDs', () => {
      const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const request = createMockRequest({
        'x-request-id': uuid,
      });

      const result = getRequestId(request);

      expect(result).toBe(uuid);
    });

    it('handles short request IDs', () => {
      const request = createMockRequest({
        'x-request-id': 'abc',
      });

      const result = getRequestId(request);

      expect(result).toBe('abc');
    });

    it('handles request IDs with special characters', () => {
      const request = createMockRequest({
        'x-request-id': 'req_123-abc.xyz',
      });

      const result = getRequestId(request);

      expect(result).toBe('req_123-abc.xyz');
    });

    it('is case-insensitive for header name (HTTP spec)', () => {
      // Headers API normalizes to lowercase, but this tests the constant usage
      const request = createMockRequest({
        'X-Request-ID': 'mixed-case-test',
      });

      const result = getRequestId(request);

      expect(result).toBe('mixed-case-test');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // getRequestContext Tests
  // ─────────────────────────────────────────────────────────────

  describe('getRequestContext', () => {
    it('returns complete RequestContext object', () => {
      const request = createMockRequest(
        {
          'x-request-id': 'ctx-test-123',
          'user-agent': 'TestAgent/1.0',
          'x-forwarded-for': '192.168.1.100',
        },
        'http://localhost:3000/api/tickets',
        'POST'
      );

      const result = getRequestContext(request);

      expect(result).toEqual<RequestContext>({
        requestId: 'ctx-test-123',
        userAgent: 'TestAgent/1.0',
        ip: '192.168.1.100',
        path: '/api/tickets',
        method: 'POST',
      });
    });

    it('extracts path from URL correctly', () => {
      const request = createMockRequest(
        {},
        'http://localhost:3000/api/knowledge/search?q=test',
        'GET'
      );

      const result = getRequestContext(request);

      expect(result.path).toBe('/api/knowledge/search');
    });

    it('extracts method correctly', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        const request = createMockRequest({}, 'http://localhost:3000/api/test', method);
        const result = getRequestContext(request);
        expect(result.method).toBe(method);
      });
    });

    it('returns null for userAgent when header missing', () => {
      const request = createMockRequest({});

      const result = getRequestContext(request);

      expect(result.userAgent).toBeNull();
    });

    it('returns null for ip when no IP headers present', () => {
      const request = createMockRequest({});

      const result = getRequestContext(request);

      expect(result.ip).toBeNull();
    });

    it('handles complex URL paths', () => {
      const request = createMockRequest(
        {},
        'http://localhost:3000/api/tickets/123/comments',
        'GET'
      );

      const result = getRequestContext(request);

      expect(result.path).toBe('/api/tickets/123/comments');
    });

    it('handles root path', () => {
      const request = createMockRequest({}, 'http://localhost:3000/', 'GET');

      const result = getRequestContext(request);

      expect(result.path).toBe('/');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Client IP Extraction Tests
  // ─────────────────────────────────────────────────────────────

  describe('client IP extraction', () => {
    it('extracts IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '203.0.113.195',
      });

      const result = getRequestContext(request);

      expect(result.ip).toBe('203.0.113.195');
    });

    it('extracts first IP from x-forwarded-for with multiple proxies', () => {
      // Format: client, proxy1, proxy2
      const request = createMockRequest({
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      });

      const result = getRequestContext(request);

      // Should return the original client IP (first in chain)
      expect(result.ip).toBe('203.0.113.195');
    });

    it('trims whitespace from x-forwarded-for IPs', () => {
      const request = createMockRequest({
        'x-forwarded-for': '  192.168.1.1  , 10.0.0.1',
      });

      const result = getRequestContext(request);

      expect(result.ip).toBe('192.168.1.1');
    });

    it('falls back to x-real-ip when x-forwarded-for is missing', () => {
      const request = createMockRequest({
        'x-real-ip': '10.0.0.50',
      });

      const result = getRequestContext(request);

      expect(result.ip).toBe('10.0.0.50');
    });

    it('falls back to cf-connecting-ip (Cloudflare)', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '172.16.0.1',
      });

      const result = getRequestContext(request);

      expect(result.ip).toBe('172.16.0.1');
    });

    it('prefers x-forwarded-for over x-real-ip', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.100',
        'x-real-ip': '10.0.0.1',
      });

      const result = getRequestContext(request);

      expect(result.ip).toBe('192.168.1.100');
    });

    it('prefers x-real-ip over cf-connecting-ip', () => {
      const request = createMockRequest({
        'x-real-ip': '10.0.0.1',
        'cf-connecting-ip': '172.16.0.1',
      });

      const result = getRequestContext(request);

      expect(result.ip).toBe('10.0.0.1');
    });

    it('handles IPv6 addresses', () => {
      const request = createMockRequest({
        'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      });

      const result = getRequestContext(request);

      expect(result.ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('handles IPv6 loopback', () => {
      const request = createMockRequest({
        'x-forwarded-for': '::1',
      });

      const result = getRequestContext(request);

      expect(result.ip).toBe('::1');
    });

    it('handles empty x-forwarded-for gracefully', () => {
      const request = createMockRequest({
        'x-forwarded-for': '',
        'x-real-ip': '10.0.0.1',
      });

      const result = getRequestContext(request);

      // Should fall back to x-real-ip when x-forwarded-for is empty
      expect(result.ip).toBe('10.0.0.1');
    });

    it('returns null when all IP headers are missing', () => {
      const request = createMockRequest({
        'user-agent': 'TestAgent',
        'content-type': 'application/json',
      });

      const result = getRequestContext(request);

      expect(result.ip).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles request with all fields populated', () => {
      const request = createMockRequest(
        {
          'x-request-id': 'full-request-123',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'x-real-ip': '172.16.0.1',
          'cf-connecting-ip': '8.8.8.8',
        },
        'https://api.example.com/api/v1/users/profile',
        'PATCH'
      );

      const result = getRequestContext(request);

      expect(result).toEqual<RequestContext>({
        requestId: 'full-request-123',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ip: '192.168.1.1', // First from x-forwarded-for
        path: '/api/v1/users/profile',
        method: 'PATCH',
      });
    });

    it('handles request with no headers', () => {
      const request = createMockRequest({}, 'http://localhost:3000/health', 'GET');

      const result = getRequestContext(request);

      expect(result).toEqual<RequestContext>({
        requestId: '',
        userAgent: null,
        ip: null,
        path: '/health',
        method: 'GET',
      });
    });

    it('handles URL with port number', () => {
      const request = createMockRequest({}, 'http://localhost:8080/api/test', 'GET');

      const result = getRequestContext(request);

      expect(result.path).toBe('/api/test');
    });

    it('handles URL with query string', () => {
      const request = createMockRequest(
        {},
        'http://localhost:3000/api/search?q=test&limit=10&page=1',
        'GET'
      );

      const result = getRequestContext(request);

      // Path should NOT include query string
      expect(result.path).toBe('/api/search');
    });

    it('handles URL with hash fragment', () => {
      // Note: hash fragments typically aren't sent to server, but test parsing
      const request = createMockRequest(
        {},
        'http://localhost:3000/api/docs#section1',
        'GET'
      );

      const result = getRequestContext(request);

      expect(result.path).toBe('/api/docs');
    });
  });
});
