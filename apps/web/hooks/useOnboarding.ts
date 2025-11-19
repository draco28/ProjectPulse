/**
 * React Query hooks for Onboarding API
 *
 * Provides hooks for all 3 onboarding sessions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

interface Question {
  id: string;
  questionNumber: number;
  text: string;
  placeholder: string;
  isRequired: boolean;
}

interface Subsection {
  id: string;
  name: string;
  questions: Question[];
}

interface QuestionsResponse {
  phase: number;
  phaseName: string;
  subsections: Subsection[];
  totalQuestions: number;
}

interface AnswersPayload {
  projectId: number;
  phase: number;
  answers: Record<string, string>;
}

interface DocumentPrompt {
  filename: string;
  title: string;
  category: 'planning' | 'architecture' | 'implementation' | 'operations';
  wordCountTarget: number;
  systemPrompt: string;
  userPrompt: string;
}

interface DocumentPromptsResponse {
  totalDocuments: number;
  estimatedTotalWords: number;
  documentPrompts: DocumentPrompt[];
}

interface Document {
  id: number;
  filename: string;
  content: string;
  category: string;
  wordCount: number;
  generatedAt: string;
}

interface DocumentsResponse {
  totalDocuments: number;
  documents: Document[];
  session2Complete?: boolean;
}

interface StoreDocumentPayload {
  projectId: number;
  filename: string;
  content: string;
  category: string;
  wordCount: number;
}

interface BootstrapPayload {
  projectId: number;
  repoPath: string;
}

interface BootstrapResult {
  success: boolean;
  session3Complete: boolean;
  created: {
    agentPersonas: number;
    skills: number;
    workflows: number;
    sops: number;
    roadmap: {
      id: string;
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
}

// ============================================================================
// Session 1: Strategic Planning
// ============================================================================

export function useQuestions(projectId: number, phase: number) {
  return useQuery<QuestionsResponse>({
    queryKey: ['onboarding-questions', projectId, phase],
    queryFn: async () => {
      const res = await fetch(
        `/api/onboarding/questions?projectId=${projectId}&phase=${phase}`
      );
      if (!res.ok) throw new Error('Failed to fetch questions');
      return res.json();
    },
    enabled: !!projectId && phase >= 1 && phase <= 10,
  });
}

export function useSubmitAnswers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AnswersPayload) => {
      const res = await fetch('/api/onboarding/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to submit answers');
      return res.json();
    },
    onSuccess: (_data: unknown, variables: AnswersPayload) => {
      queryClient.invalidateQueries({
        queryKey: ['onboarding-questions', variables.projectId],
      });
    },
  });
}

export function useExecutiveSummaryPrompt(projectId: number) {
  return useQuery({
    queryKey: ['executive-summary-prompt', projectId],
    queryFn: async () => {
      const res = await fetch(
        `/api/onboarding/executive-summary-prompt?projectId=${projectId}`
      );
      if (!res.ok) throw new Error('Failed to fetch executive summary prompt');
      return res.json();
    },
    enabled: !!projectId,
  });
}

export function useStoreExecutiveSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { projectId: number; executiveSummary: string; wordCount?: number }) => {
      const res = await fetch('/api/onboarding/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to store executive summary');
      return res.json();
    },
    onSuccess: (_data: unknown, variables: { projectId: number; executiveSummary: string; wordCount?: number }) => {
      queryClient.invalidateQueries({
        queryKey: ['onboarding-status', variables.projectId],
      });
    },
  });
}

// ============================================================================
// Session 2: Documentation Generation
// ============================================================================

export function useDocumentPrompts(projectId: number) {
  return useQuery<DocumentPromptsResponse>({
    queryKey: ['document-prompts', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/onboarding/document-prompts?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch document prompts');
      return res.json();
    },
    enabled: !!projectId,
  });
}

export function useDocuments(projectId: number, refetchInterval?: number) {
  return useQuery<DocumentsResponse>({
    queryKey: ['onboarding-documents', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/onboarding/documents?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
    enabled: !!projectId,
    refetchInterval,
  });
}

export function useStoreDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StoreDocumentPayload) => {
      const res = await fetch('/api/onboarding/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to store document');
      return res.json();
    },
    onSuccess: (_data: unknown, variables: StoreDocumentPayload) => {
      queryClient.invalidateQueries({
        queryKey: ['onboarding-documents', variables.projectId],
      });
    },
  });
}

// ============================================================================
// Session 3: AI Workflow Bootstrap
// ============================================================================

export function useBootstrap() {
  const queryClient = useQueryClient();

  return useMutation<BootstrapResult, Error, BootstrapPayload>({
    mutationFn: async (data: BootstrapPayload) => {
      const res = await fetch('/api/onboarding/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to bootstrap');
      }
      return res.json();
    },
    onSuccess: (_data: BootstrapResult, variables: BootstrapPayload) => {
      queryClient.invalidateQueries({
        queryKey: ['onboarding-status', variables.projectId],
      });
    },
  });
}
