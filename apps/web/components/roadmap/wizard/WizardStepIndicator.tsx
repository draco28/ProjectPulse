'use client';

/**
 * WizardStepIndicator Component
 *
 * Progress dots showing current wizard step with labels
 */

import { Check } from 'lucide-react';

interface WizardStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function WizardStepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
}: WizardStepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Progress Line + Dots */}
      <div className="relative mb-4 flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-dark-pressed" />

        {/* Progress Line */}
        <div
          className="coral-gradient absolute left-0 top-1/2 h-0.5 -translate-y-1/2 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {/* Dots */}
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={stepNum} className="relative z-10 flex flex-col items-center">
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full
                  transition-all duration-300
                  ${isComplete ? 'coral-gradient text-white' : ''}
                  ${isCurrent ? 'coral-gradient text-white ring-4 ring-coral/30' : ''}
                  ${!isComplete && !isCurrent ? 'neu-pressed text-slate' : ''}
                `}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="font-bold">{stepNum}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isCurrent = stepNum === currentStep;

          return (
            <div
              key={label}
              className={`
                w-20 text-center text-xs font-medium
                ${isCurrent ? 'text-coral' : 'text-slate'}
              `}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
