'use client';

import { useScrollSpy } from '@/hooks/useScrollSpy';
import { cn } from '@/lib/utils';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const headingIds = items.map((item) => item.id);
  const activeId = useScrollSpy(headingIds, {
    rootMargin: '-20% 0px -80% 0px', // Trigger when heading is in top 20-80% of viewport
  });

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-sm text-slate">
        <i className="fas fa-info-circle mr-2"></i>
        No headings found
      </div>
    );
  }

  return (
    <nav className="space-y-2">
      <h3 className="mb-4 text-sm font-semibold uppercase text-slate">Table of Contents</h3>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => scrollToHeading(item.id)}
          className={cn(
            'smooth-transition block w-full text-left text-sm',
            item.level === 2 && 'pl-0',
            item.level === 3 && 'pl-4',
            item.level === 4 && 'pl-8',
            item.level === 5 && 'pl-12',
            item.level === 6 && 'pl-16',
            activeId === item.id ? 'font-semibold text-coral' : 'text-slate hover:text-white'
          )}
        >
          {item.text}
        </button>
      ))}
    </nav>
  );
}
