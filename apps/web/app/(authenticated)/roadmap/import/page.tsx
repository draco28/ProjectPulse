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
import { withProjectAuth } from '@/lib/project';
import { ProjectLayoutWrapper } from '@/components/layout';
import { RoadmapImport } from '@/components/roadmap/import/RoadmapImport';

export default async function ImportRoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;

  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(params.project);

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      {/* Page Header */}
      <div className="mb-6">
        <Link
          href={`/roadmap?project=${projectId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate transition-colors hover:text-coral"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roadmap
        </Link>

        <div className="mb-2 flex items-center gap-3">
          <div className="icon-coral flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl">
            <Upload className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Import Roadmap</h1>
            <p className="text-sm text-slate">Upload a JSON file or paste your roadmap structure</p>
          </div>
        </div>
      </div>

      {/* Import Component */}
      <Suspense
        fallback={
          <div className="neu-raised animate-pulse rounded-3xl p-8">
            <div className="mb-4 h-48 rounded-xl bg-dark-pressed"></div>
            <div className="mx-auto h-12 w-1/3 rounded-xl bg-dark-pressed"></div>
          </div>
        }
      >
        <RoadmapImport projectId={projectId} projectName={project.name} />
      </Suspense>
    </ProjectLayoutWrapper>
  );
}
