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
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';
import { RoadmapWizard } from '@/components/roadmap/wizard/RoadmapWizard';

export default async function CreateRoadmapPage({
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
            <Map className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Create Roadmap</h1>
            <p className="text-slate text-sm">
              Define your project phases and sprints step by step
            </p>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <Suspense
        fallback={
          <div className="neu-raised rounded-3xl p-8 animate-pulse">
            <div className="h-8 bg-dark-pressed rounded-xl mb-6 w-1/4 mx-auto"></div>
            <div className="h-64 bg-dark-pressed rounded-xl mb-4"></div>
            <div className="h-12 bg-dark-pressed rounded-xl w-1/3 mx-auto"></div>
          </div>
        }
      >
        <RoadmapWizard projectId={projectId} projectName={project.name} />
      </Suspense>
    </>
  );
}
