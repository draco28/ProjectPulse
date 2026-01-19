/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Component tests for WikiRevisionTimeline
 * Tests rendering of revision history, actor metadata display, and integration with RevisionDiffViewer
 */

import { render, screen } from '@testing-library/react';
import { WikiRevisionTimeline, WikiRevisionSummary } from '../WikiRevisionTimeline';

// Mock RevisionDiffViewer to simplify timeline tests
jest.mock('../RevisionDiffViewer', () => ({
  RevisionDiffViewer: ({ slug, version, isLatest }: any) => (
    <div data-testid={`diff-viewer-${version}`}>
      Diff Viewer: {slug} v{version} {isLatest ? '(latest)' : ''}
    </div>
  ),
}));

// Mock date-fns to ensure consistent relative time output
jest.mock('date-fns', () => ({
  formatDistanceToNow: (date: Date) => {
    const timestamp = date.getTime();
    if (timestamp === new Date('2025-11-11T16:00:00Z').getTime()) {
      return '1 hour ago';
    }
    if (timestamp === new Date('2025-11-11T15:00:00Z').getTime()) {
      return '2 hours ago';
    }
    if (timestamp === new Date('2025-11-11T14:00:00Z').getTime()) {
      return '3 hours ago';
    }
    return 'some time ago';
  },
}));

