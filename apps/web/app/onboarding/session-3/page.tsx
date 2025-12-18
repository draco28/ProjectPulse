/**
 * Session 3: AI Workflow Setup
 *
 * Guidance page showing MCP tools for setting up agent personas, skills, workflows, and SOPs.
 * Agents use MCP batch tools directly - this page provides information only.
 */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  Bot,
  Book,
  Workflow,
  FileText,
  ArrowLeft,
  Terminal,
  CheckCircle2,
  Info,
} from 'lucide-react';
import Link from 'next/link';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-coral-500" />
    </div>
  );
}

// Main page wrapper with Suspense boundary
export default function Session3Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Session3Content />
    </Suspense>
  );
}

// Content component that uses useSearchParams
function Session3Content() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('project');
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : 1;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Page Header with Back Button */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">AI Workflow Setup</h1>
          <p className="text-lg text-slate">
            Configure agent personas, skills, workflows, and SOPs for your project.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/onboarding?project=${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Onboarding
          </Link>
        </Button>
      </div>

      {/* MCP Tools Guidance */}
      <Card className="neu-raised mb-8 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-blue-400">
            <Terminal className="h-6 w-6" />
            For AI Agents: Use MCP Tools
          </CardTitle>
          <CardDescription>
            Session 3 is completed via MCP batch tools. Use the following tools in order:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 font-mono text-sm">
            {/* Step 1: Personas */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-coral-500 font-bold">1.</span>
                <Bot className="h-4 w-4 text-coral-500" />
                <span className="text-white font-semibold">Create Agent Personas</span>
                <span className="text-xs text-slate ml-auto">(Required)</span>
              </div>
              <code className="text-green-400 block mt-2">
                projectpulse_batch_createAgentPersonas({'{ personas: [...] }'})
              </code>
              <p className="text-xs text-slate mt-2">
                Create 1-10 expert personas tailored to your tech stack
              </p>
            </div>

            {/* Step 2: Skills */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-500 font-bold">2.</span>
                <Book className="h-4 w-4 text-blue-500" />
                <span className="text-white font-semibold">Create Skills</span>
                <span className="text-xs text-slate ml-auto">(Optional)</span>
              </div>
              <code className="text-green-400 block mt-2">
                projectpulse_batch_createSkills({'{ skills: [...] }'})
              </code>
              <p className="text-xs text-slate mt-2">
                Define coding patterns and best practices
              </p>
            </div>

            {/* Step 3: Workflows */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-500 font-bold">3.</span>
                <Workflow className="h-4 w-4 text-purple-500" />
                <span className="text-white font-semibold">Create Workflow Templates</span>
                <span className="text-xs text-slate ml-auto">(Optional)</span>
              </div>
              <code className="text-green-400 block mt-2">
                projectpulse_batch_createWorkflowTemplates({'{ workflows: [...] }'})
              </code>
              <p className="text-xs text-slate mt-2">
                Define process templates for feature dev, bug fix, etc.
              </p>
            </div>

            {/* Step 4: SOPs */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-500 font-bold">4.</span>
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-white font-semibold">Create SOPs</span>
                <span className="text-xs text-slate ml-auto">(Optional)</span>
              </div>
              <code className="text-green-400 block mt-2">
                projectpulse_batch_createSOPs({'{ sops: [...] }'})
              </code>
              <p className="text-xs text-slate mt-2">
                Standard operating procedures for common tasks
              </p>
            </div>

            {/* Step 5: Sync */}
            <div className="p-4 rounded-lg bg-slate-900/50 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-400 font-bold">5.</span>
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-white font-semibold">Mark Session Complete</span>
                <span className="text-xs text-green-400 ml-auto">(Required)</span>
              </div>
              <code className="text-green-400 block mt-2">
                projectpulse_onboarding_syncSession3()
              </code>
              <p className="text-xs text-slate mt-2">
                Validates artifacts and marks Session 3 as complete
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="neu-raised mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-slate" />
            What Gets Created
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Bot className="h-5 w-5 text-coral-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Agent Personas</p>
                <p className="text-xs text-slate">Expert AI assistants for your tech stack</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Book className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Skills Library</p>
                <p className="text-xs text-slate">Coding patterns and best practices</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Workflow className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Workflow Templates</p>
                <p className="text-xs text-slate">Feature dev, bug fix, code review</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">SOPs</p>
                <p className="text-xs text-slate">Git, security, testing procedures</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="neu-raised">
        <CardHeader>
          <CardTitle>Explore Results</CardTitle>
          <CardDescription>
            After completing Session 3, explore your created artifacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/agents?project=${projectId}`}>
              <Bot className="mr-2 h-4 w-4" />
              View Agent Personas
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href={`/dashboard?project=${projectId}`}>
              Go to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
