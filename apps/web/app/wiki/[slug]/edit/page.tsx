import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { WikiEditor } from '@/components/wiki/WikiEditor';
import { prisma } from '@/lib/prisma';
import type { UpdateWikiPageInput } from '@/lib/validations/wiki';

/**
 * Edit Wiki Page Route
 *
 * Server Component that fetches existing wiki page data server-side
 * and passes it to WikiEditor Client Component as initialData.
 *
 * Follows next-js-expert recommendation:
 * - Fetch data server-side with Prisma (better SEO, faster initial render)
 * - Pass as props to Client Component
 * - ISR with 1-hour revalidation
 *
 * @see US-018: Wiki Editor UI (8 points)
 * @see next-js-expert: Server-side data fetching pattern
 */

interface EditWikiPageProps {
  params: {
    slug: string; // Note: Route param still called 'slug' for URL consistency, but maps to 'path' field
  };
}

export const revalidate = 3600; // ISR: 1-hour cache (documentation changes infrequently)

/**
 * Generate metadata for the edit page
 */
export async function generateMetadata({
  params,
}: EditWikiPageProps): Promise<Metadata> {
  const page = await prisma.wikiPage.findUnique({
    where: { slug: params.slug },
    select: { title: true },
  });

  if (!page) {
    return {
      title: 'Page Not Found | ProjectPulse',
    };
  }

  return {
    title: `Edit: ${page.title} | ProjectPulse`,
    description: `Edit wiki page: ${page.title}`,
  };
}

export default async function EditWikiPage({ params }: EditWikiPageProps) {
  // Normalize path: add leading slash for database lookup
  const normalizedPath = params.slug.startsWith('/') ? params.slug : `/${params.slug}`;

  // Fetch existing wiki page data server-side
  const page = await prisma.wikiPage.findUnique({
    where: { path: normalizedPath },
    select: {
      id: true,
      title: true,
      path: true,
      content: true,
      category: true,
      excerpt: true,
      parentPath: true,
    },
  });

  // 404 if page not found (next-js-expert: use notFound() for 404s)
  if (!page) {
    notFound();
  }

  /**
   * Handle wiki page update
   * Uses Server Action pattern for form submission
   */
  async function handleUpdateWikiPage(data: UpdateWikiPageInput) {
    'use server';

    const { title, content, category, excerpt, parentPath } = data;

    try {
      // Make API request to update wiki page
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/wiki/${params.slug}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
            category,
            excerpt,
            parentPath,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update wiki page');
      }

      const updatedPage = await response.json();

      // Redirect to the updated wiki page detail view
      // Remove leading slash from path for URL
      const urlPath = updatedPage.path.startsWith('/') ? updatedPage.path.slice(1) : updatedPage.path;
      redirect(`/wiki/${urlPath}`);
    } catch (error) {
      console.error('Error updating wiki page:', error);
      throw error; // Re-throw to be handled by Client Component
    }
  }

  /**
   * Handle cancel action
   */
  function handleCancel() {
    'use server';
    redirect(`/wiki/${params.slug}`); // Return to wiki detail page
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <WikiEditor
        mode="edit"
        initialData={page}
        onSave={handleUpdateWikiPage}
        onCancel={handleCancel}
      />
    </div>
  );
}
