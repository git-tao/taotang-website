import React, { useState } from 'react';
import {
  FormData,
  IntakeResponse,
  WizardStep,
  initialFormData,
} from './types';
import ProgressIndicator from './components/ProgressIndicator';
import BasicInfoStep from './components/BasicInfoStep';
import ProjectDetailsStep from './components/ProjectDetailsStep';
import QualificationStep from './components/QualificationStep';
import OutcomeScreen from './components/OutcomeScreen';

// API endpoint
const API_URL = import.meta.env.VITE_API_URL || 'https://taotang-api.onrender.com';

type WizardState = 'form' | 'submitting' | 'success';

const IntakeWizard: React.FC = () => {
  const [step, setStep] = useState<WizardStep>(1);
  const [wizardState, setWizardState] = useState<WizardState>('form');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormChange = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNextStep = () => {
    setStep((prev) => Math.min(prev + 1, 3) as WizardStep);
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1) as WizardStep);
  };

  const handleSubmit = async () => {
    setWizardState('submitting');
    setError(null);

    try {
      // Build request payload matching backend schema
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role_title: formData.role_title,
        service_type: formData.service_type,
        access_model: formData.access_model,
        timeline: formData.timeline,
        budget_range: formData.budget_range,
        context_raw: formData.context_raw.trim(),
        // Tracking
        entry_point: 'homepage_wizard',
        referrer: document.referrer || null,
        // Extended data in answers_raw (backend will store this)
        answers_raw: {
          company_name: formData.company_name || null,
          is_decision_maker: formData.is_decision_maker,
          // Conditional follow-ups
          audit_symptoms: formData.audit_symptoms || null,
          project_subtype: formData.project_subtype || null,
          project_state: formData.project_state || null,
          rag_issues: formData.rag_issues || null,
          advisory_questions: formData.advisory_questions || null,
          desired_outcome: formData.desired_outcome || null,
        },
      };

      const response = await fetch(`${API_URL}/api/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      const data: IntakeResponse = await response.json();
      setResult(data);
      setWizardState('success');
    } catch (err) {
      console.error('Submission error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again or contact directly.'
      );
      setWizardState('form');
    }
  };

  const handleReset = () => {
    setStep(1);
    setWizardState('form');
    setFormData(initialFormData);
    setResult(null);
    setError(null);
  };

  // Success state - show outcome screen
  if (wizardState === 'success' && result) {
    return (
      <section id="initiate" className="section-padding px-6 bg-[#F8F9FA]">
        <OutcomeScreen result={result} onReset={handleReset} />
      </section>
    );
  }

  // Form state
  return (
    <section id="initiate" className="section-padding px-6 bg-[#F8F9FA] border-y border-[#E9ECEF]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#212529] mb-12">Initiate a Project</h2>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left Column - Value Proposition */}
          <div className="hidden lg:block">
            <h3 className="text-3xl font-bold text-[#212529] mb-6 leading-tight">
              Let's Build.
            </h3>
            <p className="text-[#212529] leading-relaxed mb-8 text-lg font-light">
              If you have a high-stakes challenge that aligns with my services, the first
              step is a brief technical intake. This is the start of a professional
              engagement designed for speed and clarity.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-[#FFBF00]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#212529]">Under 3 minutes</p>
                  <p className="text-sm text-[#6C757D]">
                    Quick, focused questions to understand your needs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-[#FFBF00]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#212529]">Confidential & technical-first</p>
                  <p className="text-sm text-[#6C757D]">
                    Your information is secure and used only for evaluation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-[#FFBF00]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#212529]">Qualified leads get a free call</p>
                  <p className="text-sm text-[#6C757D]">
                    30-minute strategy session at no cost
                  </p>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 pt-8 border-t border-[#E9ECEF]">
              <p className="text-xs text-[#6C757D] uppercase tracking-wider mb-4">
                Typical response
              </p>
              <p className="text-2xl font-bold text-[#212529]">Under 24 hours</p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-[#E9ECEF]">
            <ProgressIndicator currentStep={step} totalSteps={3} />

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Submission Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step Content */}
            {step === 1 && (
              <BasicInfoStep
                formData={formData}
                onChange={handleFormChange}
                onNext={handleNextStep}
              />
            )}

            {step === 2 && (
              <ProjectDetailsStep
                formData={formData}
                onChange={handleFormChange}
                onNext={handleNextStep}
                onBack={handlePrevStep}
              />
            )}

            {step === 3 && (
              <QualificationStep
                formData={formData}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
                onBack={handlePrevStep}
                isSubmitting={wizardState === 'submitting'}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntakeWizard;
