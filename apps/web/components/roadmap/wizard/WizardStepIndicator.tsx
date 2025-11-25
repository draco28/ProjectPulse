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
      <div className="relative flex items-center justify-between mb-4">
        {/* Background Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-dark-pressed" />

        {/* Progress Line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 coral-gradient transition-all duration-300"
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
                  w-10 h-10 rounded-full flex items-center justify-center
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
                text-xs font-medium text-center w-20
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
