/**
 * Create Ticket Page
 *
 * Sprint 10: Unified ticket creation form
 * Allows creating features, tasks, epics, issues, bugs, scanner findings, and tech debt
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-server';
import { getActiveProjectForUser } from '@/lib/project-context';
import { FloatingBackground } from '@/components/FloatingBackground';
import { Sidebar } from '@/components/Sidebar';
import { withProjectAuth } from '@/lib/project';
import { ProjectLayoutWrapper } from '@/components/layout';
import { getNextTicketNumber } from '@/lib/tickets/ticketNumber';

export const metadata: Metadata = {
  title: 'Create Ticket | ProjectPulse',
  description: 'Create a new ticket - feature, task, epic, issue, bug, or tech debt',
};

// Kind labels and colors
const kindOptions = [
  { value: 'feature', label: 'Feature', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'task', label: 'Task', color: 'bg-green-500/20 text-green-400' },
  { value: 'epic', label: 'Epic', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'issue', label: 'Issue', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'bug', label: 'Bug', color: 'bg-red-500/20 text-red-400' },
  { value: 'scanner_finding', label: 'Scanner Finding', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'tech_debt', label: 'Tech Debt', color: 'bg-gray-500/20 text-gray-400' },
];

const sourceOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'scanner', label: 'Scanner' },
  { value: 'agent', label: 'Agent' },
  { value: 'onboarding', label: 'Onboarding' },
];

const priorityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// Sprint 15: Updated for 5-status kanban workflow
const statusOptions = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

async function createTicket(formData: FormData) {
  'use server';

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const projectIdParam = formData.get('projectId') as string;
  const { projectId } = await getActiveProjectForUser(user.id, projectIdParam);

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const kind = formData.get('kind') as string;
  const source = formData.get('source') as string;
  const priority = formData.get('priority') as string;
  const status = formData.get('status') as string;
  const moduleValue = formData.get('module') as string;
  const assignee = formData.get('assignee') as string;

  if (!title || title.trim().length === 0) {
    throw new Error('Title is required');
  }

  // Sprint 17: Generate project-scoped ticketNumber in transaction
  const ticket = await prisma.$transaction(async (tx) => {
    const ticketNumber = await getNextTicketNumber(tx, projectId);
    return tx.ticket.create({
      data: {
        projectId,
        ticketNumber,
        title: title.trim(),
        description: description?.trim() || null,
        kind: kind || 'issue',
        source: source || 'manual',
        priority: priority || 'medium',
        status: status || 'backlog', // Sprint 15: Default to backlog
        module: moduleValue?.trim() || null,
        assignee: assignee?.trim() || null,
      },
    });
  });

  revalidatePath('/tickets');
  redirect(`/tickets/${ticket.id}?project=${projectId}`);
}

export default async function CreateTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;
  
  // Unified auth + project resolution
  const { project, projectId } = await withProjectAuth(params.project);

  return (
    <ProjectLayoutWrapper projectId={projectId} projectName={project.name}>
      <FloatingBackground />
      <div className="content-wrapper flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          {/* Header */}
          <header className="neu-raised smooth-transition rounded-3xl px-8 py-5">
            <div className="mb-4">
              <Link
                href={`/tickets?project=${projectId}`}
                className="inline-flex items-center gap-2 text-sm text-coral transition-colors hover:text-coral-light"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tickets
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white">Create New Ticket</h1>
            <p className="mt-1 text-sm text-slate">{project.name} - Create a new work item</p>
          </header>

          {/* Form */}
          <main className="neu-raised smooth-transition rounded-3xl p-8">
            <form action={createTicket} className="max-w-2xl space-y-6">
              <input type="hidden" name="projectId" value={projectId} />

              {/* Title - Required */}
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-white">
                  Title <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  maxLength={200}
                  placeholder="Enter ticket title"
                  className="bg-surface-dark border-surface-light w-full rounded-xl border px-4 py-3 text-white placeholder-slate focus:border-transparent focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder="Describe the ticket in detail..."
                  className="bg-surface-dark border-surface-light w-full resize-none rounded-xl border px-4 py-3 text-white placeholder-slate focus:border-transparent focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </div>

              {/* Kind and Source Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Kind */}
                <div>
                  <label htmlFor="kind" className="mb-2 block text-sm font-medium text-white">
                    Kind <span className="text-coral">*</span>
                  </label>
                  <select
                    id="kind"
                    name="kind"
                    required
                    defaultValue="issue"
                    className="bg-surface-dark border-surface-light w-full rounded-xl border px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-coral"
                  >
                    {kindOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label htmlFor="source" className="mb-2 block text-sm font-medium text-white">
                    Source
                  </label>
                  <select
                    id="source"
                    name="source"
                    defaultValue="manual"
                    className="bg-surface-dark border-surface-light w-full rounded-xl border px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-coral"
                  >
                    {sourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority and Status Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="mb-2 block text-sm font-medium text-white">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue="medium"
                    className="bg-surface-dark border-surface-light w-full rounded-xl border px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-coral"
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status - Sprint 15: 5-status kanban workflow */}
                <div>
                  <label htmlFor="status" className="mb-2 block text-sm font-medium text-white">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue="backlog"
                    className="bg-surface-dark border-surface-light w-full rounded-xl border px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-coral"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Module */}
              <div>
                <label htmlFor="module" className="mb-2 block text-sm font-medium text-white">
                  Module
                </label>
                <input
                  type="text"
                  id="module"
                  name="module"
                  placeholder="e.g., API, UI, Database"
                  className="bg-surface-dark border-surface-light w-full rounded-xl border px-4 py-3 text-white placeholder-slate focus:border-transparent focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </div>

              {/* Assignee */}
              <div>
                <label htmlFor="assignee" className="mb-2 block text-sm font-medium text-white">
                  Assignee
                </label>
                <input
                  type="text"
                  id="assignee"
                  name="assignee"
                  placeholder="Enter assignee name"
                  className="bg-surface-dark border-surface-light w-full rounded-xl border px-4 py-3 text-white placeholder-slate focus:border-transparent focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  className="coral-gradient smooth-transition rounded-2xl px-8 py-3 font-semibold text-white shadow-lg hover:opacity-90"
                >
                  Create Ticket
                </button>
                <Link
                  href={`/tickets?project=${projectId}`}
                  className="rounded-2xl px-8 py-3 font-semibold text-slate transition-colors hover:text-white"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </main>
        </div>
      </div>
    </ProjectLayoutWrapper>
  );
}
