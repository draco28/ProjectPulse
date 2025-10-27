'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
export const ArticleCard = React.memo(function ArticleCard({
  article,
}: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.updatedAt), {
    addSuffix: true,
  });

  // Get icon based on category or first tag
  const getIcon = () => {
    const firstTag = article.tags[0]?.toLowerCase() || '';
    if (firstTag.includes('fsm') || firstTag.includes('state'))
      return 'fa-project-diagram';
    if (firstTag.includes('animation')) return 'fa-running';
    if (firstTag.includes('combat')) return 'fa-fist-raised';
    if (firstTag.includes('network')) return 'fa-network-wired';
    return 'fa-lightbulb';
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
      <div className="knowledge-card neu-raised smooth-transition rounded-3xl p-6 hover:shadow-neumorphic-hover">
        {/* Icon and Relevance Score */}
        <div className="mb-4 flex items-start justify-between">
          <div className="icon-coral flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg">
            <i className={`fas ${getIcon()} text-xl text-white`}></i>
          </div>
          <div className="flex items-center gap-2">
            <span className="neu-pressed rounded-full px-2.5 py-1 font-mono text-xs font-semibold text-coral">
              <i className="fas fa-chart-line mr-1"></i>
              {article.relevance}%
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-bold text-white hover:text-coral">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="mb-4 text-sm leading-relaxed text-slate">
          {article.excerpt}
        </p>

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
          <span>
            <i className="fas fa-clock mr-1"></i>
            {timeAgo}
          </span>
          <span>
            <i className="fas fa-eye mr-1"></i>
            {article.views} views
          </span>
        </div>
      </div>
    </Link>
  );
});

// Custom comparison: only re-render if article ID or updatedAt changes
ArticleCard.displayName = 'ArticleCard';
