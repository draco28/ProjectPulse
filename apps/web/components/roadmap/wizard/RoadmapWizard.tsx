'use client';

/**
 * RoadmapWizard Component - Standalone Roadmap UI Phase B
 *
 * 4-step wizard with useReducer state machine:
 * 1. Project Info → 2. Phases → 3. Sprints → 4. Preview
 *
 * Features:
 * - Local state with useReducer
 * - Auto-save to localStorage every 30s
 * - Draft recovery on mount
 * - Validation before step navigation
 *
 * @see .agent/task/roadmap-ui/ROADMAP-UI-COMPONENTS.md
 */

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { WizardStepIndicator } from './WizardStepIndicator';
import { WizardNavigation } from './WizardNavigation';
import { Step1ProjectInfo } from './Step1ProjectInfo';
import { Step2Phases } from './Step2Phases';
import { Step3Sprints } from './Step3Sprints';
import { Step4Preview } from './Step4Preview';

// ============================================================================
// TYPES
// ============================================================================

export interface Sprint {
  id: string;
  name: string;
  duration: string;
  weeks: string;
  goals: string[];
  deliverables: string[];
}

export interface Phase {
  id: string;
  title: string;
  description: string;
  duration: string;
  sprints: Sprint[];
}

export interface WizardData {
  title: string;
  description: string;
  startDate: string;
  phases: Phase[];
}

interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  data: WizardData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

type WizardAction =
  | { type: 'SET_STEP'; step: 1 | 2 | 3 | 4 }
  | { type: 'UPDATE_DATA'; data: Partial<WizardData> }
  | { type: 'UPDATE_PHASES'; phases: Phase[] }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_CLEAN' }
  | { type: 'LOAD_DRAFT'; state: WizardState };

// ============================================================================
// REDUCER
// ============================================================================

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'UPDATE_DATA':
      return {
        ...state,
        data: { ...state.data, ...action.data },
        isDirty: true,
      };
    case 'UPDATE_PHASES':
      return {
        ...state,
        data: { ...state.data, phases: action.phases },
        isDirty: true,
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'MARK_DIRTY':
      return { ...state, isDirty: true };
    case 'MARK_CLEAN':
      return { ...state, isDirty: false };
    case 'LOAD_DRAFT':
      return action.state;
    default:
      return state;
  }
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: WizardState = {
  currentStep: 1,
  data: {
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0] || '',
    phases: [],
  },
  errors: {},
  isSubmitting: false,
  isDirty: false,
};

// ============================================================================
// VALIDATION
// ============================================================================

function validateStep1(data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.title.trim()) errors.title = 'Title is required';
  if (data.title.length > 200) errors.title = 'Title must be 200 characters or less';
  if (!data.startDate) errors.startDate = 'Start date is required';
  return errors;
}

function validateStep2(data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (data.phases.length === 0) errors.phases = 'Add at least one phase';
  data.phases.forEach((phase, index) => {
    if (!phase.title.trim())
      errors[`phase_${index}_title`] = `Phase ${index + 1} title is required`;
  });
  return errors;
}

