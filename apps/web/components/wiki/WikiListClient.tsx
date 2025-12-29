/**
 * WikiListClient Component
 *
 * Client wrapper for wiki list page - handles category filter sidebar
 * Simpler than IssuesPageClient (only category filter, no status/priority/module)
 */

'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useProject } from '@/lib/project';

interface WikiListClientProps {
  categoryStats: Record<string, number>;
  searchParams: {
    category?: string;
    [key: string]: string | undefined;
  };
}

export function WikiListClient({ categoryStats, searchParams }: WikiListClientProps) {
  const { updateSearchParams, clearSearchParams } = useProject();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Parse active categories from URL
  const activeCategories = searchParams.category?.split(',').filter(Boolean) || [];

  // Get all unique categories (sorted alphabetically)
  const allCategories = Object.keys(categoryStats).sort();

  /**
   * Toggle category filter
   * Handles multi-select logic (comma-separated categories in URL)
   */
  const toggleCategory = (category: string) => {
    if (activeCategories.includes(category)) {
      // Remove category
      const newCategories = activeCategories.filter((c) => c !== category);
      if (newCategories.length === 0) {
        updateSearchParams({ category: null, page: null });
      } else {
        updateSearchParams({ category: newCategories.join(','), page: null });
      }
    } else {
      // Add category
      const newCategories = [...activeCategories, category];
      updateSearchParams({ category: newCategories.join(','), page: null });
    }
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    clearSearchParams();
  };

  // Render filter content (shared between desktop and mobile)
  const filterContent = (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Filters</h3>
        {activeCategories.length > 0 && (
          <button
            onClick={clearFilters}
            className="smooth-transition text-xs font-semibold text-coral hover:text-coral-light"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate">Category</h4>
        {allCategories.length === 0 ? (
          <p className="text-sm text-slate">No categories yet</p>
        ) : (
          allCategories.map((category) => (
            <label
              key={category}
              className="smooth-transition group flex cursor-pointer items-center gap-2 text-sm text-slate hover:text-white"
            >
              <input
                type="checkbox"
                checked={activeCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="focus:ring-offset-navy smooth-transition h-4 w-4 rounded border-slate-600 bg-dark-pressed text-coral focus:ring-coral"
              />
              <span className="flex-1 capitalize group-hover:text-white">
                {category.replace(/-/g, ' ')}
              </span>
              <span className="text-xs text-slate">({categoryStats[category]})</span>
            </label>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">{filterContent}</aside>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="neu-raised smooth-transition fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl text-slate shadow-2xl hover:text-white lg:hidden"
        aria-label="Open filters"
        aria-expanded={isDrawerOpen}
      >
        <SlidersHorizontal className="h-6 w-6" />
      </button>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="smooth-transition absolute inset-0 bg-black/50"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="neu-raised smooth-transition absolute bottom-0 left-0 right-0 animate-slide-up rounded-t-3xl p-6">
            {/* Mobile Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="smooth-transition text-slate hover:text-white"
                aria-label="Close filters"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Filter content */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate">
                Category
              </h4>
              {allCategories.length === 0 ? (
                <p className="text-sm text-slate">No categories yet</p>
              ) : (
                allCategories.map((category) => (
                  <label
                    key={category}
                    className="smooth-transition flex cursor-pointer items-center gap-2 text-sm text-slate hover:text-white"
                  >
                    <input
                      type="checkbox"
                      checked={activeCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="focus:ring-offset-navy smooth-transition h-4 w-4 rounded border-slate-600 bg-dark-pressed text-coral focus:ring-coral"
                    />
                    <span className="flex-1 capitalize">{category.replace(/-/g, ' ')}</span>
                    <span className="text-xs text-slate">({categoryStats[category]})</span>
                  </label>
                ))
              )}
            </div>

            {activeCategories.length > 0 && (
              <button
                onClick={clearFilters}
                className="smooth-transition mt-4 w-full rounded-2xl bg-coral px-4 py-3 font-semibold text-white hover:bg-coral-light"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
