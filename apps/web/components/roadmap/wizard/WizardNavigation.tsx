'use client';

/**
 * WizardNavigation Component
 *
 * Navigation buttons for wizard: Back, Next, Create
 */

import { ArrowLeft, ArrowRight, Loader2, Rocket } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canProceed: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  canProceed,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="mt-8 flex items-center justify-between border-t border-dark-pressed pt-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={isFirstStep || isSubmitting}
        className={`
          inline-flex items-center gap-2 rounded-xl px-6 py-3
          font-medium transition-all duration-200
          ${
            isFirstStep || isSubmitting
              ? 'cursor-not-allowed text-slate opacity-50'
              : 'neu-flat hover:neu-raised text-slate hover:text-white'
          }
        `}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Next / Submit Button */}
      {isLastStep ? (
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !canProceed}
          className={`
            inline-flex items-center gap-2 rounded-xl px-8 py-3
            font-semibold transition-all duration-200
            ${
              isSubmitting || !canProceed
                ? 'cursor-not-allowed bg-coral/50 text-white opacity-50'
                : 'coral-gradient text-white hover:shadow-lg hover:shadow-coral/20'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Create Roadmap
            </>
          )}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`
            inline-flex items-center gap-2 rounded-xl px-6 py-3
            font-semibold transition-all duration-200
            ${
              !canProceed
                ? 'cursor-not-allowed bg-coral/50 text-white opacity-50'
                : 'coral-gradient text-white hover:shadow-lg hover:shadow-coral/20'
            }
          `}
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
