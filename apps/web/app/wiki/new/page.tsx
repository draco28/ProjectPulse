import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { WikiEditor } from '@/components/wiki/WikiEditor';
import type { CreateWikiPageInput } from '@/lib/validations/wiki';

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

export const metadata: Metadata = {
  title: 'Create New Wiki Page | ProjectPulse',
  description: 'Create a new wiki page with rich text editor',
};

export default function NewWikiPage() {
  /**
   * Handle wiki page creation
   * Uses Server Action pattern for form submission (next-js-expert recommendation)
   */
  async function handleCreateWikiPage(data: CreateWikiPageInput) {
    'use server';

    // Validate data (already validated by Zod in Client Component, but double-check)
    const { title, path, content, category, excerpt, parentPath } = data;

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
          parentPath,
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
      redirect(`/wiki/${urlPath}`);
    } catch (error) {
      console.error('Error creating wiki page:', error);
      throw error; // Re-throw to be handled by Client Component
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <WikiEditor
        mode="create"
        onSave={handleCreateWikiPage}
        onCancelPath="/wiki"
      />
    </div>
  );
}
