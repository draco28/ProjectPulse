'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TagFilterProps {
  allTags: string[];
  selectedTag?: string;
}

export function TagFilter({ allTags, selectedTag }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (tag === selectedTag) {
      // Deselect if clicking the same tag
      params.delete('tag');
    } else {
      params.set('tag', tag);
    }

    // Reset to page 1 when tag changes
    params.delete('page');

    router.push(`/knowledge?${params.toString()}`);
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('tag');
    router.push(`/knowledge?${params.toString()}`);
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
            className="smooth-transition neu-raised ml-2 rounded-full px-3 py-1.5 text-sm font-semibold text-slate hover:text-white"
          >
            <i className="fas fa-times mr-1"></i>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
