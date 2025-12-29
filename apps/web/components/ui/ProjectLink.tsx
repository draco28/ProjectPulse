'use client';

/**
 * Project-Aware Link Component
 *
 * Drop-in replacement for next/link that automatically preserves project context.
 *
 * USAGE:
 *
 * // Instead of:
 * <Link href={`/wiki?project=${projectId}`}>Wiki</Link>
 *
 * // Use:
 * <ProjectLink href="/wiki">Wiki</ProjectLink>
 *
 * // With additional params:
 * <ProjectLink href="/tickets" params={{ status: 'open' }}>Open Tickets</ProjectLink>
 */

import Link from 'next/link';
import { forwardRef, type ComponentProps } from 'react';
import { useProject } from '@/lib/project/ProjectContext';

// ============================================================================
// Types
// ============================================================================

type NextLinkProps = Omit<ComponentProps<typeof Link>, 'href'>;

interface ProjectLinkProps extends NextLinkProps {
  /** Base path (e.g., '/wiki', '/tickets') */
  href: string;
  /** Additional query params to include */
  params?: Record<string, string | number | undefined>;
  /** If true, skips project context (for external/public links) */
  skipProject?: boolean;
}

// ============================================================================
// ProjectLink Component
// ============================================================================

/**
 * Link component that automatically includes project context.
 *
 * @example
 * // Basic usage - project is auto-added
 * <ProjectLink href="/wiki">Wiki</ProjectLink>
 * // Renders: <a href="/wiki?project=1">Wiki</a>
 *
 * @example
 * // With additional params
 * <ProjectLink href="/tickets" params={{ status: 'open', priority: 'high' }}>
 *   High Priority
 * </ProjectLink>
 * // Renders: <a href="/tickets?project=1&status=open&priority=high">High Priority</a>
 *
 * @example
 * // Skip project (for auth pages, external links)
 * <ProjectLink href="/login" skipProject>Login</ProjectLink>
 * // Renders: <a href="/login">Login</a>
 */
export const ProjectLink = forwardRef<HTMLAnchorElement, ProjectLinkProps>(
  function ProjectLink(
    { href, params = {}, skipProject = false, children, ...props },
    ref
  ) {
    const { buildHref } = useProject();

    // Build the full href with project context
    const fullHref = skipProject ? href : buildHref(href, params);

    return (
      <Link ref={ref} href={fullHref} {...props}>
        {children}
      </Link>
    );
  }
);

// ============================================================================
// ProjectButton Component
// ============================================================================

interface ProjectButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  /** Base path to navigate to */
  href: string;
  /** Additional query params */
  params?: Record<string, string | number | undefined>;
  /** Variant styling */
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * Button that navigates with project context preserved.
 *
 * @example
 * <ProjectButton href="/tickets/new">Create Ticket</ProjectButton>
 */
export function ProjectButton({
  href,
  params = {},
  variant = 'default',
  children,
  className,
  ...props
}: ProjectButtonProps) {
  const { navigateTo } = useProject();

  const handleClick = () => {
    navigateTo(href, params);
  };

  // Base styles (matches project's design system)
  const baseStyles =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';

  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
