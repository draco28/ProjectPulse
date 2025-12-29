/**
 * Unit Tests: ProjectLink.tsx
 *
 * Tests for project-aware navigation components:
 * - ProjectLink
 * - ProjectButton
 */

import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectLink, ProjectButton } from '../ProjectLink';
import { ProjectProvider } from '@/lib/project/ProjectContext';

// ============================================================================
// Mocks
// ============================================================================

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/current-page',
}));

// ============================================================================
// Test Helpers
// ============================================================================

interface WrapperProps {
  children: React.ReactNode;
  projectId?: number;
}

function TestWrapper({ children, projectId = 3 }: WrapperProps) {
  return <ProjectProvider projectId={projectId}>{children}</ProjectProvider>;
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams.delete('project');
});

// ============================================================================
// ProjectLink Tests
// ============================================================================

describe('ProjectLink', () => {
  describe('href construction', () => {
    it('should add project param to href', () => {
      render(
        <TestWrapper projectId={3}>
          <ProjectLink href="/wiki">Wiki</ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'Wiki' });
      expect(link).toHaveAttribute('href', '/wiki?project=3');
    });

    it('should merge additional params via params prop', () => {
      render(
        <TestWrapper projectId={3}>
          <ProjectLink href="/tickets" params={{ status: 'open', priority: 'high' }}>
            Tickets
          </ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'Tickets' });
      const href = link.getAttribute('href') ?? '';

      expect(href).toContain('project=3');
      expect(href).toContain('status=open');
      expect(href).toContain('priority=high');
    });

    it('should handle numeric params', () => {
      render(
        <TestWrapper projectId={5}>
          <ProjectLink href="/items" params={{ page: 2, limit: 25 }}>
            Items
          </ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'Items' });
      const href = link.getAttribute('href') ?? '';

      expect(href).toContain('page=2');
      expect(href).toContain('limit=25');
    });

    it('should skip undefined params', () => {
      render(
        <TestWrapper projectId={3}>
          <ProjectLink href="/search" params={{ q: 'test', filter: undefined }}>
            Search
          </ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'Search' });
      const href = link.getAttribute('href') ?? '';

      expect(href).toContain('q=test');
      expect(href).not.toContain('filter');
    });
  });

  describe('skipProject option', () => {
    it('should not add project when skipProject=true', () => {
      render(
        <TestWrapper projectId={3}>
          <ProjectLink href="/login" skipProject>
            Login
          </ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'Login' });
      expect(link).toHaveAttribute('href', '/login');
    });

    it('should render href as-is when skipProject=true', () => {
      render(
        <TestWrapper projectId={3}>
          <ProjectLink href="/auth/callback?token=abc" skipProject>
            Callback
          </ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'Callback' });
      expect(link).toHaveAttribute('href', '/auth/callback?token=abc');
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to anchor element', () => {
      const ref = createRef<HTMLAnchorElement>();

      render(
        <TestWrapper>
          <ProjectLink ref={ref} href="/test">
            Test Link
          </ProjectLink>
        </TestWrapper>
      );

      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
      expect(ref.current?.tagName).toBe('A');
    });
  });

  describe('Next.js Link props', () => {
    it('should pass through className', () => {
      render(
        <TestWrapper>
          <ProjectLink href="/styled" className="custom-class text-blue-500">
            Styled
          </ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'Styled' });
      expect(link).toHaveClass('custom-class', 'text-blue-500');
    });

    it('should pass through target attribute', () => {
      render(
        <TestWrapper>
          <ProjectLink href="/external" target="_blank">
            External
          </ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'External' });
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should pass through rel attribute', () => {
      render(
        <TestWrapper>
          <ProjectLink href="/external" rel="noopener noreferrer">
            Safe External
          </ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'Safe External' });
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should pass through aria attributes', () => {
      render(
        <TestWrapper>
          <ProjectLink href="/accessible" aria-label="Go to accessible page">
            Accessible
          </ProjectLink>
        </TestWrapper>
      );

      const link = screen.getByRole('link', { name: 'Go to accessible page' });
      expect(link).toBeInTheDocument();
    });
  });

  describe('children rendering', () => {
    it('should render text children', () => {
      render(
        <TestWrapper>
          <ProjectLink href="/text">Plain Text</ProjectLink>
        </TestWrapper>
      );

      expect(screen.getByText('Plain Text')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <TestWrapper>
          <ProjectLink href="/complex">
            <span data-testid="icon">🏠</span>
            <span data-testid="label">Home</span>
          </ProjectLink>
        </TestWrapper>
      );

      expect(screen.getByTestId('icon')).toHaveTextContent('🏠');
      expect(screen.getByTestId('label')).toHaveTextContent('Home');
    });
  });

  describe('without project context', () => {
    it('should work when no projectId is set', () => {
      render(
        <ProjectProvider>
          <ProjectLink href="/no-project">No Project</ProjectLink>
        </ProjectProvider>
      );

      const link = screen.getByRole('link', { name: 'No Project' });
      // Should not have project param
      expect(link).toHaveAttribute('href', '/no-project');
    });
  });
});

