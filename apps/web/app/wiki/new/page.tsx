import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { WikiEditor } from '@/components/wiki/WikiEditor';
import { ProjectLayoutWrapper } from '@/components/layout';
import { withProjectAuth } from '@/lib/project';
import type { CreateWikiPageInput, UpdateWikiPageInput } from '@/lib/validations/wiki';

/**
 * New Wiki Page Route
 *
 * Server Component wrapper for WikiEditor Client Component.
 * Follows next-js-expert recommendation: Server Component for metadata,
 * Client Component for interactive editor.
 *
 * @see US-018: Wiki Editor UI (8 points)
 * @see next-js-expert: Server Component wrapper pattern
 */

// Force dynamic rendering to prevent pre-render errors with useProject
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create New Wiki Page | ProjectPulse',
  description: 'Create a new wiki page with rich text editor',
};

interface SearchParams {
  project?: string;
  [key: string]: string | undefined;
}

export default async function NewWikiPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(params.project);

  /**
   * Handle wiki page creation
   * Uses Server Action pattern for form submission (next-js-expert recommendation)
   */
  async function handleCreateWikiPage(data: CreateWikiPageInput | UpdateWikiPageInput) {
    'use server';

    // Type guard: in create mode, we should only receive CreateWikiPageInput
    if (!('path' in data) || !('title' in data) || !('content' in data) || !('category' in data)) {
      throw new Error('Invalid data: missing required fields for create operation');
    }

    // Validate data (already validated by Zod in Client Component, but double-check)
    const { title, path, content, category, excerpt } = data;

    try {
      // Make API request to create wiki page
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/wiki`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          path,
          content,
          category,
          excerpt,
          projectId, // Include projectId for multi-tenancy
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create wiki page');
      }

      const newPage = await response.json();

      // Redirect to the new wiki page detail view
      // Remove leading slash from path for URL
      const urlPath = newPage.path.startsWith('/') ? newPage.path.slice(1) : newPage.path;
      redirect(`/wiki/${urlPath}?project=${projectId}`);
    } catch (error) {
      console.error('Error creating wiki page:', error);
      throw error; // Re-throw to be handled by Client Component
    }
  }

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <WikiEditor
          mode="create"
          onSave={handleCreateWikiPage}
          onCancelPath={`/wiki?project=${projectId}`}
        />
      </div>
    </ProjectLayoutWrapper>
  );
}