function validateStep3(data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {};
  data.phases.forEach((phase, pIndex) => {
    if (phase.sprints.length === 0) {
      errors[`phase_${pIndex}_sprints`] = `Phase "${phase.title}" needs at least one sprint`;
    }
    phase.sprints.forEach((sprint, sIndex) => {
      if (!sprint.name.trim()) {
        errors[`phase_${pIndex}_sprint_${sIndex}_name`] = 'Sprint name is required';
      }
    });
  });
  return errors;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface RoadmapWizardProps {
  projectId: number;
  projectName: string;
}

const STORAGE_KEY = 'roadmap_wizard_draft';
const STEP_LABELS = ['Project Info', 'Phases', 'Sprints', 'Preview'];

export function RoadmapWizard({ projectId, projectName }: RoadmapWizardProps) {
  const _router = useRouter(); // Reserved for navigation after wizard completion
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WizardState;
        // Only load if draft is for same project (would need to store projectId)
        dispatch({ type: 'LOAD_DRAFT', state: { ...parsed, isSubmitting: false } });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Auto-save to localStorage every 30s when dirty
  useEffect(() => {
    if (state.isDirty) {
      autoSaveRef.current = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          dispatch({ type: 'MARK_CLEAN' });
        } catch {
          // Ignore storage errors
        }
      }, 30000);
    }

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [state]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    let errors: Record<string, string> = {};

    switch (state.currentStep) {
      case 1:
        errors = validateStep1(state.data);
        break;
      case 2:
        errors = validateStep2(state.data);
        break;
      case 3:
        errors = validateStep3(state.data);
        break;
    }

    dispatch({ type: 'SET_ERRORS', errors });
    return Object.keys(errors).length === 0;
  }, [state.currentStep, state.data]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (validateCurrentStep() && state.currentStep < 4) {
      dispatch({ type: 'SET_STEP', step: (state.currentStep + 1) as 1 | 2 | 3 | 4 });
    }
  }, [state.currentStep, validateCurrentStep]);

  const handleBack = useCallback(() => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', step: (state.currentStep - 1) as 1 | 2 | 3 | 4 });
    }
  }, [state.currentStep]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) return;

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });

    try {
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: state.data.title,
          description: state.data.description,
          startDate: new Date(state.data.startDate).toISOString(),
          phases: state.data.phases.map((p) => ({
            title: p.title,
            description: p.description,
            duration: p.duration,
            sprints: p.sprints.map((s) => ({
              name: s.name,
              duration: s.duration,
              weeks: s.weeks,
              goals: s.goals,
              deliverables: s.deliverables,
            })),
          })),
          materialize: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Build detailed error message
        const errorMessage = result.error?.message || 'Failed to create roadmap';
        const errorDetails = result.error?.details;
        const fullMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;

        // Show toast for immediate visibility
        toast.error(fullMessage, {
          duration: 5000,
          description:
            result.error?.code === 'MATERIALIZATION_FAILED'
              ? 'The roadmap structure could not be created. Please check your phases and sprints.'
              : undefined,
        });

        dispatch({
          type: 'SET_ERRORS',
          errors: { submit: fullMessage },
        });
        return;
      }

      // Success - show success toast, clear draft and redirect
      // Use window.location for FULL page reload to ensure fresh server-side data fetch
      // (router.push uses client-side cache which may not have the new roadmap)
      toast.success('Roadmap created successfully!');
      clearDraft();
      window.location.href = `/roadmap?project=${projectId}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      toast.error(errorMessage, { duration: 5000 });
      dispatch({
        type: 'SET_ERRORS',
        errors: { submit: errorMessage },
      });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  }, [projectId, state.data, validateCurrentStep, clearDraft]);

  // Data update handlers
  const handleDataChange = useCallback((data: Partial<WizardData>) => {
    dispatch({ type: 'UPDATE_DATA', data });
  }, []);

  const handlePhasesChange = useCallback((phases: Phase[]) => {
    dispatch({ type: 'UPDATE_PHASES', phases });
  }, []);

  // Check if can proceed
  const canProceed = state.currentStep < 4 || !state.isSubmitting;

  return (
    <div className="neu-raised rounded-3xl p-8">
      {/* Step Indicator */}
      <WizardStepIndicator
        currentStep={state.currentStep}
        totalSteps={4}
        stepLabels={STEP_LABELS}
      />

      {/* Project Context */}
      <div className="mb-6 text-center">
        <span className="text-sm text-slate">
          Creating roadmap for: <span className="font-medium text-coral">{projectName}</span>
        </span>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {state.currentStep === 1 && (
          <Step1ProjectInfo data={state.data} errors={state.errors} onChange={handleDataChange} />
        )}

        {state.currentStep === 2 && (
          <Step2Phases
            phases={state.data.phases}
            errors={state.errors}
            onChange={handlePhasesChange}
          />
        )}

        {state.currentStep === 3 && (
          <Step3Sprints
            phases={state.data.phases}
            errors={state.errors}
            onChange={handlePhasesChange}
          />
        )}

        {state.currentStep === 4 && <Step4Preview data={state.data} errors={state.errors} />}
      </div>

      {/* Navigation */}
      <WizardNavigation
        currentStep={state.currentStep}
        totalSteps={4}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isSubmitting={state.isSubmitting}
        canProceed={canProceed}
      />
    </div>
  );
}
