'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useProject } from '@/lib/project';

interface Category {
  name: string;
  icon: string;
  count: number;
  slug: string;
}

interface QuickNavigationProps {
  categories: Category[];
  currentCategory?: string;
}

export function QuickNavigation({ categories, currentCategory }: QuickNavigationProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { updateSearchParams, buildHref } = useProject();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      updateSearchParams({ q: searchQuery.trim() });
    }
  };

  // Memoize category list to prevent unnecessary re-renders
  const categoryLinks = useMemo(() => {
    return categories.map((category) => {
      const isActive = category.slug === currentCategory;
      const IconComponent = (Icons as Record<string, typeof FileText>)[category.icon] || FileText;

      return (
        <Link
          key={category.slug}
          href={buildHref('/wiki', { category: category.slug })}
          className={`sidebar-item smooth-transition block rounded-xl px-3 py-2.5 text-sm ${
            isActive
              ? 'active bg-coral/10 text-coral'
              : 'text-slate hover:bg-coral/5 hover:text-white'
          }`}
          aria-current={isActive ? 'page' : undefined}
        >
          <IconComponent className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
          {category.name}
          <span className="float-right text-xs text-slate">{category.count}</span>
        </Link>
      );
    });
  }, [categories, currentCategory, buildHref]);

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-24">
        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search wiki..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neu-pressed smooth-transition w-full rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate focus:outline-none focus:ring-2 focus:ring-coral"
                aria-label="Search wiki pages"
              />
            </div>
          </form>
        </div>

        {/* Category Navigation */}
        <nav className="space-y-1" aria-label="Wiki categories">
          {categoryLinks}
        </nav>
      </div>
    </aside>
  );
}
