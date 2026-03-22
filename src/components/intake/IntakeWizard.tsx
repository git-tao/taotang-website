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
import OutcomeScreen from './components/OutcomeScreen';

type WizardState = 'form' | 'success';

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
    setStep((prev) => Math.min(prev + 1, 2) as WizardStep);
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1) as WizardStep);
  };

  const handleSubmit = () => {
    // All paths lead to the booking screen — no gate needed
    setResult({
      inquiry_id: '',
      gate_status: 'pass',
      routing_result: 'calendly_strategy_free',
      message: '',
    });
    setWizardState('success');
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
        <OutcomeScreen
          result={result}
          onReset={handleReset}
        />
      </section>
    );
  }

  // Form state
  return (
    <section id="initiate" className="section-padding px-6 bg-[#F8F9FA] border-y border-[#E9ECEF]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#212529] mb-12">Free Discovery Call</h2>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left Column - Value Proposition */}
          <div className="hidden lg:block">
            <h3 className="text-3xl font-bold text-[#212529] mb-6 leading-tight">
              Let's Talk.
            </h3>
            <p className="text-[#212529] leading-relaxed mb-8 text-lg font-light">
              Tell me a little about your challenge and book a free 30-minute
              discovery call. No pitch, no pressure — just a focused conversation
              about what you're trying to solve.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#212529]">Under 1 minute to book</p>
                  <p className="text-sm text-[#6C757D]">Two quick steps, then pick a time</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#212529]">30 minutes, no obligation</p>
                  <p className="text-sm text-[#6C757D]">Free strategy conversation about your project</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#212529]">Walk away with clarity</p>
                  <p className="text-sm text-[#6C757D]">Concrete next steps, whether we work together or not</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-[#E9ECEF] min-h-[400px]">
            <ProgressIndicator currentStep={step} totalSteps={2} />

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

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
                onNext={handleSubmit}
                onBack={handlePrevStep}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntakeWizard;
