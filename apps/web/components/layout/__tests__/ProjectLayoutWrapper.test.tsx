/**
 * Unit Tests: ProjectLayoutWrapper.tsx
 *
 * Tests for the layout wrapper component:
 * - ProjectLayoutWrapper
 * - withProjectLayout HOC
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectLayoutWrapper, withProjectLayout } from '../ProjectLayoutWrapper';
import { useProject } from '@/lib/project/ProjectContext';

// ============================================================================
// Mocks
// ============================================================================

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/test',
}));

// ============================================================================
// Test Components
// ============================================================================

// Component that uses the project context to verify it's available
function TestConsumer() {
  const { projectId, projectName, buildHref } = useProject();
  return (
    <div>
      <span data-testid="project-id">{projectId ?? 'null'}</span>
      <span data-testid="project-name">{projectName ?? 'null'}</span>
      <span data-testid="href">{buildHref('/test')}</span>
    </div>
  );
}

// Simple component for HOC testing
function SimpleComponent({ message }: { message: string }) {
  return <div data-testid="simple">{message}</div>;
}

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams.delete('project');
});

// ============================================================================
// ProjectLayoutWrapper Tests
// ============================================================================

describe('ProjectLayoutWrapper', () => {
  describe('rendering', () => {
    it('should render children correctly', () => {
      render(
        <ProjectLayoutWrapper>
          <div data-testid="child">Hello</div>
        </ProjectLayoutWrapper>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('should render multiple children', () => {
      render(
        <ProjectLayoutWrapper>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
        </ProjectLayoutWrapper>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('context provision', () => {
    it('should provide project context to children', () => {
      render(
        <ProjectLayoutWrapper projectId={42} projectName="Test Project">
          <TestConsumer />
        </ProjectLayoutWrapper>
      );

      expect(screen.getByTestId('project-id')).toHaveTextContent('42');
      expect(screen.getByTestId('project-name')).toHaveTextContent('Test Project');
    });

    it('should provide buildHref that includes project param', () => {
      render(
        <ProjectLayoutWrapper projectId={5}>
          <TestConsumer />
        </ProjectLayoutWrapper>
      );

      expect(screen.getByTestId('href')).toHaveTextContent('/test?project=5');
    });

    it('should work without projectId (fallback to URL)', () => {
      mockSearchParams.set('project', '99');

      render(
        <ProjectLayoutWrapper>
          <TestConsumer />
        </ProjectLayoutWrapper>
      );

      expect(screen.getByTestId('project-id')).toHaveTextContent('99');
    });

    it('should show null when no projectId anywhere', () => {
      render(
        <ProjectLayoutWrapper>
          <TestConsumer />
        </ProjectLayoutWrapper>
      );

      expect(screen.getByTestId('project-id')).toHaveTextContent('null');
    });
  });

  describe('Suspense boundary', () => {
    it('should render fallback during suspense (if any)', () => {
      // The Suspense boundary is primarily for useSearchParams
      // In tests, it resolves immediately, so we just verify it doesn't break
      render(
        <ProjectLayoutWrapper fallback={<div data-testid="loading">Loading...</div>}>
          <div data-testid="content">Content</div>
        </ProjectLayoutWrapper>
      );

      // Content should be visible (Suspense resolves immediately in tests)
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('should accept null fallback (default)', () => {
      render(
        <ProjectLayoutWrapper projectId={1}>
          <div>Content</div>
        </ProjectLayoutWrapper>
      );

      // No error should occur
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('prop combinations', () => {
    it('should work with only projectId', () => {
      render(
        <ProjectLayoutWrapper projectId={10}>
          <TestConsumer />
        </ProjectLayoutWrapper>
      );

      expect(screen.getByTestId('project-id')).toHaveTextContent('10');
      expect(screen.getByTestId('project-name')).toHaveTextContent('null');
    });

    it('should work with projectId and projectName', () => {
      render(
        <ProjectLayoutWrapper projectId={10} projectName="My Project">
          <TestConsumer />
        </ProjectLayoutWrapper>
      );

      expect(screen.getByTestId('project-id')).toHaveTextContent('10');
      expect(screen.getByTestId('project-name')).toHaveTextContent('My Project');
    });
  });
});

// ============================================================================
// withProjectLayout HOC Tests
// ============================================================================

describe('withProjectLayout()', () => {
  it('should wrap component with ProjectLayoutWrapper', () => {
    const WrappedComponent = withProjectLayout(SimpleComponent);

    render(<WrappedComponent message="Hello" />);

    expect(screen.getByTestId('simple')).toHaveTextContent('Hello');
  });

  it('should pass wrapper props to ProjectLayoutWrapper', () => {
    const WrappedComponent = withProjectLayout(TestConsumer, {
      projectId: 25,
      projectName: 'HOC Project',
    });

    render(<WrappedComponent />);

    expect(screen.getByTestId('project-id')).toHaveTextContent('25');
    expect(screen.getByTestId('project-name')).toHaveTextContent('HOC Project');
  });

  it('should forward all props to wrapped component', () => {
    interface TestProps {
      title: string;
      count: number;
    }

    function PropsTestComponent({ title, count }: TestProps) {
      return (
        <div>
          <span data-testid="title">{title}</span>
          <span data-testid="count">{count}</span>
        </div>
      );
    }

    const WrappedComponent = withProjectLayout(PropsTestComponent, { projectId: 1 });

    render(<WrappedComponent title="Test Title" count={42} />);

    expect(screen.getByTestId('title')).toHaveTextContent('Test Title');
    expect(screen.getByTestId('count')).toHaveTextContent('42');
  });

  it('should provide context to wrapped component', () => {
    // Component that uses context
    function ContextUser() {
      const { projectId } = useProject();
      return <div data-testid="from-context">{projectId}</div>;
    }

    const WrappedComponent = withProjectLayout(ContextUser, { projectId: 77 });

    render(<WrappedComponent />);

    expect(screen.getByTestId('from-context')).toHaveTextContent('77');
  });
});
