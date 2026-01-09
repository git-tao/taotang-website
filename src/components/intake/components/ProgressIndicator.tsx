import React from 'react';
import { WizardStep } from '../types';

interface ProgressIndicatorProps {
  currentStep: WizardStep;
  totalSteps: number;
}

const STEP_LABELS = ['Basic Info', 'Project Details', 'Qualification'];

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="mb-8">
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = (i + 1) as WizardStep;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <React.Fragment key={stepNum}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-300
                    ${isCompleted
                      ? 'bg-[#FFBF00] text-[#212529]'
                      : isActive
                        ? 'bg-[#212529] text-white ring-4 ring-amber-100'
                        : 'bg-[#E9ECEF] text-[#6C757D]'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium hidden sm:block
                    ${isActive ? 'text-[#212529]' : 'text-[#6C757D]'}
                  `}
                >
                  {STEP_LABELS[i]}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {stepNum < totalSteps && (
                <div
                  className={`
                    flex-1 h-0.5 mx-3 transition-all duration-300
                    ${stepNum < currentStep ? 'bg-[#FFBF00]' : 'bg-[#E9ECEF]'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile step label */}
      <div className="mt-4 text-center sm:hidden">
        <span className="text-sm font-medium text-[#212529]">
          Step {currentStep}: {STEP_LABELS[currentStep - 1]}
        </span>
      </div>

      {/* Estimated time */}
      <div className="mt-4 text-center">
        <span className="text-xs text-[#6C757D]">
          Estimated time: under 3 minutes
        </span>
      </div>
    </div>
  );
};

export default ProgressIndicator;
