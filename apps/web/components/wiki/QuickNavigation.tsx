'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import * as Icons from 'lucide-react';

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/wiki?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-24">
        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search wiki..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 neu-pressed rounded-xl text-white placeholder-slate text-sm smooth-transition focus:outline-none focus:ring-2 focus:ring-coral"
                aria-label="Search wiki pages"
              />
            </div>
          </form>
        </div>

        {/* Category Navigation */}
        <nav className="space-y-1" aria-label="Wiki categories">
          {categories.map((category) => {
            const isActive = category.slug === currentCategory;
            const IconComponent = (Icons as any)[category.icon] || FileText;

            return (
              <Link
                key={category.slug}
                href={`/wiki?category=${category.slug}`}
                className={`sidebar-item block px-3 py-2.5 text-sm rounded-xl smooth-transition ${
                  isActive
                    ? 'active text-coral bg-coral/10'
                    : 'text-slate hover:text-white hover:bg-coral/5'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <IconComponent className="inline-block mr-2 h-4 w-4" aria-hidden="true" />
                {category.name}
                <span className="float-right text-xs text-slate">{category.count}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}