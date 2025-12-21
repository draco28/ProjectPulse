'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { HealthFilter } from './HealthFilter';
import { FindingRow } from './FindingRow';

interface Finding {
  id: number;
  category: string;
  severity: string;
  ruleId: string;
  message: string;
  filePath: string;
  lineNumber: number | null;
  status: string;
  scanner: {
    name: string;
    type: string;
  };
}

interface FindingsTableProps {
  findings: Finding[];
}

/**
 * Display findings table with filters and pagination
 * Client-side filtering and pagination (50 per page)
 */
export function FindingsTable({ findings }: FindingsTableProps) {
  const [filters, setFilters] = useState({
    category: 'all',
    severity: 'all',
    scanner: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 50;

  // Apply client-side filtering
  const filteredFindings = findings.filter((finding) => {
    if (filters.category !== 'all' && finding.category !== filters.category) return false;
    if (filters.severity !== 'all' && finding.severity !== filters.severity) return false;
    if (filters.scanner !== 'all' && finding.scanner.type !== filters.scanner) return false;
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredFindings.length / perPage);
  const paginatedFindings = filteredFindings.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Handle filter change - reset to page 1
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination UI
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="neu-raised rounded-3xl p-6" data-testid="findings-table">
      {/* Header with Title and Filters */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase text-white">
          Findings ({filteredFindings.length})
        </h2>
        <HealthFilter filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Findings List or Empty State */}
      {paginatedFindings.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle className="mx-auto mb-3 h-16 w-16 text-green-400" />
          <h3 className="mb-2 text-xl font-semibold text-white">No Findings</h3>
          <p className="text-slate-400">
            {filteredFindings.length === 0 && findings.length > 0
              ? 'No findings match current filters'
              : 'All clear! No health issues detected.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedFindings.map((finding) => (
            <FindingRow key={finding.id} finding={finding} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="text-sm text-slate-400">
            Showing {(currentPage - 1) * perPage + 1}-
            {Math.min(currentPage * perPage, filteredFindings.length)} of {filteredFindings.length}
          </div>

          <div className="flex gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="neu-raised flex h-10 w-10 items-center justify-center rounded-xl text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-10 min-w-[2.5rem] rounded-xl px-3 text-sm font-semibold transition-all ${
                      pageNum === currentPage
                        ? 'neu-pressed bg-coral-400/20 text-coral-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="neu-raised flex h-10 w-10 items-center justify-center rounded-xl text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
