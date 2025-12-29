'use client';

/**
 * Project Layout Wrapper
 *
 * Client wrapper component that provides project context to child components.
 * Use this in server components (pages) to wrap content that needs access to
 * useProject() hook.
 *
 * USAGE:
 *
 * // In any page.tsx (server component)
 * export default async function Page({ searchParams }) {
 *   const params = await searchParams;
 *   const { projectId, project } = await withProjectAuth(params.project);
 *
 *   return (
 *     <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
 *       <PageContent />
 *     </ProjectLayoutWrapper>
 *   );
 * }
 *
 * // In child client components
 * const { projectId, buildHref, navigateTo } = useProject();
 */

import { Suspense, type ReactNode } from 'react';
import { ProjectProvider } from '@/lib/project/ProjectContext';

interface ProjectLayoutWrapperProps {
  children: ReactNode;
  /** Project ID from server (recommended for hydration safety) */
  projectId?: number;
  /** Project name from server */
  projectName?: string;
  /** Optional loading fallback */
  fallback?: ReactNode;
}

/**
 * Wraps children with ProjectProvider inside a Suspense boundary.
 *
 * The Suspense boundary is required because ProjectProvider uses
 * useSearchParams() which needs to be wrapped in Suspense in Next.js 14+.
 *
 * @example
 * // Basic usage - pass projectId from server
 * <ProjectLayoutWrapper projectId={projectId}>
 *   <MyComponent />
 * </ProjectLayoutWrapper>
 *
 * @example
 * // With project name for display
 * <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
 *   <MyComponent />
 * </ProjectLayoutWrapper>
 *
 * @example
 * // Fallback to URL params (less safe, may cause hydration issues)
 * <ProjectLayoutWrapper>
 *   <MyComponent />
 * </ProjectLayoutWrapper>
 */
export function ProjectLayoutWrapper({
  children,
  projectId,
  projectName,
  fallback = null,
}: ProjectLayoutWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <ProjectProvider projectId={projectId} projectName={projectName}>
        {children}
      </ProjectProvider>
    </Suspense>
  );
}

/**
 * Higher-order component version for wrapping entire components.
 *
 * @example
 * const WrappedComponent = withProjectLayout(MyComponent);
 */
export function withProjectLayout<P extends object>(
  Component: React.ComponentType<P>,
  wrapperProps?: Omit<ProjectLayoutWrapperProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ProjectLayoutWrapper {...wrapperProps}>
        <Component {...props} />
      </ProjectLayoutWrapper>
    );
  };
}
