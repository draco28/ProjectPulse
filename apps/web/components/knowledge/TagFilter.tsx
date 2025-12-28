'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProject } from '@/lib/project';

interface TagFilterProps {
  allTags: string[];
  selectedTag?: string;
}

export function TagFilter({ allTags, selectedTag }: TagFilterProps) {
  const { updateSearchParams } = useProject();

  const handleTagClick = (tag: string) => {
    if (tag === selectedTag) {
      // Deselect if clicking the same tag
      updateSearchParams({ tag: null, page: null });
    } else {
      updateSearchParams({ tag, page: null });
    }
  };

  const handleClearFilters = () => {
    updateSearchParams({ tag: null });
  };

  // Show only top 10 popular tags
  const popularTags = allTags.slice(0, 10);

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate">Popular tags:</span>

        {popularTags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={cn(
              'smooth-transition rounded-full px-3 py-1.5 text-sm font-semibold',
              selectedTag === tag
                ? 'bg-coral text-white shadow-md'
                : 'neu-raised text-slate hover:text-white'
            )}
          >
            {tag}
          </button>
        ))}

        {selectedTag && (
          <button
            onClick={handleClearFilters}
            className="smooth-transition neu-raised ml-2 flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-slate hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