// ============================================================================
// ProjectButton Tests
// ============================================================================

describe('ProjectButton', () => {
  describe('click navigation', () => {
    it('should call navigateTo on click', () => {
      render(
        <TestWrapper projectId={3}>
          <ProjectButton href="/dashboard">Go to Dashboard</ProjectButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Go to Dashboard' });
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/dashboard?project=3');
    });

    it('should include params in navigation', () => {
      render(
        <TestWrapper projectId={5}>
          <ProjectButton href="/tickets" params={{ status: 'open' }}>
            Open Tickets
          </ProjectButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Open Tickets' });
      fireEvent.click(button);

      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).toContain('project=5');
      expect(calledUrl).toContain('status=open');
    });
  });

  describe('variant styles', () => {
    it('should apply default variant styles', () => {
      render(
        <TestWrapper>
          <ProjectButton href="/test">Default</ProjectButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Default' });
      expect(button).toHaveClass('bg-primary');
    });

    it('should apply outline variant styles', () => {
      render(
        <TestWrapper>
          <ProjectButton href="/test" variant="outline">
            Outline
          </ProjectButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Outline' });
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-background');
    });

    it('should apply ghost variant styles', () => {
      render(
        <TestWrapper>
          <ProjectButton href="/test" variant="ghost">
            Ghost
          </ProjectButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Ghost' });
      expect(button).toHaveClass('hover:bg-accent');
    });
  });

  describe('HTML attributes', () => {
    it('should have type="button"', () => {
      render(
        <TestWrapper>
          <ProjectButton href="/test">Button</ProjectButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should pass through className', () => {
      render(
        <TestWrapper>
          <ProjectButton href="/test" className="extra-class">
            Styled
          </ProjectButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('extra-class');
    });

    it('should pass through disabled attribute', () => {
      render(
        <TestWrapper>
          <ProjectButton href="/test" disabled>
            Disabled
          </ProjectButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should pass through aria attributes', () => {
      render(
        <TestWrapper>
          <ProjectButton href="/test" aria-label="Navigate to test">
            Test
          </ProjectButton>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: 'Navigate to test' });
      expect(button).toBeInTheDocument();
    });
  });

  describe('children rendering', () => {
    it('should render text children', () => {
      render(
        <TestWrapper>
          <ProjectButton href="/test">Click Me</ProjectButton>
        </TestWrapper>
      );

      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render complex children', () => {
      render(
        <TestWrapper>
          <ProjectButton href="/test">
            <span data-testid="icon">➕</span>
            <span data-testid="text">Add Item</span>
          </ProjectButton>
        </TestWrapper>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByTestId('text')).toHaveTextContent('Add Item');
    });
  });
});
