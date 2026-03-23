import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAuthorizedProjectId, AuthError, authErrorResponse } from '@/lib/auth/validateRequest';
import { createRequestLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

// Search result type for unified search
interface SearchResult {
  id: number;
  type: 'issue' | 'knowledge' | 'wiki' | 'agent';
  title: string;
  description?: string;
  url: string;
  icon: string;
  metadata?: string;
}

/**
 * GET /api/search
 *
 * Unified search across all entities (Issues, Knowledge, Wiki, Agents)
 * Used by Command Palette for keyboard-driven search
 *
 * Query params:
 * - q: Search query (required)
 * - type: Entity type filter ('all' | 'issues' | 'knowledge' | 'wiki' | 'agents')
 * - limit: Max results per type (default: 5, max: 10)
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(getRequestId(request));
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 10);

    // SECURITY: Authenticate and get authorized project
    const requestedProjectId = searchParams.get('projectId');
    const { projectId } = await getAuthorizedProjectId(
      request,
      requestedProjectId ? parseInt(requestedProjectId, 10) : undefined
    );

    if (!query.trim()) {
      return NextResponse.json({
        data: {
          results: [],
          total: 0,
        },
      });
    }

    const searchTerm = query.trim();
    const results: SearchResult[] = [];

    // Search Issues (Sprint 10: Use ticket model)
    if (type === 'all' || type === 'issues') {
      const issues = await prisma.ticket.findMany({
        where: {
          projectId, // SECURITY: Filter by authorized project
          kind: { in: ['issue', 'bug', 'scanner_finding'] },
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' as const } },
            { description: { contains: searchTerm, mode: 'insensitive' as const } },
          ],
        },
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
        },
      });

      results.push(
        ...issues.map((issue) => ({
          id: issue.id,
          type: 'issue' as const,
          title: issue.title,
          description: issue.description?.slice(0, 100),
          url: `/issues/${issue.id}`,
          icon: 'fa-bug',
          metadata: `${issue.status} • ${issue.priority} Priority`,
        }))
      );
    }

    // Search Knowledge Base
    if (type === 'all' || type === 'knowledge') {
      const articles = await prisma.knowledgeItem.findMany({
        where: {
          projectId, // SECURITY: Filter by authorized project
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' as const } },
            { content: { contains: searchTerm, mode: 'insensitive' as const } },
          ],
        },
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
        },
      });

      results.push(
        ...articles.map((article) => ({
          id: article.id,
          type: 'knowledge' as const,
          title: article.title,
          description: article.content.slice(0, 100),
          url: `/knowledge`,
          icon: 'fa-book',
          metadata: article.tags.slice(0, 2).join(', '),
        }))
      );
    }

    // Search Wiki Pages
    if (type === 'all' || type === 'wiki') {
      const categoryBoost = Prisma.sql`CASE WHEN "category" = 'reference' THEN 1.1 ELSE 1 END`;
      const wikiRows = await prisma.$queryRaw<
        Array<{
          id: number;
          title: string;
          path: string;
          category: string | null;
          highlight: string | null;
          rank: number;
        }>
      >(Prisma.sql`
        SELECT
          "id",
          "title",
          "path",
          "category",
          ts_headline(
            'english',
            "content",
            plainto_tsquery('english', ${searchTerm}),
            'MaxFragments=1, MinWords=5, MaxWords=20, StartSel=**, StopSel=**'
          ) AS highlight,
          ts_rank_cd("content_tsv", plainto_tsquery('english', ${searchTerm})) * ${categoryBoost} AS rank
        FROM "WikiPage"
        WHERE "projectId" = ${projectId}
          AND "content_tsv" @@ plainto_tsquery('english', ${searchTerm})
        ORDER BY rank DESC, "updatedAt" DESC
        LIMIT ${limit};
      `);

      results.push(
        ...wikiRows.map((page) => ({
          id: page.id,
          type: 'wiki' as const,
          title: page.title,
          description: page.highlight ?? undefined,
          url: `/wiki/${page.path.replace(/^\//, '')}`,
          icon: 'fa-file-alt',
          metadata: page.category || 'Documentation',
        }))
      );
    }

    // Search Agents
    if (type === 'all' || type === 'agents') {
      const agents = await prisma.agentPersona.findMany({
        where: {
          projectId, // SECURITY: Filter by authorized project
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' as const } },
            { description: { contains: searchTerm, mode: 'insensitive' as const } },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          expertise: true,
        },
      });

      results.push(
        ...agents.map((agent) => ({
          id: agent.id,
          type: 'agent' as const,
          title: agent.name,
          description: agent.description ?? undefined,
          url: `/agents`,
          icon: 'fa-robot',
          metadata: agent.isActive ? 'Active' : 'Inactive',
        }))
      );
    }

    // Sort by relevance (simple: exact matches first, then partial)
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTerm.toLowerCase();
      const bExact = b.title.toLowerCase() === searchTerm.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return NextResponse.json({
      data: {
        results: sortedResults,
        total: sortedResults.length,
        query: searchTerm,
      },
    });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    log.error({ error: error instanceof Error ? error.message : String(error) }, 'Search failed');
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
