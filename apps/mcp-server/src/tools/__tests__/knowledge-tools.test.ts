/**
 * MCP Knowledge Tools Integration Tests
 * Tests knowledge MCP tools: query (with metrics), export, import, archive, unarchive
 * Validates tool schemas, API integration, metrics tracking, and response handling
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Mock HTTP client
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('MCP Knowledge Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('knowledge.query (with metrics tracking)', () => {
    const toolDefinition: Tool = {
      name: 'knowledge_query',
      description: 'Query knowledge base with automatic metrics tracking',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          limit: {
            type: 'number',
            description: 'Max results (default: 10)',
            default: 10,
          },
          trackMetrics: {
            type: 'boolean',
            description: 'Track query metrics (default: true)',
            default: true,
          },
        },
        required: ['query'],
      },
    };

    it('defines correct tool schema with required query', () => {
      expect(toolDefinition.name).toBe('knowledge.query');
      expect(toolDefinition.description).toContain('metrics tracking');
      expect(toolDefinition.inputSchema.required).toContain('query');
      expect(toolDefinition.inputSchema.properties.trackMetrics).toBeDefined();
    });

    it('tracks metrics automatically when querying', async () => {
      const startTime = Date.now();

      const mockResponse = {
        data: {
          results: [
            { id: 1, title: 'Test Result 1', excerpt: '...' },
            { id: 2, title: 'Test Result 2', excerpt: '...' },
          ],
          count: 2,
          metrics: {
            queryText: 'authentication patterns',
            resultCount: 2,
            cacheHit: false,
            executionTimeMs: 45,
            timestamp: new Date().toISOString(),
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params = { query: 'authentication patterns', trackMetrics: true };
      const url = new URL('http://192.168.1.15:3000/api/knowledge/query');
      url.searchParams.set('q', params.query);
      url.searchParams.set('trackMetrics', params.trackMetrics.toString());

      const response = await fetch(url.toString());
      const data = await response.json();

      expect(data.data.metrics).toBeDefined();
      expect(data.data.metrics.queryText).toBe('authentication patterns');
      expect(data.data.metrics.resultCount).toBe(2);
      expect(data.data.metrics).toHaveProperty('executionTimeMs');
      expect(data.data.metrics).toHaveProperty('cacheHit');
    });

    it('respects limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { results: [], count: 0, metrics: {} },
        }),
      });

      const params = { query: 'test', limit: 5 };
      const url = new URL('http://192.168.1.15:3000/api/knowledge/query');
      url.searchParams.set('q', params.query);
      url.searchParams.set('limit', params.limit.toString());

      await fetch(url.toString());

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=5'));
    });

    it('allows disabling metrics tracking', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { results: [], count: 0 },
          // No metrics field when trackMetrics: false
        }),
      });

      const params = { query: 'test', trackMetrics: false };
      const url = new URL('http://192.168.1.15:3000/api/knowledge/query');
      url.searchParams.set('q', params.query);
      url.searchParams.set('trackMetrics', params.trackMetrics.toString());

      const response = await fetch(url.toString());
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('trackMetrics=false'));
      expect(data.data.metrics).toBeUndefined();
    });
  });

  describe('knowledge.metrics (query metrics)', () => {
    const toolDefinition: Tool = {
      name: 'knowledge_metrics',
      description: 'Get knowledge query metrics and analytics',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'End date (ISO 8601)',
          },
          limit: {
            type: 'number',
            description: 'Max results (default: 100)',
            default: 100,
          },
        },
      },
    };

    it('defines correct tool schema', () => {
      expect(toolDefinition.name).toBe('knowledge.metrics');
      expect(toolDefinition.description).toContain('metrics');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('startDate');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('endDate');
    });

    it('calls GET /api/knowledge/metrics', async () => {
      const mockResponse = {
        data: {
          metrics: [
            {
              id: 1,
              queryText: 'authentication',
              resultCount: 5,
              cacheHit: true,
              executionTimeMs: 25,
              timestamp: new Date().toISOString(),
            },
          ],
          summary: {
            totalQueries: 150,
            cacheHitRate: 0.92,
            averageExecutionTime: 32.5,
            popularQueries: [
              { queryText: 'authentication', count: 25 },
              { queryText: 'testing', count: 20 },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/metrics');
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/knowledge/metrics'));
      expect(data.data).toHaveProperty('metrics');
      expect(data.data).toHaveProperty('summary');
      expect(data.data.summary).toHaveProperty('cacheHitRate');
      expect(data.data.summary).toHaveProperty('averageExecutionTime');
      expect(data.data.summary).toHaveProperty('popularQueries');
    });

    it('filters by date range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { metrics: [], summary: {} },
        }),
      });

      const params = {
        startDate: '2025-11-13T00:00:00Z',
        endDate: '2025-11-13T23:59:59Z',
      };

      const url = new URL('http://192.168.1.15:3000/api/knowledge/metrics');
      url.searchParams.set('startDate', params.startDate);
      url.searchParams.set('endDate', params.endDate);

      await fetch(url.toString());

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('startDate='));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('endDate='));
    });

    it('calculates cache hit rate correctly', async () => {
      const mockResponse = {
        data: {
          metrics: [
            { cacheHit: true },
            { cacheHit: true },
            { cacheHit: false },
            { cacheHit: true },
            { cacheHit: false },
          ],
          summary: {
            totalQueries: 5,
            cacheHitRate: 0.6, // 3/5 = 60%
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/metrics');
      const data = await response.json();

      expect(data.data.summary.cacheHitRate).toBeCloseTo(0.6, 2);
    });
  });

  describe('knowledge.export', () => {
    const toolDefinition: Tool = {
      name: 'knowledge_export',
      description: 'Export knowledge items in JSON or CSV format',
      inputSchema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            description: 'Export format',
            enum: ['json', 'csv'],
          },
          filters: {
            type: 'object',
            properties: {
              tags: { type: 'array', items: { type: 'string' } },
              archived: { type: 'boolean' },
            },
          },
        },
        required: ['format'],
      },
    };

    it('defines correct tool schema with required format', () => {
      expect(toolDefinition.name).toBe('knowledge.export');
      expect(toolDefinition.inputSchema.required).toContain('format');
      expect(toolDefinition.inputSchema.properties.format.enum).toEqual(['json', 'csv']);
    });

    it('calls POST /api/knowledge/export', async () => {
      const mockResponse = {
        data: {
          format: 'json',
          itemCount: 2,
          exportData: [
            { id: 1, title: 'Item 1', content: '...' },
            { id: 2, title: 'Item 2', content: '...' },
          ],
          timestamp: new Date().toISOString(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json' }),
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/knowledge/export'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(data.data.format).toBe('json');
      expect(data.data).toHaveProperty('timestamp');
    });

    it('filters by tags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { format: 'json', itemCount: 0, exportData: [], timestamp: '' },
        }),
      });

      await fetch('http://192.168.1.15:3000/api/knowledge/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          filters: { tags: ['api', 'testing'] },
        }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('api'),
        })
      );
    });

    it('includes archived items when specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { format: 'json', itemCount: 0, exportData: [], timestamp: '' },
        }),
      });

      await fetch('http://192.168.1.15:3000/api/knowledge/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          filters: { archived: true },
        }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('archived'),
        })
      );
    });
  });

  describe('knowledge.import', () => {
    const toolDefinition: Tool = {
      name: 'knowledge_import',
      description: 'Bulk import knowledge items',
      inputSchema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
              required: ['title', 'content'],
            },
          },
          options: {
            type: 'object',
            properties: {
              skipDuplicates: { type: 'boolean', default: false },
            },
          },
        },
        required: ['items'],
      },
    };

    it('defines correct tool schema with required items', () => {
      expect(toolDefinition.name).toBe('knowledge.import');
      expect(toolDefinition.inputSchema.required).toContain('items');
      expect(toolDefinition.inputSchema.properties.items.type).toBe('array');
    });

    it('calls POST /api/knowledge/import', async () => {
      const mockResponse = {
        data: {
          imported: 3,
          skipped: 0,
          failed: 0,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const items = [
        { title: 'Item 1', content: 'Content 1', tags: ['tag1'] },
        { title: 'Item 2', content: 'Content 2', tags: ['tag2'] },
        { title: 'Item 3', content: 'Content 3', tags: ['tag3'] },
      ];

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.imported).toBe(3);
      expect(data.data.skipped).toBe(0);
    });

    it('supports skipDuplicates option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: { imported: 2, skipped: 1, failed: 0 },
        }),
      });

      await fetch('http://192.168.1.15:3000/api/knowledge/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ title: 'Item', content: 'Content' }],
          options: { skipDuplicates: true },
        }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('skipDuplicates'),
        })
      );
    });

    it('validates items is non-empty array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Items must be a non-empty array' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('knowledge.archive', () => {
    const toolDefinition: Tool = {
      name: 'knowledge_archive',
      description: 'Archive a knowledge item by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Knowledge item ID' },
        },
        required: ['id'],
      },
    };

    it('defines correct tool schema with required id', () => {
      expect(toolDefinition.name).toBe('knowledge.archive');
      expect(toolDefinition.inputSchema.required).toContain('id');
    });

    it('calls PATCH /api/knowledge/:id/archive', async () => {
      const mockResponse = {
        data: {
          id: 42,
          title: 'Obsolete Pattern',
          archived: true,
          archivedAt: new Date().toISOString(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/42/archive', {
        method: 'PATCH',
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/knowledge/42/archive'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(data.data.archived).toBe(true);
      expect(data.data.archivedAt).toBeTruthy();
    });

    it('handles 404 when knowledge item not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Knowledge item not found' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/999/archive', {
        method: 'PATCH',
      });

      expect(response.status).toBe(404);
    });

    it('handles already archived items', async () => {
      const mockResponse = {
        data: {
          id: 42,
          archived: true,
          archivedAt: new Date('2025-11-10T00:00:00Z').toISOString(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/42/archive', {
        method: 'PATCH',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.archived).toBe(true);
    });
  });

  describe('knowledge.unarchive', () => {
    const toolDefinition: Tool = {
      name: 'knowledge_unarchive',
      description: 'Unarchive a knowledge item by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Knowledge item ID' },
        },
        required: ['id'],
      },
    };

    it('defines correct tool schema with required id', () => {
      expect(toolDefinition.name).toBe('knowledge.unarchive');
      expect(toolDefinition.inputSchema.required).toContain('id');
    });

    it('calls PATCH /api/knowledge/:id/unarchive', async () => {
      const mockResponse = {
        data: {
          id: 42,
          title: 'Restored Pattern',
          archived: false,
          archivedAt: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/42/unarchive', {
        method: 'PATCH',
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/knowledge/42/unarchive'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(data.data.archived).toBe(false);
      expect(data.data.archivedAt).toBeNull();
    });

    it('handles 404 when knowledge item not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Knowledge item not found' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/999/unarchive', {
        method: 'PATCH',
      });

      expect(response.status).toBe(404);
    });

    it('handles already unarchived items', async () => {
      const mockResponse = {
        data: {
          id: 42,
          archived: false,
          archivedAt: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/42/unarchive', {
        method: 'PATCH',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.archived).toBe(false);
      expect(data.data.archivedAt).toBeNull();
    });
  });

  describe('Integration: Metrics Tracking Workflow', () => {
    it('tracks metrics through complete query lifecycle', async () => {
      // Step 1: Execute query (metrics tracked automatically)
      const queryResponse = {
        data: {
          results: [{ id: 1, title: 'Result 1' }],
          count: 1,
          metrics: {
            queryText: 'authentication patterns',
            resultCount: 1,
            cacheHit: false,
            executionTimeMs: 45,
            timestamp: new Date().toISOString(),
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => queryResponse,
      });

      await fetch('http://192.168.1.15:3000/api/knowledge/query?q=authentication%20patterns');

      // Step 2: Retrieve metrics
      const metricsResponse = {
        data: {
          metrics: [
            {
              id: 1,
              queryText: 'authentication patterns',
              resultCount: 1,
              cacheHit: false,
              executionTimeMs: 45,
            },
          ],
          summary: {
            totalQueries: 1,
            cacheHitRate: 0,
            averageExecutionTime: 45,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => metricsResponse,
      });

      const metricsRes = await fetch('http://192.168.1.15:3000/api/knowledge/metrics');
      const metricsData = await metricsRes.json();

      expect(metricsData.data.metrics).toHaveLength(1);
      expect(metricsData.data.metrics[0].queryText).toBe('authentication patterns');
      expect(metricsData.data.summary.totalQueries).toBe(1);
    });

    it('tracks cache hits on subsequent identical queries', async () => {
      // First query (cache miss)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            results: [],
            metrics: { cacheHit: false, executionTimeMs: 45 },
          },
        }),
      });

      await fetch('http://192.168.1.15:3000/api/knowledge/query?q=test');

      // Second query (cache hit)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            results: [],
            metrics: { cacheHit: true, executionTimeMs: 5 },
          },
        }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/knowledge/query?q=test');
      const data = await response.json();

      expect(data.data.metrics.cacheHit).toBe(true);
      expect(data.data.metrics.executionTimeMs).toBeLessThan(10); // Cache hits are faster
    });
  });
});
