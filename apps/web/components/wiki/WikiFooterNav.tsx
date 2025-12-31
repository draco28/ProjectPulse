import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface WikiFooterNavProps {
  prevPage?: { title: string; path: string };
  nextPage?: { title: string; path: string };
  projectId: number;
}

export function WikiFooterNav({ prevPage, nextPage, projectId }: WikiFooterNavProps) {
  // Don't render if both are missing
  if (!prevPage && !nextPage) {
    return null;
  }

  return (
    <nav
      className="border-darkCard mt-12 flex items-center justify-between border-t pt-8"
      aria-label="Page navigation"
    >
      {prevPage ? (
        <Link
          href={`/wiki${prevPage.path}?project=${projectId}`}
          className="smooth-transition group flex items-center gap-2 text-slate hover:text-coral"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          />
          <div>
            <div className="mb-1 text-xs uppercase">Previous</div>
            <div className="font-medium">{prevPage.title}</div>
          </div>
        </Link>
      ) : (
        <div /> // Spacer
      )}

      {nextPage ? (
        <Link
          href={`/wiki${nextPage.path}?project=${projectId}`}
          className="smooth-transition group flex items-center gap-2 text-right text-slate hover:text-coral"
        >
          <div>
            <div className="mb-1 text-xs uppercase">Next</div>
            <div className="font-medium">{nextPage.title}</div>
          </div>
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      ) : (
        <div /> // Spacer
      )}
    </nav>
  );
}
