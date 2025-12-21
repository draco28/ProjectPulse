import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { WikiEditor } from '@/components/wiki/WikiEditor';
import { UpdateWikiPageInput } from '@/lib/validations/wiki';

interface WikiEditPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function WikiEditPage({ params }: WikiEditPageProps) {
  const { slug } = await params;
  const path = slug.join('/');
  // Normalize path for DB lookup (add leading slash if needed)
  const dbPath = path.startsWith('/') ? path : `/${path}`;

  const page = await prisma.wikiPage.findUnique({
    where: { path: dbPath },
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

    redirect(`/wiki/${path}`);
  }

  return (
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
        onCancelPath={`/wiki/${path}`}
      />
    </div>
  );
}
