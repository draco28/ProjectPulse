/**
 * Session 2: Document Viewer
 *
 * View all generated documents with markdown rendering
 */

import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { notFound } from 'next/navigation';

async function getDocuments(projectId: number) {
  const session = await prisma.onboardingSession.findUnique({
    where: {
      projectId_sessionNumber: {
        projectId,
        sessionNumber: 2,
      },
    },
    include: {
      documents: {
        orderBy: { filename: 'asc' },
      },
    },
  });

  return session?.documents || [];
}

interface PageProps {
  searchParams: { doc?: string; project?: string };
}

export default async function DocumentsViewerPage({ searchParams }: PageProps) {
  const projectId = searchParams.project ? parseInt(searchParams.project, 10) : 1;
  const documents = await getDocuments(projectId);

  if (documents.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Card className="neu-raised">
          <CardContent className="p-6">
            <p className="text-slate">No documents generated yet.</p>
            <Button asChild className="mt-4">
              <Link href={`/onboarding/session-2?project=${projectId}`}>
                Back to Document Generation
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get selected document (first one by default)
  const selectedFilename = searchParams.doc || documents[0]?.filename;
  const selectedDoc = documents.find((d) => d.filename === selectedFilename);

  if (!selectedDoc && searchParams.doc) {
    notFound();
  }

  const categoryColors = {
    planning: 'bg-blue-500/20 text-blue-400',
    architecture: 'bg-purple-500/20 text-purple-400',
    implementation: 'bg-green-500/20 text-green-400',
    operations: 'bg-orange-500/20 text-orange-400',
  };

  // Group documents by category
  const groupedDocs = documents.reduce(
    (acc, doc) => {
      const cat = doc.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(doc);
      return acc;
    },
    {} as Record<string, typeof documents>
  );

  const categories = ['planning', 'architecture', 'implementation', 'operations'];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">Documentation</h1>
          <p className="text-slate">{documents.length} of 15 documents generated</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/onboarding/session-2?project=${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generation
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <Card className="neu-raised sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-4">
                {categories.map((category) => {
                  const docs = groupedDocs[category] || [];
                  if (docs.length === 0) return null;

                  return (
                    <div key={category}>
                      <h3 className="mb-2 text-xs font-semibold uppercase text-slate">
                        {category}
                      </h3>
                      <div className="space-y-1">
                        {docs.map((doc) => (
                          <Link
                            key={doc.id}
                            href={`/onboarding/session-2/documents?project=${projectId}&doc=${encodeURIComponent(doc.filename)}`}
                            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                              selectedDoc?.id === doc.id
                                ? 'bg-coral-500 text-white'
                                : 'text-slate hover:bg-slate-800'
                            }`}
                          >
                            {doc.filename.replace('.md', '')}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Document Content */}
        <div className="col-span-12 md:col-span-9">
          {selectedDoc ? (
            <Card className="neu-raised">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedDoc.filename}</CardTitle>
                    <CardDescription>
                      {selectedDoc.wordCount.toLocaleString()} words •{' '}
                      {new Date(selectedDoc.generatedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={
                        categoryColors[selectedDoc.category as keyof typeof categoryColors] ||
                        'bg-slate-500/20 text-slate-400'
                      }
                    >
                      {selectedDoc.category}
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`data:text/markdown;charset=utf-8,${encodeURIComponent(selectedDoc.content)}`}
                        download={selectedDoc.filename}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none overflow-x-auto">
                  <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="neu-raised">
              <CardContent className="flex h-96 items-center justify-center">
                <p className="text-slate">Select a document to view</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
