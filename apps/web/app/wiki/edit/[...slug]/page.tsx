import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { WikiEditor } from '@/components/wiki/WikiEditor';
import { ProjectLayoutWrapper } from '@/components/layout';
import { withProjectAuth } from '@/lib/project';
import { UpdateWikiPageInput } from '@/lib/validations/wiki';

// Force dynamic rendering to prevent pre-render errors with useProject
export const dynamic = 'force-dynamic';

interface WikiEditPageProps {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{
    project?: string;
    [key: string]: string | undefined;
  }>;
}

export default async function WikiEditPage({ params, searchParams }: WikiEditPageProps) {
  const [{ slug }, queryParams] = await Promise.all([params, searchParams]);

  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(queryParams.project);

  const path = slug.join('/');
  // Normalize path for DB lookup (add leading slash if needed)
  const dbPath = path.startsWith('/') ? path : `/${path}`;

  const page = await prisma.wikiPage.findUnique({
    where: { path: dbPath, projectId }, // Ensure project isolation
  });

  if (!page) {
    notFound();
  }

  async function handleUpdateWikiPage(data: UpdateWikiPageInput) {
    'use server';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/wiki/${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-projectpulse-actor': 'Human Editor',
      },
      body: JSON.stringify({
        ...data,
        changelog: 'Updated via Web Editor',
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Failed to update');
    }

    redirect(`/wiki/${path}?project=${projectId}`);
  }

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <WikiEditor
          mode="edit"
          initialData={{
            id: page.id,
            title: page.title,
            path: page.path,
            content: page.content,
            category: page.category as any,
            excerpt: page.excerpt,
          }}
          onSave={handleUpdateWikiPage}
          onCancelPath={`/wiki/${path}?project=${projectId}`}
        />
      </div>
    </ProjectLayoutWrapper>
  );
}
