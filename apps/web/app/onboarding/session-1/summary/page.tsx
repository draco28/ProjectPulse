/**
 * Session 1: Executive Summary Generation
 *
 * Allows users to generate executive summary via:
 * 1. Agent Generation (primary) - MCP workflow
 * 2. Manual Entry - Direct input
 */

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PromptDialog } from '@/components/onboarding/PromptDialog';
import { storeExecutiveSummary } from '@/app/onboarding/actions';
import { Loader2, Sparkles, PenTool, ArrowRight } from 'lucide-react';

export default function ExecutiveSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('project');
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : 1;
  const [promptData, setPromptData] = useState<any>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [manualSummary, setManualSummary] = useState('');
  const [isPending, startTransition] = useTransition();

  // Fetch executive summary prompt
  useEffect(() => {
    async function fetchPrompt() {
      setIsLoadingPrompt(true);
      try {
        const res = await fetch(
          `/api/onboarding/executive-summary-prompt?projectId=${projectId}`
        );
        if (!res.ok) throw new Error('Failed to fetch prompt');
        const data = await res.json();
        setPromptData(data);
      } catch (error) {
        console.error('Error fetching prompt:', error);
      } finally {
        setIsLoadingPrompt(false);
      }
    }

    fetchPrompt();
  }, [projectId]);

  const handleStoreSummary = async (summary: string) => {
    startTransition(async () => {
      const wordCount = summary.split(/\s+/).filter((w) => w).length;
      const result = await storeExecutiveSummary(projectId, summary, wordCount);

      if (result.success) {
        // Session 1 complete - redirect to onboarding root
        router.push('/onboarding');
      } else {
        alert(`Error: ${result.error}`);
      }
    });
  };

  if (isLoadingPrompt) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-coral-500" />
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="neu-raised">
          <CardContent className="p-6">
            <p className="text-red-400">
              Failed to load prompt data. Please complete all 10 phases first.
            </p>
            <Button variant="outline" onClick={() => router.push('/onboarding/session-1')} className="mt-4">
              Back to Questions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Executive Summary</h1>
        <p className="text-lg text-slate">
          Generate a comprehensive executive summary (~500 words) of your project based on the 96
          questions you answered.
        </p>
      </div>

      {/* Prompt Metadata Card */}
      <Card className="neu-raised mb-6">
        <CardHeader>
          <CardTitle>Ready to Generate</CardTitle>
          <CardDescription>
            All {promptData.metadata.totalQuestions} questions answered across{' '}
            {promptData.metadata.completedPhases} phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate">Total Questions</p>
              <p className="text-2xl font-bold text-white">
                {promptData.metadata.totalQuestions}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate">Completed Phases</p>
              <p className="text-2xl font-bold text-white">
                {promptData.metadata.completedPhases}/10
              </p>
            </div>
            <div>
              <p className="text-sm text-slate">Target Word Count</p>
              <p className="text-2xl font-bold text-white">{promptData.wordCountTarget}</p>
            </div>
            <div>
              <p className="text-sm text-slate">Prompt Size</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(promptData.metadata.userPromptCharacters / 1000)}K chars
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Tabs */}
      <Card className="neu-raised">
        <CardContent className="p-6">
          <Tabs defaultValue="agent" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="agent">
                <Sparkles className="mr-2 h-4 w-4" />
                Agent Generation
              </TabsTrigger>
              <TabsTrigger value="manual">
                <PenTool className="mr-2 h-4 w-4" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            {/* Agent Generation Tab */}
            <TabsContent value="agent" className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">
                  Agent-Side AI Generation (Recommended)
                </h3>
                <p className="text-sm text-slate-300 mb-4">
                  Use your AI agent (Claude Code, ChatGPT, etc.) to generate the executive summary.
                  This keeps your data private and uses your own AI provider.
                </p>
                <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Click "Get Prompt" to view the system and user prompts</li>
                  <li>Copy both prompts to your AI agent</li>
                  <li>Generate the summary with your AI</li>
                  <li>Paste the result back and store it</li>
                </ol>
              </div>

              <Button
                onClick={() => setShowPromptDialog(true)}
                size="lg"
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Get Prompt & Generate with Agent
              </Button>
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">Manual Entry</h3>
                <p className="text-sm text-slate-300">
                  Write or paste your executive summary directly. Target: ~
                  {promptData.wordCountTarget} words.
                </p>
              </div>

              <div>
                <Textarea
                  placeholder="Write your executive summary here..."
                  value={manualSummary}
                  onChange={(e) => setManualSummary(e.target.value)}
                  rows={15}
                  className="neu-inset bg-slate-900/50 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Word count: {manualSummary.split(/\s+/).filter((w) => w).length} words
                </p>
              </div>

              <Button
                onClick={() => handleStoreSummary(manualSummary)}
                disabled={!manualSummary.trim() || isPending}
                size="lg"
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Storing...
                  </>
                ) : (
                  <>
                    Store Summary & Complete Session 1
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Prompt Dialog */}
      {promptData && (
        <PromptDialog
          open={showPromptDialog}
          onOpenChange={setShowPromptDialog}
          systemPrompt={promptData.systemPrompt}
          userPrompt={promptData.userPrompt}
          onComplete={handleStoreSummary}
        />
      )}
    </div>
  );
}
