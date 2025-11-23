/**
 * Session 3: AI Workflow Bootstrap
 *
 * Bootstrap complete AI workflow with agent personas, skills, workflows, SOPs, and roadmap
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { bootstrapWorkflow } from '@/app/onboarding/actions';
import {
  Loader2,
  Rocket,
  CheckCircle2,
  Bot,
  Book,
  Workflow,
  FileText,
  Map,
  ArrowRight,
  FolderOpen,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface BootstrapResult {
  success: boolean;
  data: {
    created: {
      agentPersonas: number;
      skills: number;
      workflows: number;
      sops: number;
      roadmap: {
        phases: number;
        weeks: number;
      };
      currentPlan: boolean;
      currentTodos: boolean;
      files: {
        claudeMd: boolean;
        agentsMd: boolean;
      };
    };
  };
}

export default function Session3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('project');
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : 1;
  const [repoPath, setRepoPath] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapResult, setBootstrapResult] = useState<BootstrapResult | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleBootstrap = async () => {
    if (!repoPath.trim()) {
      setError('Repository path is required');
      return;
    }

    setError('');
    setIsBootstrapping(true);

    startTransition(async () => {
      const result = await bootstrapWorkflow(projectId, repoPath);

      if (result.success) {
        setBootstrapResult(result as BootstrapResult);
      } else {
        setError(result.error || 'Bootstrap failed');
      }

      setIsBootstrapping(false);
    });
  };

  if (bootstrapResult) {
    const { created } = bootstrapResult.data;

    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Success Header */}
        <Card className="neu-raised mb-8 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-400 text-3xl">
              <CheckCircle2 className="h-8 w-8" />
              Bootstrap Complete!
            </CardTitle>
            <CardDescription>
              Your project is fully configured for AI-assisted development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate mb-6">
              All AI workflow components have been created and your repository files have been
              written. You're ready to start building with AI assistance!
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="neu-inset bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <Bot className="h-8 w-8 text-coral-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{created.agentPersonas}</p>
                  <p className="text-xs text-slate">Agent Personas</p>
                </CardContent>
              </Card>

              <Card className="neu-inset bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <Book className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{created.skills}</p>
                  <p className="text-xs text-slate">Skills</p>
                </CardContent>
              </Card>

              <Card className="neu-inset bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <Workflow className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{created.workflows}</p>
                  <p className="text-xs text-slate">Workflows</p>
                </CardContent>
              </Card>

              <Card className="neu-inset bg-slate-900/50">
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{created.sops}</p>
                  <p className="text-xs text-slate">SOPs</p>
                </CardContent>
              </Card>
            </div>

            {/* Roadmap Stats */}
            <Card className="neu-inset bg-slate-900/50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Map className="h-6 w-6 text-orange-500" />
                  <h3 className="text-lg font-semibold text-white">Development Roadmap</h3>
                </div>
                <p className="text-slate text-sm mb-3">
                  Complete project roadmap materialized from your project plan
                </p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-white">{created.roadmap.phases}</p>
                    <p className="text-xs text-slate">Phases</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{created.roadmap.weeks}</p>
                    <p className="text-xs text-slate">Weeks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Files Written */}
            <Card className="neu-inset bg-slate-900/50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FolderOpen className="h-6 w-6 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-white">Repository Files</h3>
                </div>
                <p className="text-slate text-sm mb-3">Written to: {repoPath}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white font-mono">CLAUDE.md</span>
                    <span className="text-xs text-slate">
                      (Claude Code integration guide)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white font-mono">AGENTS.md</span>
                    <span className="text-xs text-slate">(Agent personas reference)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="neu-raised">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Explore your newly configured project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/agents">
                <Bot className="mr-2 h-4 w-4" />
                View Agent Personas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/roadmap">
                <Map className="mr-2 h-4 w-4" />
                Explore Roadmap
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/onboarding">
                Back to Onboarding
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Page Header with Back Button */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">AI Workflow Bootstrap</h1>
          <p className="text-lg text-slate">
            Set up agent personas, skills, workflows, and SOPs tailored to your tech stack and
            project needs.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/onboarding?project=${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Onboarding
          </Link>
        </Button>
      </div>

      {/* Info Card */}
      <Card className="neu-raised mb-8">
        <CardHeader>
          <CardTitle>What Will Be Created</CardTitle>
          <CardDescription>Bootstrap creates all these components automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4 text-coral-500" />
                Agent Personas (3-5)
              </h3>
              <p className="text-sm text-slate ml-6">
                Expert AI assistants tailored to your tech stack (React Expert, Next.js Expert,
                Prisma Expert, etc.)
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Book className="h-4 w-4 text-blue-500" />
                Skills Library (5-10)
              </h3>
              <p className="text-sm text-slate ml-6">
                Coding patterns and best practices specific to your frameworks
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Workflow className="h-4 w-4 text-purple-500" />
                Workflows (3)
              </h3>
              <p className="text-sm text-slate ml-6">
                Process templates: Feature Development, Bug Fix, Code Review
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                SOPs (5)
              </h3>
              <p className="text-sm text-slate ml-6">
                Standard Operating Procedures: Git Workflow, Security, API, Testing, Deployment
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Map className="h-4 w-4 text-orange-500" />
                Development Roadmap
              </h3>
              <p className="text-sm text-slate ml-6">
                Complete roadmap materialized from your project plan (Phase → Sprint → Week → Day)
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-yellow-500" />
                Repository Files
              </h3>
              <p className="text-sm text-slate ml-6">
                CLAUDE.md and AGENTS.md written to your repository for AI agent integration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bootstrap Form */}
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle>Start Bootstrap</CardTitle>
          <CardDescription>
            This process takes approximately 30 seconds and cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleBootstrap();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="repoPath">Repository Path *</Label>
              <Input
                id="repoPath"
                type="text"
                placeholder="/path/to/your/repository"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                className="neu-inset bg-slate-900/50 border-slate-700 text-white mt-2"
                disabled={isBootstrapping}
              />
              <p className="text-xs text-slate mt-2">
                Absolute path where CLAUDE.md and AGENTS.md will be written
              </p>
              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isBootstrapping || !repoPath.trim()}
            >
              {isBootstrapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bootstrapping... (~30 seconds)
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Start Bootstrap
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
