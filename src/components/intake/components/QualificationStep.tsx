import React from 'react';
import { FormData, Timeline, BudgetRange, AccessModel } from '../types';

interface QualificationStepProps {
  formData: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const TIMELINE_OPTIONS: { value: Timeline; label: string; sublabel: string }[] = [
  { value: 'urgent', label: 'Urgent', sublabel: 'Within the next 2 weeks' },
  { value: 'soon', label: 'Soon', sublabel: 'Within the next month' },
  { value: 'planning', label: 'Planning', sublabel: '1-3 months' },
  { value: 'exploring', label: 'Exploring', sublabel: '3+ months' },
];

const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: 'under_10k', label: '< $10,000' },
  { value: '10k_25k', label: '$10,000 - $25,000' },
  { value: '25k_50k', label: '$25,000 - $50,000' },
  { value: 'over_50k', label: '$50,000+' },
  { value: 'unsure', label: 'Not sure' },
];

const ACCESS_OPTIONS: { value: AccessModel; label: string; description: string }[] = [
  {
    value: 'remote_access',
    label: 'Remote Access',
    description: 'External collaborators can use their own tools with access to our repos/cloud',
  },
  {
    value: 'own_environment_own_tools',
    label: 'Your Environment',
    description: 'Work in our environment with your own tools',
  },
  {
    value: 'managed_devices',
    label: 'Managed Devices',
    description: 'We require managed devices for external collaborators',
  },
  {
    value: 'onpremise_only',
    label: 'On-Premise Only',
    description: 'On-premise only, no external tools allowed',
  },
  {
    value: 'unsure',
    label: 'Not sure',
    description: 'Need to check with IT',
  },
];

const QualificationStep: React.FC<QualificationStepProps> = ({
  formData,
  onChange,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const handleTimelineSelect = (value: Timeline) => {
    onChange({ timeline: value });
  };

  const handleBudgetSelect = (value: BudgetRange) => {
    onChange({ budget_range: value });
  };

  const handleAccessSelect = (value: AccessModel) => {
    onChange({ access_model: value });
  };

  const canSubmit =
    formData.timeline !== '' &&
    formData.budget_range !== '' &&
    formData.access_model !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit && !isSubmitting) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-[#212529]">A few final questions</h3>
        <p className="text-sm text-[#6C757D]">
          This helps me determine the best way to work together.
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
          How soon do you need to see progress? *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIMELINE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTimelineSelect(option.value)}
              className={`
                text-left p-3 rounded-lg border transition-all
                ${formData.timeline === option.value
                  ? 'border-[#FFBF00] bg-amber-50 ring-1 ring-[#FFBF00]'
                  : 'border-[#E9ECEF] bg-white hover:border-[#FFBF00]'
                }
              `}
            >
              <p className="font-medium text-[#212529] text-sm">{option.label}</p>
              <p className="text-xs text-[#6C757D] mt-0.5">{option.sublabel}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
          Estimated budget for this project? *
        </label>
        <p className="text-xs text-[#6C757D] -mt-1">
          A range is fine—I use this only to ensure fit.
        </p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleBudgetSelect(option.value)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${formData.budget_range === option.value
                  ? 'bg-[#212529] text-white'
                  : 'bg-white border border-[#E9ECEF] text-[#212529] hover:border-[#FFBF00]'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Access Model */}
      <div className="space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
          How would we work together? *
        </label>
        <p className="text-xs text-[#6C757D] -mt-1">
          To be effective, I require direct access to your code and systems.
        </p>
        <div className="space-y-2">
          {ACCESS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleAccessSelect(option.value)}
              className={`
                w-full text-left p-3 rounded-lg border transition-all
                ${formData.access_model === option.value
                  ? 'border-[#FFBF00] bg-amber-50 ring-1 ring-[#FFBF00]'
                  : 'border-[#E9ECEF] bg-white hover:border-[#FFBF00]'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                    w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center
                    ${formData.access_model === option.value
                      ? 'border-[#FFBF00] bg-[#FFBF00]'
                      : 'border-[#ADB5BD]'
                    }
                  `}
                >
                  {formData.access_model === option.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[#212529] text-sm">{option.label}</p>
                  <p className="text-xs text-[#6C757D] mt-0.5">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-4 rounded-lg font-bold text-sm transition-all bg-white border border-[#E9ECEF] text-[#6C757D] hover:border-[#FFBF00] hover:text-[#212529] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className={`
            flex-[2] py-4 rounded-lg font-bold text-sm transition-all
            ${canSubmit && !isSubmitting
              ? 'bg-[#FFBF00] text-[#212529] hover:bg-[#E6AC00] shadow-lg shadow-amber-200/40 transform hover:-translate-y-0.5'
              : 'bg-[#E9ECEF] text-[#ADB5BD] cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>

      <p className="text-[10px] text-center text-[#6C757D]">
        This starts a professional consulting process.
      </p>
    </form>
  );
};

export default QualificationStep;
