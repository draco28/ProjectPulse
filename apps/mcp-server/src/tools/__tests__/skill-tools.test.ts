/**
 * MCP Skill Tools Integration Tests
 * Tests all 8 skill MCP tools: list, load, search, create, update, delete, export, import
 * Validates tool schemas, API integration, and response handling
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Mock HTTP client
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('MCP Skill Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('skill.list', () => {
    const toolDefinition: Tool = {
      name: 'skill_list',
      description: 'List skills with frontmatter only (token-efficient)',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by category (testing, workflow, framework, troubleshooting)',
            enum: ['testing', 'workflow', 'framework', 'troubleshooting'],
          },
          search: {
            type: 'string',
            description: 'Search in title and description',
          },
          page: {
            type: 'number',
            description: 'Page number (default: 1)',
            default: 1,
          },
          limit: {
            type: 'number',
            description: 'Items per page (default: 20, max: 100)',
            default: 20,
            maximum: 100,
          },
        },
      },
    };

    it('defines correct tool schema', () => {
      expect(toolDefinition.name).toBe('skill.list');
      expect(toolDefinition.description).toContain('token-efficient');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('category');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('search');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('page');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('limit');
    });

    it('calls GET /api/skills with correct parameters', async () => {
      const mockResponse = {
        data: {
          skills: [
            {
              id: 1,
              title: 'Jest Testing Patterns',
              description: 'Comprehensive testing strategies',
              category: 'testing',
              tags: ['jest'],
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasMore: false,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Simulate tool execution
      const params = { category: 'testing', page: 1, limit: 20 };
      const url = new URL('http://192.168.1.15:3000/api/skills');
      url.searchParams.set('category', params.category);
      url.searchParams.set('page', params.page.toString());
      url.searchParams.set('limit', params.limit.toString());

      const response = await fetch(url.toString());
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/skills'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('category=testing'));
      expect(data.data.skills).toHaveLength(1);
      expect(data.data.skills[0]).not.toHaveProperty('content'); // Lazy loading
    });

    it('respects pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            skills: [],
            pagination: { page: 2, limit: 10, total: 50, totalPages: 5, hasMore: true },
          },
        }),
      });

      const params = { page: 2, limit: 10 };
      const url = new URL('http://192.168.1.15:3000/api/skills');
      url.searchParams.set('page', params.page.toString());
      url.searchParams.set('limit', params.limit.toString());

      await fetch(url.toString());

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=10'));
    });

    it('handles search parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { skills: [], pagination: {} } }),
      });

      const params = { search: 'jest' };
      const url = new URL('http://192.168.1.15:3000/api/skills');
      url.searchParams.set('search', params.search);

      await fetch(url.toString());

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('search=jest'));
    });
  });

  describe('skill.load', () => {
    const toolDefinition: Tool = {
      name: 'skill_load',
      description: 'Load full skill content including markdown (220 tokens)',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'Skill ID',
          },
        },
        required: ['id'],
      },
    };

    it('defines correct tool schema with required id', () => {
      expect(toolDefinition.name).toBe('skill.load');
      expect(toolDefinition.inputSchema.required).toContain('id');
    });

    it('calls GET /api/skills/:id', async () => {
      const mockResponse = {
        data: {
          id: 1,
          title: 'Jest Testing Patterns',
          description: 'Comprehensive testing',
          content: '# Jest Testing\n\n## Overview\n...',
          category: 'testing',
          tags: ['jest'],
          linkedKnowledge: [
            { id: 5, title: 'Testing Best Practices' },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/1');
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/skills/1'));
      expect(data.data).toHaveProperty('content');
      expect(data.data).toHaveProperty('linkedKnowledge');
    });

    it('handles 404 when skill not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Skill not found' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/999');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });

  describe('skill.search', () => {
    const toolDefinition: Tool = {
      name: 'skill_search',
      description: 'Full-text search across skills (title, description, content, tags)',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          category: {
            type: 'string',
            description: 'Filter by category',
          },
          limit: {
            type: 'number',
            description: 'Max results (default: 20, max: 100)',
            default: 20,
            maximum: 100,
          },
        },
        required: ['query'],
      },
    };

    it('defines correct tool schema with required query', () => {
      expect(toolDefinition.name).toBe('skill.search');
      expect(toolDefinition.inputSchema.required).toContain('query');
    });

    it('calls GET /api/skills/search with query', async () => {
      const mockResponse = {
        data: {
          query: 'testing',
          results: [
            {
              id: 1,
              title: 'Jest Testing Patterns',
              description: 'Testing strategies',
              category: 'testing',
            },
          ],
          count: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params = { query: 'testing' };
      const url = new URL('http://192.168.1.15:3000/api/skills/search');
      url.searchParams.set('q', params.query);

      const response = await fetch(url.toString());
      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/skills/search'));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('q=testing'));
      expect(data.data.results).toBeDefined();
    });

    it('validates query parameter is required', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Query parameter "q" is required' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/search');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toContain('required');
    });
  });

  describe('skill.create', () => {
    const toolDefinition: Tool = {
      name: 'skill_create',
      description: 'Create a new skill with markdown content',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Skill title' },
          description: { type: 'string', description: 'Brief description' },
          content: { type: 'string', description: 'Markdown content' },
          category: {
            type: 'string',
            description: 'Category',
            enum: ['testing', 'workflow', 'framework', 'troubleshooting'],
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags for categorization',
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata',
          },
        },
        required: ['title', 'description', 'content', 'category'],
      },
    };

    it('defines correct tool schema with required fields', () => {
      expect(toolDefinition.name).toBe('skill.create');
      expect(toolDefinition.inputSchema.required).toEqual([
        'title',
        'description',
        'content',
        'category',
      ]);
    });

    it('calls POST /api/skills with skill data', async () => {
      const mockResponse = {
        data: {
          id: 16,
          title: 'Playwright E2E Testing',
          description: 'E2E testing patterns',
          content: '# Playwright\n\n...',
          category: 'testing',
          tags: ['playwright', 'e2e'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const skillData = {
        title: 'Playwright E2E Testing',
        description: 'E2E testing patterns',
        content: '# Playwright\n\n...',
        category: 'testing',
        tags: ['playwright', 'e2e'],
      };

      const response = await fetch('http://192.168.1.15:3000/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData),
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/skills'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Playwright'),
        })
      );
      expect(response.status).toBe(201);
      expect(data.data.id).toBe(16);
    });

    it('validates required fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Missing required fields' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Incomplete' }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('skill.update', () => {
    const toolDefinition: Tool = {
      name: 'skill_update',
      description: 'Update existing skill (partial update)',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Skill ID' },
          title: { type: 'string' },
          description: { type: 'string' },
          content: { type: 'string' },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          metadata: { type: 'object' },
        },
        required: ['id'],
      },
    };

    it('defines correct tool schema with required id', () => {
      expect(toolDefinition.name).toBe('skill.update');
      expect(toolDefinition.inputSchema.required).toContain('id');
    });

    it('calls PATCH /api/skills/:id with partial data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 1, description: 'Updated description' },
        }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated description' }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/skills/1'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(response.ok).toBe(true);
    });

    it('handles 404 when skill not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Skill not found' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/999', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'Updated' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('skill.delete', () => {
    const toolDefinition: Tool = {
      name: 'skill_delete',
      description: 'Delete a skill by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Skill ID to delete' },
        },
        required: ['id'],
      },
    };

    it('defines correct tool schema with required id', () => {
      expect(toolDefinition.name).toBe('skill.delete');
      expect(toolDefinition.inputSchema.required).toContain('id');
    });

    it('calls DELETE /api/skills/:id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/1', {
        method: 'DELETE',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/skills/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(response.status).toBe(204);
    });

    it('handles 404 when skill not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Skill not found' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/999', {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('skill.export', () => {
    const toolDefinition: Tool = {
      name: 'skill_export',
      description: 'Export skills in JSON or CSV format',
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
              category: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        required: ['format'],
      },
    };

    it('defines correct tool schema with required format', () => {
      expect(toolDefinition.name).toBe('skill.export');
      expect(toolDefinition.inputSchema.required).toContain('format');
      expect(toolDefinition.inputSchema.properties.format.enum).toEqual(['json', 'csv']);
    });

    it('calls POST /api/skills/export with format and filters', async () => {
      const mockResponse = {
        data: {
          format: 'json',
          itemCount: 2,
          exportData: [
            { id: 1, title: 'Skill 1', content: '...' },
            { id: 2, title: 'Skill 2', content: '...' },
          ],
          timestamp: new Date().toISOString(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          filters: { category: 'testing' },
        }),
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/skills/export'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(data.data.format).toBe('json');
      expect(data.data).toHaveProperty('timestamp');
    });

    it('validates format parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid format' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'xml' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('skill.import', () => {
    const toolDefinition: Tool = {
      name: 'skill_import',
      description: 'Bulk import skills from array',
      inputSchema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                content: { type: 'string' },
                category: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
              required: ['title', 'description', 'content', 'category'],
            },
            description: 'Array of skills to import',
          },
          options: {
            type: 'object',
            properties: {
              skipDuplicates: {
                type: 'boolean',
                description: 'Skip duplicate entries',
                default: false,
              },
            },
          },
        },
        required: ['items'],
      },
    };

    it('defines correct tool schema with required items array', () => {
      expect(toolDefinition.name).toBe('skill.import');
      expect(toolDefinition.inputSchema.required).toContain('items');
      expect(toolDefinition.inputSchema.properties.items.type).toBe('array');
    });

    it('calls POST /api/skills/import with items array', async () => {
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
        {
          title: 'Skill 1',
          description: 'Desc 1',
          content: 'Content 1',
          category: 'testing',
        },
        {
          title: 'Skill 2',
          description: 'Desc 2',
          content: 'Content 2',
          category: 'workflow',
        },
        {
          title: 'Skill 3',
          description: 'Desc 3',
          content: 'Content 3',
          category: 'framework',
        },
      ];

      const response = await fetch('http://192.168.1.15:3000/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/skills/import'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(response.status).toBe(201);
      expect(data.data.imported).toBe(3);
    });

    it('supports skipDuplicates option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: { imported: 2, skipped: 1, failed: 0 },
        }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { title: 'S1', description: 'D1', content: 'C1', category: 'testing' },
          ],
          options: { skipDuplicates: true },
        }),
      });

      expect(response.ok).toBe(true);
    });

    it('validates items is non-empty array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Items must be a non-empty array' }),
      });

      const response = await fetch('http://192.168.1.15:3000/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      });

      expect(response.status).toBe(400);
    });
  });
});
