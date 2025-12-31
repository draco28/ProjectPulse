'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TableOfContents } from './TableOfContents';
import { useProject } from '@/lib/project/ProjectContext';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface RelatedPage {
  id: number;
  title: string;
  path: string;
}

interface WikiSidebarProps {
  tocItems: TOCItem[];
  relatedPages: RelatedPage[];
}

export function WikiSidebar({ tocItems, relatedPages }: WikiSidebarProps) {
  const { buildHref } = useProject();

  return (
    <aside className="w-64 flex-shrink-0 space-y-4">
      {/* Table of Contents */}
      <div className="neu-raised smooth-transition sticky top-4 rounded-3xl p-6">
        <TableOfContents items={tocItems} />
      </div>

      {/* Related Articles */}
      {relatedPages.length > 0 && (
        <div className="neu-raised smooth-transition rounded-3xl p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase text-slate">Related Articles</h3>
          <div className="space-y-3">
            {relatedPages.map((page) => (
              <Link
                key={page.id}
                href={buildHref(`/wiki${page.path}`)}
                className="smooth-transition flex items-center gap-2 text-sm text-slate hover:text-coral"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                {page.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
