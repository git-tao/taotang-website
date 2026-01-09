import React, { useState } from 'react';
import { FormData, ServiceType, ProjectSubtype } from '../types';

interface ProjectDetailsStepProps {
  formData: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SERVICE_OPTIONS: { value: ServiceType; label: string; description: string }[] = [
  {
    value: 'advisory_paid',
    label: 'Paid advisory / second opinion',
    description: 'Get expert guidance on a specific challenge',
  },
  {
    value: 'audit',
    label: 'Audit of existing AI system',
    description: 'Diagnose issues in your current AI/ML setup',
  },
  {
    value: 'project',
    label: 'Build or ship something',
    description: 'Take something from prototype to production',
  },
  {
    value: 'unclear',
    label: 'Not sure yet',
    description: 'I have a challenge but need help scoping it',
  },
];

const PROJECT_SUBTYPE_OPTIONS: { value: ProjectSubtype; label: string }[] = [
  { value: 'prototype_to_production', label: 'Prototype-to-Production' },
  { value: 'rag_reliability_sprint', label: 'RAG Reliability Sprint' },
  { value: 'other_build', label: 'Other build/ship project' },
];

const MIN_CONTEXT_LENGTH = 100;

const ProjectDetailsStep: React.FC<ProjectDetailsStepProps> = ({
  formData,
  onChange,
  onNext,
  onBack,
}) => {
  const [contextTouched, setContextTouched] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleServiceSelect = (value: ServiceType) => {
    // Reset conditional fields when service changes
    onChange({
      service_type: value,
      audit_symptoms: '',
      project_subtype: '',
      project_state: '',
      rag_issues: '',
      advisory_questions: '',
      desired_outcome: '',
    });
  };

  const handleProjectSubtypeSelect = (value: ProjectSubtype) => {
    // Reset subtype-specific fields
    onChange({
      project_subtype: value,
      project_state: '',
      rag_issues: '',
    });
  };

  // Context validation
  const contextLength = formData.context_raw.trim().length;
  const contextRemaining = MIN_CONTEXT_LENGTH - contextLength;
  const isContextValid = contextLength >= MIN_CONTEXT_LENGTH;

  // Check if conditional follow-up is required and filled
  const isConditionalComplete = (): boolean => {
    switch (formData.service_type) {
      case 'audit':
        // Optional follow-up for audit
        return true;
      case 'project':
        if (!formData.project_subtype) return true; // Optional
        if (formData.project_subtype === 'prototype_to_production') return true; // Optional follow-up
        if (formData.project_subtype === 'rag_reliability_sprint') return true; // Optional follow-up
        return true;
      case 'advisory_paid':
        // Optional follow-up
        return true;
      case 'unclear':
        // Optional follow-up
        return true;
      default:
        return true;
    }
  };

  const canProceed =
    formData.service_type !== '' &&
    isContextValid &&
    isConditionalComplete();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-[#212529]">Tell me about your project</h3>
        <p className="text-sm text-[#6C757D]">
          This helps me understand what you're trying to achieve.
        </p>
      </div>

      {/* Service Type Selection */}
      <div className="space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
          What do you need help with? *
        </label>
        <div className="grid gap-3">
          {SERVICE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleServiceSelect(option.value)}
              className={`
                text-left p-4 rounded-lg border transition-all
                ${formData.service_type === option.value
                  ? 'border-[#FFBF00] bg-amber-50 ring-1 ring-[#FFBF00]'
                  : 'border-[#E9ECEF] bg-white hover:border-[#FFBF00]'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center
                    ${formData.service_type === option.value
                      ? 'border-[#FFBF00] bg-[#FFBF00]'
                      : 'border-[#ADB5BD]'
                    }
                  `}
                >
                  {formData.service_type === option.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
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

      {/* Conditional Follow-up: Audit */}
      {formData.service_type === 'audit' && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
            Top 1-2 symptoms you're seeing? <span className="text-[#ADB5BD]">(optional)</span>
          </label>
          <textarea
            name="audit_symptoms"
            value={formData.audit_symptoms}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100 transition-all bg-white text-[#212529] text-sm"
            placeholder="e.g., high latency, unexpected costs, inaccurate results..."
          />
        </div>
      )}

      {/* Conditional Follow-up: Project (Build) */}
      {formData.service_type === 'project' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
              Which best describes your project? <span className="text-[#ADB5BD]">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_SUBTYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleProjectSubtypeSelect(option.value)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${formData.project_subtype === option.value
                      ? 'bg-[#212529] text-white'
                      : 'bg-[#F8F9FA] text-[#212529] border border-[#E9ECEF] hover:border-[#FFBF00]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-conditional: Prototype-to-Production */}
          {formData.project_subtype === 'prototype_to_production' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
                Current state of your prototype? <span className="text-[#ADB5BD]">(optional)</span>
              </label>
              <textarea
                name="project_state"
                value={formData.project_state}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100 transition-all bg-white text-[#212529] text-sm"
                placeholder="e.g., Jupyter notebook, containerized model, deployed in staging..."
              />
            </div>
          )}

          {/* Sub-conditional: RAG Reliability Sprint */}
          {formData.project_subtype === 'rag_reliability_sprint' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
                Main issues with your RAG pipeline? <span className="text-[#ADB5BD]">(optional)</span>
              </label>
              <textarea
                name="rag_issues"
                value={formData.rag_issues}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100 transition-all bg-white text-[#212529] text-sm"
                placeholder="e.g., hallucinations, poor document retrieval, slow generation..."
              />
            </div>
          )}
        </div>
      )}

      {/* Conditional Follow-up: Paid Advisory */}
      {formData.service_type === 'advisory_paid' && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
            What do you want answered in this session? <span className="text-[#ADB5BD]">(optional)</span>
          </label>
          <textarea
            name="advisory_questions"
            value={formData.advisory_questions}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100 transition-all bg-white text-[#212529] text-sm"
            placeholder="What specific questions do you want to explore?"
          />
        </div>
      )}

      {/* Conditional Follow-up: Not Sure */}
      {formData.service_type === 'unclear' && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
            What outcome are you hoping to achieve? <span className="text-[#ADB5BD]">(optional)</span>
          </label>
          <textarea
            name="desired_outcome"
            value={formData.desired_outcome}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100 transition-all bg-white text-[#212529] text-sm"
            placeholder="What does success look like for you?"
          />
        </div>
      )}

      {/* Project Context (always shown) */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
          Tell me about your project *
        </label>
        <p className="text-xs text-[#6C757D]">
          What are you trying to achieve, and what's blocking you?
        </p>
        <textarea
          name="context_raw"
          value={formData.context_raw}
          onChange={handleInputChange}
          onBlur={() => setContextTouched(true)}
          rows={4}
          required
          className={`
            w-full px-4 py-3 border rounded-lg focus:outline-none transition-all bg-white text-[#212529] text-sm
            ${contextTouched && !isContextValid
              ? 'border-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-100'
              : 'border-[#E9ECEF] focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100'
            }
          `}
          placeholder="Describe your current situation, challenges, and what success looks like. The more specific, the better I can help."
        />
        <div className="flex justify-between items-center">
          <p
            className={`text-xs ${contextRemaining > 0 ? 'text-amber-600' : 'text-green-600'}`}
          >
            {contextRemaining > 0
              ? `${contextRemaining} more characters needed for thoughtful responses`
              : 'Great level of detail!'
            }
          </p>
          <p className="text-xs text-[#ADB5BD]">
            {contextLength} / {MIN_CONTEXT_LENGTH} min
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-4 rounded-lg font-bold text-sm transition-all bg-white border border-[#E9ECEF] text-[#6C757D] hover:border-[#FFBF00] hover:text-[#212529]"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canProceed}
          className={`
            flex-[2] py-4 rounded-lg font-bold text-sm transition-all
            ${canProceed
              ? 'bg-[#FFBF00] text-[#212529] hover:bg-[#E6AC00] shadow-lg shadow-amber-200/40 transform hover:-translate-y-0.5'
              : 'bg-[#E9ECEF] text-[#ADB5BD] cursor-not-allowed'
            }
          `}
        >
          Continue to Final Step
        </button>
      </div>
    </form>
  );
};

export default ProjectDetailsStep;
