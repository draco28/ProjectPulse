import { MemoryBankType } from '@prisma/client';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/Sidebar';
import { FloatingBackground } from '@/components/FloatingBackground';
import { getCurrentUser } from '@/lib/auth-server';
import { redirect, notFound } from 'next/navigation';
import { getActiveProjectForUser } from '@/lib/project-context';

interface PageProps {
  params: {
    type: string;
  };
  searchParams: {
    project?: string;
  };
}

export const dynamic = 'force-dynamic';

function parseMemoryBankType(raw: string): MemoryBankType | null {
  if (!raw) return null;
  const normalized = raw.toUpperCase();
  const values = Object.values(MemoryBankType) as string[];
  return (values.find((value) => value === normalized) as MemoryBankType | undefined) ?? null;
}

function formatMemoryBankType(type: MemoryBankType): string {
  switch (type) {
    case 'PROJECT_BRIEF':
      return 'Project Brief';
    case 'SYSTEM_PATTERNS':
      return 'System Patterns';
    case 'TECH_CONTEXT':
      return 'Tech Context';
    case 'ACTIVE_CONTEXT':
      return 'Active Context';
    case 'PROGRESS':
      return 'Progress';
    default:
      return type;
  }
}

export default async function MemoryBankDetailPage({ params, searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { project, projectId } = await getActiveProjectForUser(user.id, searchParams.project);

  const bankType = parseMemoryBankType(params.type);
  if (!bankType) {
    notFound();
  }

  const bank = await prisma.memoryBank.findUnique({
    where: {
      projectId_type: {
        projectId,
        type: bankType,
      },
    },
  });

  if (!bank) {
    notFound();
  }

  const readableType = formatMemoryBankType(bank.type);
  const updatedAt = bank.updatedAt.toLocaleString();
  const tokenLabel = `${bank.summaryTokens ?? 0} tokens`;

  return (
    <>
      <FloatingBackground />
      <div className="flex h-screen overflow-hidden">
        <Sidebar projectId={projectId} />

        <div className="content-wrapper flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-coral">Memory Bank</p>
                <h2 className="mb-1 text-3xl font-bold text-white">{readableType}</h2>
                <p className="text-sm text-slate">
                  {project?.name ?? 'Project'} • ~{tokenLabel} • Updated {updatedAt}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Link
                  href={`/knowledge?project=${encodeURIComponent(searchParams.project ?? String(projectId))}`}
                  className="neu-raised smooth-transition rounded-2xl px-4 py-2 text-xs font-semibold text-slate hover:text-white"
                >
                  Back to Knowledge
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="neu-raised smooth-transition rounded-3xl p-8">
              <div className="mb-4 text-xs uppercase tracking-wide text-slate/70">
                Canonical markdown snapshot
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate">
                {bank.content || 'This memory bank is currently empty.'}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
