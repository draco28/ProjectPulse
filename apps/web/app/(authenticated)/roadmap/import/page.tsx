/**
 * Import Roadmap Page - Standalone Roadmap UI Phase C
 *
 * Import roadmap from JSON file or paste JSON directly
 *
 * @see .agent/task/roadmap-ui/ROADMAP-UI-COMPONENTS.md
 */

import { Suspense } from 'react';
import { Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';
import { RoadmapImport } from '@/components/roadmap/import/RoadmapImport';

export default async function ImportRoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const { project, projectId } = await getActiveProjectForUser(user.id, params.project);

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-2 text-sm text-slate hover:text-coral transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roadmap
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="icon-coral flex h-14 w-14 items-center justify-center rounded-2xl flex-shrink-0">
            <Upload className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Import Roadmap</h1>
            <p className="text-slate text-sm">
              Upload a JSON file or paste your roadmap structure
            </p>
          </div>
        </div>
      </div>

      {/* Import Component */}
      <Suspense
        fallback={
          <div className="neu-raised rounded-3xl p-8 animate-pulse">
            <div className="h-48 bg-dark-pressed rounded-xl mb-4"></div>
            <div className="h-12 bg-dark-pressed rounded-xl w-1/3 mx-auto"></div>
          </div>
        }
      >
        <RoadmapImport projectId={projectId} projectName={project.name} />
      </Suspense>
    </>
  );
}
