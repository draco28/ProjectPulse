/**
 * Create Roadmap Page - Standalone Roadmap UI Phase B
 *
 * 4-step wizard for creating roadmaps without onboarding:
 * Step 1: Project Info (title, description, start date)
 * Step 2: Phases (add/edit/remove phases)
 * Step 3: Sprints (sprints per phase)
 * Step 4: Preview (full hierarchy preview + create)
 *
 * @see .agent/task/roadmap-ui/ROADMAP-UI-COMPONENTS.md
 */

import { Suspense } from 'react';
import { Map, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { withProjectAuth } from '@/lib/project';
import { ProjectLayoutWrapper } from '@/components/layout';
import { RoadmapWizard } from '@/components/roadmap/wizard/RoadmapWizard';

export default async function CreateRoadmapPage({
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
            <Map className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Create Roadmap</h1>
            <p className="text-sm text-slate">
              Define your project phases and sprints step by step
            </p>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <Suspense
        fallback={
          <div className="neu-raised animate-pulse rounded-3xl p-8">
            <div className="mx-auto mb-6 h-8 w-1/4 rounded-xl bg-dark-pressed"></div>
            <div className="mb-4 h-64 rounded-xl bg-dark-pressed"></div>
            <div className="mx-auto h-12 w-1/3 rounded-xl bg-dark-pressed"></div>
          </div>
        }
      >
        <RoadmapWizard projectId={projectId} projectName={project.name} />
      </Suspense>
    </ProjectLayoutWrapper>
  );
}
