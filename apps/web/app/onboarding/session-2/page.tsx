/**
 * Session 2: Documentation Generation
 *
 * Dashboard for generating 15 industry-standard documents
 */

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentCard } from '@/components/onboarding/DocumentCard';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { PromptDialog } from '@/components/onboarding/PromptDialog';
import { storeDocument } from '@/app/onboarding/actions';
import { Loader2, FileText, Sparkles } from 'lucide-react';

interface DocumentPrompt {
  filename: string;
  title: string;
  category: 'planning' | 'architecture' | 'implementation' | 'operations';
  wordCountTarget: number;
  systemPrompt: string;
  userPrompt: string;
}

interface Document {
  id: number;
  filename: string;
  content: string;
  category: string;
  wordCount: number;
  generatedAt: string;
}

export default function Session2Page() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<DocumentPrompt[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<DocumentPrompt | null>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<string>('all');

  const projectId = 1; // TODO: Get from auth/session

  // Fetch document prompts
  useEffect(() => {
    async function fetchPrompts() {
      setIsLoadingPrompts(true);
      try {
        const res = await fetch(`/api/onboarding/document-prompts?projectId=${projectId}`);
        if (!res.ok) throw new Error('Failed to fetch prompts');
        const data = await res.json();
        setPrompts(data.documentPrompts);
      } catch (error) {
        console.error('Error fetching prompts:', error);
      } finally {
        setIsLoadingPrompts(false);
      }
    }

    fetchPrompts();
  }, [projectId]);

  // Fetch stored documents (poll while generating)
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch(`/api/onboarding/documents?projectId=${projectId}`);
        if (!res.ok) throw new Error('Failed to fetch documents');
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setIsLoadingDocs(false);
      }
    }

    fetchDocuments();

    // Poll every 5 seconds if documents < 15
    const interval = setInterval(() => {
      if (documents.length < 15) {
        fetchDocuments();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, documents.length]);

  const handleGenerate = (prompt: DocumentPrompt) => {
    setSelectedPrompt(prompt);
    setShowPromptDialog(true);
  };

  const handleStoreDocument = async (content: string) => {
    if (!selectedPrompt) return;

    startTransition(async () => {
      const wordCount = content.split(/\s+/).filter((w) => w).length;
      const result = await storeDocument(
        projectId,
        selectedPrompt.filename,
        content,
        selectedPrompt.category,
        wordCount
      );

      if (result.success) {
        // Refresh documents list
        const res = await fetch(`/api/onboarding/documents?projectId=${projectId}`);
        const data = await res.json();
        setDocuments(data.documents || []);

        // Check if Session 2 is complete
        if (data.session2Complete) {
          router.push('/onboarding');
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    });
  };

  const isDocumentGenerated = (filename: string) => {
    return documents.some((doc) => doc.filename === filename);
  };

  const getDocument = (filename: string) => {
    return documents.find((doc) => doc.filename === filename);
  };

  const progress = (documents.length / 15) * 100;

  const filteredPrompts =
    activeTab === 'all'
      ? prompts
      : prompts.filter((p) => p.category === activeTab);

  if (isLoadingPrompts || isLoadingDocs) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-coral-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Documentation Generation</h1>
        <p className="text-lg text-slate">
          Generate 15 industry-standard documents (~30,000 words total) to establish complete
          project documentation.
        </p>
      </div>

      {/* Progress Card */}
      <Card className="neu-raised mb-8">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {documents.length} of 15 documents generated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar value={progress} showPercentage />
          <div className="mt-4 flex gap-4">
            <Button
              onClick={() => router.push('/onboarding/session-2/documents')}
              variant="outline"
              disabled={documents.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              View All Documents
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({prompts.length})</TabsTrigger>
          <TabsTrigger value="planning">
            Planning ({prompts.filter((p) => p.category === 'planning').length})
          </TabsTrigger>
          <TabsTrigger value="architecture">
            Architecture ({prompts.filter((p) => p.category === 'architecture').length})
          </TabsTrigger>
          <TabsTrigger value="implementation">
            Implementation ({prompts.filter((p) => p.category === 'implementation').length})
          </TabsTrigger>
          <TabsTrigger value="operations">
            Operations ({prompts.filter((p) => p.category === 'operations').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.map((prompt) => {
          const doc = getDocument(prompt.filename);
          return (
            <DocumentCard
              key={prompt.filename}
              filename={prompt.filename}
              title={prompt.title}
              category={prompt.category}
              wordCountTarget={prompt.wordCountTarget}
              isGenerated={isDocumentGenerated(prompt.filename)}
              wordCount={doc?.wordCount}
              onGenerate={() => handleGenerate(prompt)}
              onView={
                doc
                  ? () =>
                      router.push(
                        `/onboarding/session-2/documents?doc=${encodeURIComponent(prompt.filename)}`
                      )
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* Prompt Dialog */}
      {selectedPrompt && (
        <PromptDialog
          open={showPromptDialog}
          onOpenChange={setShowPromptDialog}
          systemPrompt={selectedPrompt.systemPrompt}
          userPrompt={selectedPrompt.userPrompt}
          onComplete={handleStoreDocument}
        />
      )}
    </div>
  );
}
