'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Network,
  PersonStanding,
  Shield,
  Lightbulb,
  TrendingUp,
  Clock,
  Eye,
  LucideIcon,
} from 'lucide-react';

interface ArticleCardProps {
  article: {
    id: number;
    title: string;
    excerpt: string;
    category: string | null;
    tags: string[];
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    views: number;
    relevance: number;
  };
}

// Memoize to prevent re-renders when parent re-renders
export const ArticleCard = React.memo(function ArticleCard({ article }: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.updatedAt), {
    addSuffix: true,
  });

  // Get icon based on category or first tag
  const getIcon = (): LucideIcon => {
    const firstTag = article.tags[0]?.toLowerCase() || '';
    if (firstTag.includes('fsm') || firstTag.includes('state')) return Network;
    if (firstTag.includes('animation')) return PersonStanding;
    if (firstTag.includes('combat')) return Shield;
    if (firstTag.includes('network')) return Network;
    return Lightbulb;
  };

  // Get color for tags
  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('fsm')) return 'bg-coral';
    if (tagLower.includes('network')) return 'bg-green-500';
    if (tagLower.includes('combat')) return 'bg-orange-500';
    if (tagLower.includes('animation')) return 'bg-coral';
    return 'neu-pressed text-slate';
  };

  return (
    <Link href={`/knowledge/${article.id}`}>
      <div className="knowledge-card neu-raised smooth-transition hover:shadow-neumorphic-hover rounded-3xl p-6">
        {/* Icon and Relevance Score */}
        <div className="mb-4 flex items-start justify-between">
          <div className="icon-coral flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
            {(() => {
              const CategoryIcon = getIcon();
              return <CategoryIcon className="h-6 w-6 text-white" aria-hidden="true" />;
            })()}
          </div>
          <div className="flex items-center gap-2">
            <span className="neu-pressed flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-semibold text-coral">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              {article.relevance}%
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-bold text-white hover:text-coral">{article.title}</h3>

        {/* Excerpt */}
        <p className="mb-4 text-sm leading-relaxed text-slate">{article.excerpt}</p>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-md ${getTagColor(
                tag
              )}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-slate">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {timeAgo}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" aria-hidden="true" />
            {article.views} views
          </span>
        </div>
      </div>
    </Link>
  );
});

// Custom comparison: only re-render if article ID or updatedAt changes
ArticleCard.displayName = 'ArticleCard';
