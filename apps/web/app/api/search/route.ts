import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 10);

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

    // Search Issues
    if (type === 'all' || type === 'issues') {
      const issues = await prisma.issue.findMany({
        where: {
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
      const pages = await prisma.wikiPage.findMany({
        where: {
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
          path: true,
          category: true,
        },
      });

      results.push(
        ...pages.map((page) => ({
          id: page.id,
          type: 'wiki' as const,
          title: page.title,
          description: page.content.slice(0, 100),
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
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
