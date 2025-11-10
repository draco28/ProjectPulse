import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface WikiFooterNavProps {
  prevPage?: { title: string; path: string };
  nextPage?: { title: string; path: string };
}

export function WikiFooterNav({ prevPage, nextPage }: WikiFooterNavProps) {
  // Don't render if both are missing
  if (!prevPage && !nextPage) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-between pt-8 border-t border-darkCard mt-12"
      aria-label="Page navigation"
    >
      {prevPage ? (
        <Link
          href={`/wiki${prevPage.path}`}
          className="flex items-center gap-2 text-slate hover:text-coral smooth-transition group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          <div>
            <div className="text-xs uppercase mb-1">Previous</div>
            <div className="font-medium">{prevPage.title}</div>
          </div>
        </Link>
      ) : (
        <div /> // Spacer
      )}

      {nextPage ? (
        <Link
          href={`/wiki${nextPage.path}`}
          className="flex items-center gap-2 text-slate hover:text-coral smooth-transition group text-right"
        >
          <div>
            <div className="text-xs uppercase mb-1">Next</div>
            <div className="font-medium">{nextPage.title}</div>
          </div>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      ) : (
        <div /> // Spacer
      )}
    </nav>
  );
}