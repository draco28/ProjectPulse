import { z } from 'zod';
import type { ToolDefinition } from './types.js';

const inputSchema = z.object({
  limit: z.number().int().min(1).max(10).default(5).describe('Number of top wiki pages to list (default: 5)'),
});

type AnalyticsResponse = {
  topPages: Array<{
    id: number;
    title: string;
    path: string;
    category: string;
    views: number;
    popularity: number;
    trend: number;
  }>;
  trendingTags: Array<{ tag: string; count: number }>;
  feedback: { positive: number; negative: number; ratio: number; totalViews: number };
  generatedAt: string;
};

export const wikiAnalyticsTopPagesTool: ToolDefinition = {
  name: 'projectpulse_wiki_analytics_summary',
  description:
    'Fetch wiki analytics summary: top pages by views, trending tags, and global helpful ratio. Use this to prioritize documentation improvements.',
  schema: inputSchema,
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'How many top pages to list (1-10, default 5)',
        default: 5,
      },
    },
  },
  execute: async (params, context) => {
    const { limit } = params as z.infer<typeof inputSchema>;

    try {
      const response = await context.httpClient.get<AnalyticsResponse>('/api/wiki/analytics/top');
      const topPages = response.topPages.slice(0, limit);

      if (topPages.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '📊 No analytics data available yet. Run the aggregation job after some wiki activity.',
            },
          ],
        };
      }

      const lines = topPages
        .map((page, index) => {
          return `${index + 1}. **${page.title}** (/wiki/${page.path})
   Views: ${page.views.toLocaleString()} • Popularity: ${page.popularity.toFixed(1)} • Trend: ${
            page.trend >= 1 ? '+' : ''
          }${page.trend.toFixed(2)}
   Category: ${page.category}`;
        })
        .join('\n\n');

      const tagsSummary =
        response.trendingTags.length > 0
          ? `Trending tags: ${response.trendingTags
              .map((tag) => `#${tag.tag} (${tag.count})`)
              .join(', ')}`
          : 'Trending tags: none yet';

      const feedbackSummary = `Helpful ratio: ${response.feedback.ratio}% • Votes: ${
        response.feedback.positive + response.feedback.negative
      } • Views counted: ${response.feedback.totalViews.toLocaleString()}`;

      const summary = `📊 Wiki Analytics Summary (generated ${new Date(
        response.generatedAt
      ).toLocaleString()})

${lines}

${tagsSummary}
${feedbackSummary}`;

      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      context.logger.error('Failed to fetch wiki analytics summary', { error: errorMessage });
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to fetch wiki analytics summary: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
};
