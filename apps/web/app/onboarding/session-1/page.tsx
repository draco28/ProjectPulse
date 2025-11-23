/**
 * Session 1: Strategic Planning - Questions Wizard
 *
 * Multi-phase wizard for collecting project information
 * 10 phases, 96 questions total
 */

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhaseNavigator } from '@/components/onboarding/PhaseNavigator';
import { QuestionCard } from '@/components/onboarding/QuestionCard';
import { submitAnswers } from '@/app/onboarding/actions';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

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

interface QuestionsData {
  phase: number;
  phaseName: string;
  subsections: Subsection[];
  totalQuestions: number;
}

export default function Session1Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('project');
  const projectId = projectIdParam ? parseInt(projectIdParam, 10) : 1;
  const [currentPhase, setCurrentPhase] = useState(1);
  const [questionsData, setQuestionsData] = useState<QuestionsData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Hydrate state from DB (Sprint 9 Fix)
  useEffect(() => {
    async function hydrateState() {
      try {
        const res = await fetch(`/api/onboarding/phase-state?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.currentPhase) {
            setCurrentPhase(data.currentPhase);
            setCompletedPhases(data.completedPhases || []);
            
            // Pre-fill answers if we have them for the current phase
            if (data.answers) {
              const currentPhaseAnswers = data.answers[`phase${data.currentPhase}`] || {};
              setAnswers(currentPhaseAnswers);
            }
          }
        }
      } catch (error) {
        console.error('Error hydrating session state:', error);
      }
    }
    hydrateState();
  }, [projectId]);

  // Fetch questions for current phase
  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/onboarding/questions?projectId=${projectId}&phase=${currentPhase}`
        );
        if (!res.ok) throw new Error('Failed to fetch questions');
        const data = await res.json();
        setQuestionsData(data);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, [currentPhase, projectId]);

  // Validate current phase answers
  const validateAnswers = (): boolean => {
    if (!questionsData) return false;

    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    questionsData.subsections.forEach((subsection) => {
      subsection.questions.forEach((question) => {
        if (question.isRequired && !answers[question.id]?.trim()) {
          newErrors[question.id] = 'This field is required';
          hasErrors = true;
        }
      });
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateAnswers()) {
      return;
    }

    startTransition(async () => {
      const result = await submitAnswers(projectId, currentPhase, answers);

      if (result.success) {
        // Mark phase as complete
        if (!completedPhases.includes(currentPhase)) {
          setCompletedPhases([...completedPhases, currentPhase]);
        }

        // Move to next phase or redirect to summary
        if (currentPhase < 10) {
          setCurrentPhase(currentPhase + 1);
          setAnswers({});
          setErrors({});
        } else {
          // All phases complete - redirect to executive summary
          router.push('/onboarding/session-1/summary');
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    });
  };

  // Handle navigation
  const handleBack = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
      setAnswers({});
      setErrors({});
    }
  };

  const handlePhaseSelect = (phase: number) => {
    if (phase <= currentPhase || completedPhases.includes(phase)) {
      setCurrentPhase(phase);
      setAnswers({});
      setErrors({});
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-coral-500" />
      </div>
    );
  }

  if (!questionsData) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="neu-raised">
          <CardContent className="p-6">
            <p className="text-red-400">Failed to load questions. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Page Header with Back Button */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Strategic Planning</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/onboarding?project=${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Onboarding
          </Link>
        </Button>
      </div>

      {/* Progress Navigator */}
      <PhaseNavigator
        currentPhase={currentPhase}
        totalPhases={10}
        completedPhases={completedPhases}
        onPhaseSelect={handlePhaseSelect}
      />

      {/* Phase Header */}
      <Card className="neu-raised mb-6">
        <CardHeader>
          <CardTitle>{questionsData.phaseName}</CardTitle>
          <CardDescription>
            {questionsData.totalQuestions} questions in {questionsData.subsections.length}{' '}
            subsections
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Questions Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {questionsData.subsections.map((subsection) => (
          <Card key={subsection.id} className="neu-raised mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{subsection.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {subsection.questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  value={answers[question.id] || ''}
                  onChange={(value) => {
                    setAnswers({ ...answers, [question.id]: value });
                    if (errors[question.id]) {
                      setErrors({ ...errors, [question.id]: '' });
                    }
                  }}
                  error={errors[question.id]}
                />
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            disabled={currentPhase === 1 || isPending}
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Phase
          </Button>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : currentPhase === 10 ? (
              'Complete & Generate Summary'
            ) : (
              <>
                Next Phase
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
