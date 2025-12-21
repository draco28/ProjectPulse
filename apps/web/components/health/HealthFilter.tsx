'use client';

import { SlidersHorizontal } from 'lucide-react';

interface HealthFilterProps {
  filters: {
    category: string;
    severity: string;
    scanner: string;
  };
  onFilterChange: (filters: { category: string; severity: string; scanner: string }) => void;
}

/**
 * Filter controls for findings table
 * 3 dropdowns: Category, Severity, Scanner Type
 */
export function HealthFilter({ filters, onFilterChange }: HealthFilterProps) {
  const handleChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex items-center gap-3">
      <SlidersHorizontal className="h-4 w-4 text-slate-400" />

      {/* Category Filter */}
      <select
        value={filters.category}
        onChange={(e) => handleChange('category', e.target.value)}
        className="neu-raised smooth-transition focus:ring-coral-400 cursor-pointer rounded-xl border-0 bg-transparent px-4 py-2 text-sm text-white hover:bg-dark-card focus:ring-2"
      >
        <option value="all">All Categories</option>
        <option value="SECURITY">Security</option>
        <option value="CODE_QUALITY">Code Quality</option>
        <option value="PERFORMANCE">Performance</option>
        <option value="ACCESSIBILITY">Accessibility</option>
      </select>

      {/* Severity Filter */}
      <select
        value={filters.severity}
        onChange={(e) => handleChange('severity', e.target.value)}
        className="neu-raised smooth-transition focus:ring-coral-400 cursor-pointer rounded-xl border-0 bg-transparent px-4 py-2 text-sm text-white hover:bg-dark-card focus:ring-2"
      >
        <option value="all">All Severities</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      {/* Scanner Filter */}
      <select
        value={filters.scanner}
        onChange={(e) => handleChange('scanner', e.target.value)}
        className="neu-raised smooth-transition focus:ring-coral-400 cursor-pointer rounded-xl border-0 bg-transparent px-4 py-2 text-sm text-white hover:bg-dark-card focus:ring-2"
      >
        <option value="all">All Scanners</option>
        <option value="SEMGREP">Semgrep</option>
        <option value="ESLINT">ESLint</option>
        <option value="LIGHTHOUSE">Lighthouse</option>
        <option value="AXECORE">Axe Core</option>
      </select>
    </div>
  );
}