describe('WikiRevisionTimeline', () => {
  const mockRevisions: WikiRevisionSummary[] = [
    {
      version: 3,
      createdAt: '2025-11-11T16:00:00Z',
      createdBy: 'Jane Doe',
      createdByType: 'human',
      diffSummary: 'Updated content and formatting',
    },
    {
      version: 2,
      createdAt: '2025-11-11T15:00:00Z',
      createdBy: 'MCP Agent',
      createdByType: 'agent',
      diffSummary: 'Added new section via automated update',
    },
    {
      version: 1,
      createdAt: '2025-11-11T14:00:00Z',
      createdBy: 'John Doe',
      createdByType: 'human',
      diffSummary: null,
    },
  ];

  describe('Rendering', () => {
    it('should render all revisions in timeline', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(screen.getByText('Version v3')).toBeInTheDocument();
      expect(screen.getByText('Version v2')).toBeInTheDocument();
      expect(screen.getByText('Version v1')).toBeInTheDocument();
    });

    it('should display section header with current version', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(screen.getByText('Revision History')).toBeInTheDocument();
      expect(screen.getByText('Changes & Rollbacks')).toBeInTheDocument();
      expect(screen.getByText('Current version v3')).toBeInTheDocument();
    });

    it('should render nothing when revisions array is empty', () => {
      const { container } = render(
        <WikiRevisionTimeline slug="getting-started" revisions={[]} currentVersion={1} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should display actor name for each revision', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('MCP Agent')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display actor type badges', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      // Each revision shows actor type badge
      expect(screen.getAllByText('human')).toHaveLength(2);
      expect(screen.getByText('agent')).toBeInTheDocument();
    });

    it('should display relative timestamps', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
      expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    });

    it('should display diffSummary when provided', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(screen.getByText('Updated content and formatting')).toBeInTheDocument();
      expect(screen.getByText('Added new section via automated update')).toBeInTheDocument();
    });

    it('should not render diffSummary section when null', () => {
      render(
        <WikiRevisionTimeline
          slug="getting-started"
          revisions={[mockRevisions[2]]} // Version 1 with null diffSummary
          currentVersion={1}
        />
      );

      // The timeline should render but without a diffSummary paragraph
      expect(screen.getByText('Version v1')).toBeInTheDocument();
      expect(screen.queryByText('diffSummary')).not.toBeInTheDocument();
    });

    it('should mark first revision as latest snapshot', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(screen.getByText('Latest snapshot')).toBeInTheDocument();
    });

    it('should only mark the first revision as latest', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      const latestBadges = screen.getAllByText('Latest snapshot');
      expect(latestBadges).toHaveLength(1);
    });
  });

  describe('RevisionDiffViewer integration', () => {
    it('should render RevisionDiffViewer for each revision', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(screen.getByTestId('diff-viewer-3')).toBeInTheDocument();
      expect(screen.getByTestId('diff-viewer-2')).toBeInTheDocument();
      expect(screen.getByTestId('diff-viewer-1')).toBeInTheDocument();
    });

    it('should pass slug to RevisionDiffViewer', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(screen.getByText(/Diff Viewer: getting-started v3/)).toBeInTheDocument();
    });

    it('should mark first revision as latest in diff viewer', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(screen.getByText(/Diff Viewer:.*v3.*\(latest\)/)).toBeInTheDocument();
    });

    it('should not mark subsequent revisions as latest', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      const diffViewer2 = screen.getByTestId('diff-viewer-2');
      const diffViewer1 = screen.getByTestId('diff-viewer-1');

      expect(diffViewer2.textContent).not.toContain('(latest)');
      expect(diffViewer1.textContent).not.toContain('(latest)');
    });
  });

  describe('Edge cases', () => {
    it('should handle single revision', () => {
      render(
        <WikiRevisionTimeline
          slug="getting-started"
          revisions={[mockRevisions[0]]}
          currentVersion={1}
        />
      );

      expect(screen.getByText('Version v3')).toBeInTheDocument();
      expect(screen.getByText('Latest snapshot')).toBeInTheDocument();
    });

    it('should handle long actor names', () => {
      const longNameRevision: WikiRevisionSummary = {
        version: 1,
        createdAt: '2025-11-11T14:00:00Z',
        createdBy: 'Very Long Actor Name That Could Potentially Break Layout',
        createdByType: 'human',
        diffSummary: null,
      };

      render(
        <WikiRevisionTimeline
          slug="getting-started"
          revisions={[longNameRevision]}
          currentVersion={1}
        />
      );

      expect(
        screen.getByText('Very Long Actor Name That Could Potentially Break Layout')
      ).toBeInTheDocument();
    });

    it('should handle long diffSummary text', () => {
      const longDiffRevision: WikiRevisionSummary = {
        version: 1,
        createdAt: '2025-11-11T14:00:00Z',
        createdBy: 'Jane Doe',
        createdByType: 'human',
        diffSummary:
          'This is a very long diff summary that describes in great detail all the changes that were made to this wiki page including multiple sections, formatting updates, and content additions that might span multiple lines',
      };

      render(
        <WikiRevisionTimeline
          slug="getting-started"
          revisions={[longDiffRevision]}
          currentVersion={1}
        />
      );

      expect(screen.getByText(/This is a very long diff summary/)).toBeInTheDocument();
    });

    it('should handle different actor types', () => {
      const mixedActorRevisions: WikiRevisionSummary[] = [
        { ...mockRevisions[0], createdByType: 'human' },
        { ...mockRevisions[1], createdByType: 'agent' },
        { ...mockRevisions[2], createdByType: 'system' },
      ];

      render(
        <WikiRevisionTimeline
          slug="getting-started"
          revisions={mixedActorRevisions}
          currentVersion={3}
        />
      );

      expect(screen.getByText('human')).toBeInTheDocument();
      expect(screen.getByText('agent')).toBeInTheDocument();
      expect(screen.getByText('system')).toBeInTheDocument();
    });

    it('should handle slug with special characters', () => {
      render(
        <WikiRevisionTimeline
          slug="advanced/nested-page"
          revisions={mockRevisions}
          currentVersion={3}
        />
      );

      // Each revision gets its own diff viewer with the slug
      expect(screen.getAllByText(/Diff Viewer: advanced\/nested-page/).length).toBeGreaterThan(0);
    });

    it('should handle mismatched currentVersion and revision list', () => {
      // Current version is 5 but highest revision is 3
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={5} />
      );

      expect(screen.getByText('Current version v5')).toBeInTheDocument();
      expect(screen.getByText('Version v3')).toBeInTheDocument();
    });
  });

  describe('Styling and structure', () => {
    it('should render revisions in an ordered list', () => {
      const { container } = render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      const orderedList = container.querySelector('ol');
      expect(orderedList).toBeInTheDocument();
      expect(orderedList?.children).toHaveLength(3);
    });

    it('should apply section wrapper', () => {
      const { container } = render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should have header with title and version badge', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      const header = screen.getByRole('heading', { name: 'Changes & Rollbacks' });
      expect(header).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Changes & Rollbacks');
    });

    it('should use semantic list element', () => {
      const { container } = render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      expect(container.querySelector('ol')).toBeInTheDocument();
    });

    it('should have meaningful text for screen readers', () => {
      render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      // Version labels
      expect(screen.getByText('Version v3')).toBeInTheDocument();
      expect(screen.getByText('Version v2')).toBeInTheDocument();

      // Actor information
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('MCP Agent')).toBeInTheDocument();
    });

    it('should use aria-hidden for decorative dots', () => {
      const { container } = render(
        <WikiRevisionTimeline slug="getting-started" revisions={mockRevisions} currentVersion={3} />
      );

      const decorativeDots = container.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeDots.length).toBeGreaterThan(0);
    });
  });
});
