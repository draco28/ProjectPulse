/**
 * Onboarding Root Page - Server Component
 *
 * Shows 3-session onboarding overview with progress tracking
 * Implements sequential unlocking (Session 2 requires Session 1 complete, etc.)
 */

import { prisma } from '@/lib/prisma';
import { SessionCard } from '@/components/onboarding/SessionCard';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, FileText, Rocket, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

async function getOnboardingStatus(projectId: number) {
  const sessions = await prisma.onboardingSession.findMany({
    where: { projectId },
    select: {
      sessionNumber: true,
      status: true,
      completedAt: true,
    },
    orderBy: { sessionNumber: 'asc' },
  });

  const sessionMap = new Map(sessions.map((s) => [s.sessionNumber, s]));

  return {
    session1: sessionMap.get(1),
    session2: sessionMap.get(2),
    session3: sessionMap.get(3),
    allComplete: sessions.length === 3 && sessions.every((s) => s.status === 'complete'),
    completedCount: sessions.filter((s) => s.status === 'complete').length,
  };
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { project?: string };
}) {
  const projectId = searchParams.project ? parseInt(searchParams.project, 10) : 1;

  const status = await getOnboardingStatus(projectId);

  // Calculate overall progress
  const overallProgress = (status.completedCount / 3) * 100;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Project Onboarding</h1>
        <p className="text-lg text-slate max-w-3xl">
          Complete your project setup in 3 sessions to unlock AI-assisted development with
          agent personas, skills, and workflows.
        </p>
      </div>

      {/* Overall Progress */}
      {!status.allComplete && (
        <Card className="neu-raised mb-8">
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>
              {status.completedCount} of 3 sessions complete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBar value={overallProgress} showPercentage />
          </CardContent>
        </Card>
      )}

      {/* Completion Celebration */}
      {status.allComplete && (
        <Card className="neu-raised mb-8 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-400">
              <CheckCircle2 className="h-6 w-6" />
              Onboarding Complete!
            </CardTitle>
            <CardDescription>
              Your project is fully configured for AI-assisted development.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate">
              You now have access to agent personas, skills library, workflows, and a complete
              development roadmap. Start building with AI assistance!
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href={`/dashboard?project=${projectId}`}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/agents?project=${projectId}`}>View Agent Personas</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/roadmap?project=${projectId}`}>View Roadmap</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3-Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SessionCard
          session={1}
          title="Strategic Planning"
          description="Answer 96 questions about your project across 10 phases to create a comprehensive strategic foundation."
          status={
            status.session1?.status === 'complete'
              ? 'complete'
              : status.session1?.status === 'in_progress'
                ? 'in_progress'
                : 'not_started'
          }
          href={`/onboarding/session-1?project=${projectId}`}
          icon={FileQuestion}
        />

        <SessionCard
          session={2}
          title="Documentation"
          description="Generate 15 industry-standard documents (~30,000 words) to establish complete project documentation."
          status={
            status.session2?.status === 'complete'
              ? 'complete'
              : status.session2?.status === 'in_progress'
                ? 'in_progress'
                : 'not_started'
          }
          href={`/onboarding/session-2?project=${projectId}`}
          disabled={!status.session1 || status.session1.status !== 'complete'}
          icon={FileText}
        />

        <SessionCard
          session={3}
          title="AI Workflow Bootstrap"
          description="Set up agent personas, skills, workflows, and SOPs tailored to your tech stack and project needs."
          status={
            status.session3?.status === 'complete'
              ? 'complete'
              : status.session3?.status === 'in_progress'
                ? 'in_progress'
                : 'not_started'
          }
          href={`/onboarding/session-3?project=${projectId}`}
          disabled={!status.session2 || status.session2.status !== 'complete'}
          icon={Rocket}
        />
      </div>

      {/* What You'll Get */}
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle>What You'll Get</CardTitle>
          <CardDescription>
            Complete onboarding unlocks these features for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Session 1 Outputs:</h4>
              <ul className="list-disc list-inside text-sm text-slate space-y-1">
                <li>Executive summary (500 words)</li>
                <li>Project context JSON</li>
                <li>96 Q&A pairs covering all aspects</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Session 2 Outputs:</h4>
              <ul className="list-disc list-inside text-sm text-slate space-y-1">
                <li>15 industry-standard documents</li>
                <li>PRD, SRS, Architecture, API specs</li>
                <li>Complete project plan and roadmap</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Session 3 Outputs:</h4>
              <ul className="list-disc list-inside text-sm text-slate space-y-1">
                <li>3-5 Agent personas (tech stack-based)</li>
                <li>5-10 Skills (coding patterns)</li>
                <li>3 Workflow templates + 5 SOPs</li>
                <li>Complete roadmap (Phase → Sprint → Week → Day)</li>
                <li>CLAUDE.md and AGENTS.md files</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Time Investment:</h4>
              <ul className="list-disc list-inside text-sm text-slate space-y-1">
                <li>Session 1: 60-90 minutes</li>
                <li>Session 2: 30-60 minutes</li>
                <li>Session 3: 15-30 minutes</li>
                <li>Total: ~2-3 hours for complete setup</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
