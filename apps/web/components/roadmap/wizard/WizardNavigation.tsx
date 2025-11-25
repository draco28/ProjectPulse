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
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-dark-pressed">
      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={isFirstStep || isSubmitting}
        className={`
          inline-flex items-center gap-2 px-6 py-3 rounded-xl
          font-medium transition-all duration-200
          ${
            isFirstStep || isSubmitting
              ? 'opacity-50 cursor-not-allowed text-slate'
              : 'neu-flat text-slate hover:text-white hover:neu-raised'
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
            inline-flex items-center gap-2 px-8 py-3 rounded-xl
            font-semibold transition-all duration-200
            ${
              isSubmitting || !canProceed
                ? 'opacity-50 cursor-not-allowed bg-coral/50 text-white'
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
            inline-flex items-center gap-2 px-6 py-3 rounded-xl
            font-semibold transition-all duration-200
            ${
              !canProceed
                ? 'opacity-50 cursor-not-allowed bg-coral/50 text-white'
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
