/**
 * Component Tests: FilterSidebar
 *
 * Tests components/issues/FilterSidebar.tsx component with dynamic filter options.
 * Covers:
 * - Rendering dynamic filter options from database
 * - Filter checkbox interactions
 * - Active filter styling
 * - Count badges
 * - "Clear All" button
 *
 * @see apps/web/components/issues/FilterSidebar.tsx for implementation
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterSidebar } from '../FilterSidebar';
import type { FiltersDTO } from '@/types/filters';

// Mock useFilterParams hook
const mockUpdateFilter = jest.fn();
const mockClearAllFilters = jest.fn();
const mockIsActive = jest.fn();

jest.mock('@/hooks/useFilterParams', () => ({
  useFilterParams: () => ({
    currentFilters: {
      status: [],
      priority: [],
      module: [],
    },
    isActive: mockIsActive,
    updateFilter: mockUpdateFilter,
    clearAllFilters: mockClearAllFilters,
    hasActiveFilters: false,
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('FilterSidebar', () => {
  // Sprint 15: Updated to 5-status kanban workflow
  const mockFilterOptions: FiltersDTO = {
    status: [
      { value: 'backlog', label: 'Backlog', colorClass: 'text-gray-400' },
      { value: 'todo', label: 'To Do', colorClass: 'text-slate-300' },
      { value: 'in-progress', label: 'In Progress', colorClass: 'text-yellow-600' },
      { value: 'in-review', label: 'In Review', colorClass: 'text-purple-400' },
      { value: 'done', label: 'Done', colorClass: 'text-green-600' },
    ],
    priority: [
      {
        value: 'critical',
        label: 'Critical',
        dotColorClass: 'bg-red-600',
        badgeColorClass: 'bg-red-100 text-red-800',
      },
      {
        value: 'high',
        label: 'High',
        dotColorClass: 'bg-orange-600',
        badgeColorClass: 'bg-orange-100 text-orange-800',
      },
    ],
    modules: [
      { value: 'combat', label: 'Combat' },
      { value: 'animation', label: 'Animation' },
    ],
    labels: [
      { id: 1, name: 'bug', color: '#d73a4a' },
      { id: 2, name: 'enhancement', color: '#a2eeef' },
    ],
  };

  // Sprint 15: Updated counts for 5-status kanban workflow
  const mockFilterCounts = {
    status: {
      backlog: 5,
      todo: 2,
      'in-progress': 3,
      'in-review': 1,
      done: 4,
    },
    priority: {
      critical: 1,
      high: 4,
    },
    module: {
      combat: 2,
      animation: 3,
    },
  };

  const mockSearchParams = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsActive.mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('should render all filter sections', () => {
      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Check section headers
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Module')).toBeInTheDocument();
    });

    it('should render all status options from database', () => {
      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Sprint 15: All 5 kanban status options should be rendered
      expect(screen.getByText('Backlog')).toBeInTheDocument();
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('In Review')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('should render all priority options from database', () => {
      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('should render all module options from database', async () => {
      const user = userEvent.setup();
      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Module section is collapsed by default - expand it first
      const moduleSection = screen.getByTestId('module-filter');
      const trigger = moduleSection.querySelector('button');
      await user.click(trigger!);

      expect(screen.getByText('Combat')).toBeInTheDocument();
      expect(screen.getByText('Animation')).toBeInTheDocument();
    });

    it('should render count badges for each option', () => {
      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Sprint 15: Status counts (backlog=5, todo=2, in-progress=3, in-review=1, done=4)
      expect(screen.getByText('5')).toBeInTheDocument(); // Backlog
      expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1); // In Progress
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // Todo
      expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1); // Done & High priority
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1); // In Review & Critical (both have count 1)
    });
  });

  describe('Filter Interactions', () => {
    it('should call updateFilter when status checkbox is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Sprint 15: Find and click "Backlog" checkbox (first status in kanban)
      const backlogLabel = screen.getByText('Backlog').closest('label');
      const checkbox = backlogLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      await user.click(checkbox);

      expect(mockUpdateFilter).toHaveBeenCalledWith('status', 'backlog', true);
    });

    it('should call updateFilter when priority checkbox is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Find and click "Critical" checkbox
      const criticalLabel = screen.getByText('Critical').closest('label');
      const checkbox = criticalLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      await user.click(checkbox);

      expect(mockUpdateFilter).toHaveBeenCalledWith('priority', 'critical', true);
    });

    it('should call updateFilter when module checkbox is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Module section is collapsed by default - expand it first
      const moduleSection = screen.getByTestId('module-filter');
      const trigger = moduleSection.querySelector('button');
      await user.click(trigger!);

      // Find and click "Combat" checkbox
      const combatLabel = screen.getByText('Combat').closest('label');
      const checkbox = combatLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      await user.click(checkbox);

      expect(mockUpdateFilter).toHaveBeenCalledWith('module', 'combat', true);
    });

    it('should pass unchecked state to updateFilter when unchecking', async () => {
      const user = userEvent.setup();
      mockIsActive.mockImplementation((type, value) => {
        // Sprint 15: "backlog" status is initially active (checked)
        return type === 'status' && value === 'backlog';
      });

      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      const backlogLabel = screen.getByText('Backlog').closest('label');
      const checkbox = backlogLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      // Checkbox should be checked initially
      expect(checkbox.checked).toBe(true);

      // Click to uncheck
      await user.click(checkbox);

      // Should be called with false (unchecking)
      // onChange handler receives e.target.checked which will be false after clicking a checked box
      expect(mockUpdateFilter).toHaveBeenCalledWith('status', 'backlog', false);
    });
  });

  describe('Active State', () => {
    it('should check checkboxes for active filters', () => {
      mockIsActive.mockImplementation((type, value) => {
        // Sprint 15: backlog is the active filter
        return type === 'status' && value === 'backlog';
      });

      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      const backlogLabel = screen.getByText('Backlog').closest('label');
      const backlogCheckbox = backlogLabel?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      const doneLabel = screen.getByText('Done').closest('label');
      const doneCheckbox = doneLabel?.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;

      expect(backlogCheckbox.checked).toBe(true);
      expect(doneCheckbox.checked).toBe(false);
    });

    it('should apply color class to active status filters', () => {
      mockIsActive.mockImplementation((type, value) => {
        // Sprint 15: backlog is the active filter
        return type === 'status' && value === 'backlog';
      });

      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Sprint 15: Find the count badge for "Backlog" status
      const backlogLabel = screen.getByText('Backlog').closest('label');
      const badge = backlogLabel?.querySelector('span:last-child');

      // When count > 0, should have the semantic badge color (bg-gray-500 text-white for backlog)
      expect(badge?.className).toContain('bg-gray-500');
      expect(badge?.className).toContain('text-white');
    });

    it('should apply priority badge color classes when active', () => {
      mockIsActive.mockImplementation((type, value) => {
        return type === 'priority' && value === 'critical';
      });

      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      const criticalLabel = screen.getByText('Critical').closest('label');
      // The label has 3 spans: flex container, dot, and count badge
      const allSpans = criticalLabel?.querySelectorAll('span');
      const badge = allSpans?.[allSpans.length - 1]; // Last span is the count badge

      // Should have semantic badge color (bg-red-500 text-white for critical)
      expect(badge?.className).toContain('bg-red-500');
      expect(badge?.className).toContain('text-white');
    });
  });

  describe('Clear All Button', () => {
    it('should not render "Clear All" button when hasActiveFilters is false', () => {
      // hasActiveFilters is false in the default mock
      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    // Note: Testing "Clear All" button when hasActiveFilters is true requires
    // dynamic mock reconfiguration which is complex in this test setup.
    // The button visibility is controlled by the useFilterParams hook,
    // which is tested separately in hooks/__tests__/useFilterParams.test.ts
  });

  describe('Dynamic Options', () => {
    it('should handle empty filter options gracefully', () => {
      const emptyOptions: FiltersDTO = {
        status: [],
        priority: [],
        modules: [],
        labels: [],
      };

      render(
        <FilterSidebar
          options={emptyOptions}
          counts={{ status: {}, priority: {}, module: {} }}
          searchParams={mockSearchParams}
        />
      );

      // Should still render section headers
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Module')).toBeInTheDocument();
    });

    it('should handle missing count for an option', () => {
      const countsWithMissing = {
        status: {
          open: 5,
          // in_progress missing
        },
        priority: {},
        module: {},
      };

      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={countsWithMissing}
          searchParams={mockSearchParams}
        />
      );

      // Should render 0 for missing count
      const inProgressLabel = screen.getByText('In Progress').closest('label');
      const badge = inProgressLabel?.querySelector('span:last-child');
      expect(badge?.textContent).toBe('0');
    });

    it('should render options in order provided by database', async () => {
      const user = userEvent.setup();
      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Module section is collapsed by default - expand it first
      const moduleSection = screen.getByTestId('module-filter');
      const trigger = moduleSection.querySelector('button');
      await user.click(trigger!);

      const labels = screen.getAllByRole('checkbox').map((cb) => {
        const label = cb.closest('label');
        return label?.textContent?.replace(/\d+/g, '').trim();
      });

      // Sprint 15: Status options should appear first in order (5 statuses)
      expect(labels.slice(0, 5)).toEqual(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done']);
      // Priority options next
      expect(labels.slice(5, 7)).toEqual(['Critical', 'High']);
      // Module options last
      expect(labels.slice(7, 9)).toEqual(['Combat', 'Animation']);
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      // Sprint 15: Updated to use 'Backlog' (first kanban status)
      const backlogLabel = screen.getByText('Backlog').closest('label');
      const checkbox = backlogLabel?.querySelector('input[type="checkbox"]');

      // Checkbox should be inside label (implicit association)
      expect(backlogLabel).toContainElement(checkbox as HTMLElement);
    });

    it('should have keyboard-accessible checkboxes', () => {
      render(
        <FilterSidebar
          options={mockFilterOptions}
          counts={mockFilterCounts}
          searchParams={mockSearchParams}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');

      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });
  });
});
