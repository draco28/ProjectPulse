/**
 * Pagination Component
 *
 * Reusable pagination controls for any list page
 * Reference: mockups/Default theme/02-issues-dark-neumorphic-coral.html lines 634-649
 *
 * Sprint 12: Made reusable with basePath prop (was hardcoded to /tickets)
 */
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  showing: number;
  perPage: number;
  /** Base path for pagination URLs. Defaults to current pathname if not provided. */
  basePath?: string;
  /** Label for the "Showing X of Y" text. Defaults to "items" */
  itemLabel?: string;
  /** Project ID to ensure project context is preserved in pagination URLs (Sprint 14 fix for Ticket #20) */
  projectId?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  showing: _showing,
  perPage,
  basePath,
  itemLabel = 'items',
  projectId,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Use provided basePath, or fall back to current pathname
  const targetPath = basePath ?? pathname;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set('page', page.toString());
    // Sprint 14: Ensure project context is preserved (Ticket #20)
    if (projectId && !params.has('project')) {
      params.set('project', projectId.toString());
    }
    router.push(`${targetPath}?${params.toString()}`);
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page + 2 before + 2 after
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Calculate showing range
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalCount);

  return (
    <div className="neu-raised smooth-transition rounded-3xl p-4">
      <div className="flex items-center justify-between">
        {/* Showing text */}
        <p className="text-sm font-medium text-slate">
          Showing {startItem}-{endItem} of {totalCount} {itemLabel}
        </p>

        {/* Page controls */}
        <div className="flex gap-2">
          {/* Previous Button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              'neu-raised smooth-transition rounded-xl px-4 py-2 font-medium',
              currentPage === 1
                ? 'cursor-not-allowed text-slate opacity-50'
                : 'text-slate hover:text-white'
            )}
          >
            Previous
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="flex items-center px-2 text-slate">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={cn(
                  'smooth-transition rounded-xl px-4 py-2 font-medium',
                  isActive
                    ? 'coral-gradient text-white shadow-lg'
                    : 'neu-raised text-slate hover:text-white'
                )}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              'neu-raised smooth-transition rounded-xl px-4 py-2 font-medium',
              currentPage === totalPages
                ? 'cursor-not-allowed text-slate opacity-50'
                : 'text-slate hover:text-white'
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
