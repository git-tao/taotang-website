import React, { useState, useEffect } from 'react';
import { useModal } from '../context/ModalContext';
import {
  FormData,
  IntakeResponse,
  WizardStep,
  GateStatus,
  RoutingResult,
  AIQuestion,
  initialFormData,
} from './intake/types';
import ProgressIndicator from './intake/components/ProgressIndicator';
import BasicInfoStep from './intake/components/BasicInfoStep';
import ProjectDetailsStep from './intake/components/ProjectDetailsStep';
import QualificationStep from './intake/components/QualificationStep';
import OutcomeScreen from './intake/components/OutcomeScreen';
import ClarificationFlow from './intake/components/ClarificationFlow';

// API endpoint
const API_URL = import.meta.env.VITE_API_URL || 'https://taotang-api.onrender.com';

type WizardState = 'form' | 'submitting' | 'clarifying' | 'success';
type AnimationState = 'visible' | 'exiting' | 'entering';

const AI_MAX_QUESTIONS = 3;

const IntakeModal: React.FC = () => {
  const { isOpen, closeModal } = useModal();
  const [step, setStep] = useState<WizardStep>(1);
  const [wizardState, setWizardState] = useState<WizardState>('form');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI Clarification state
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [firstQuestion, setFirstQuestion] = useState<AIQuestion | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>('visible');

  // Modal animation state
  const [isVisible, setIsVisible] = useState(false);

  // Handle modal open/close animation
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role_title: formData.role_title,
        service_type: formData.service_type,
        access_model: formData.access_model,
        timeline: formData.timeline,
        budget_range: formData.budget_range,
        context_raw: formData.context_raw.trim(),
        entry_point: 'modal_wizard',
        referrer: document.referrer || null,
        answers_raw: {
          company_name: formData.company_name || null,
          is_decision_maker: formData.is_decision_maker,
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

      if (data.needs_clarification && data.ai_session_id && data.first_question) {
        setAnimationState('exiting');
        setTimeout(() => {
          setAiSessionId(data.ai_session_id!);
          setFirstQuestion(data.first_question as AIQuestion);
          setResult(data);
          setWizardState('clarifying');
          setAnimationState('entering');
          setTimeout(() => {
            setAnimationState('visible');
          }, 300);
        }, 250);
      } else {
        setResult(data);
        setWizardState('success');
      }
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
    setAiSessionId(null);
    setFirstQuestion(null);
    setAnimationState('visible');
  };

  const handleClarificationComplete = (finalResult: {
    gate_status: GateStatus;
    routing_result: RoutingResult;
    message: string;
  }) => {
    setResult((prev) => ({
      ...prev!,
      gate_status: finalResult.gate_status,
      routing_result: finalResult.routing_result,
      message: finalResult.message,
      needs_clarification: false,
    }));
    setWizardState('success');
  };

  const handleClarificationError = (errorMessage: string) => {
    setError(errorMessage);
    setWizardState('form');
    setAiSessionId(null);
    setFirstQuestion(null);
    setAnimationState('visible');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleClose = () => {
    closeModal();
    // Reset form after modal closes
    setTimeout(() => {
      handleReset();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300 ease-out
        ${isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-0'}
      `}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`
          relative w-full max-w-xl max-h-[90vh] overflow-y-auto
          bg-white rounded-2xl shadow-2xl
          transition-all duration-300 ease-out
          ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Success State */}
          {wizardState === 'success' && result ? (
            <OutcomeScreen
              result={result}
              onReset={handleReset}
              userData={{ name: formData.name, email: formData.email }}
            />
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <h2 id="modal-title" className="text-2xl font-bold text-[#212529]">
                  Start a Project
                </h2>
                <p className="text-sm text-[#6C757D] mt-1">
                  Quick intake to understand your needs
                </p>
              </div>

              {/* Form Content */}
              {wizardState !== 'clarifying' && (
                <div
                  className={`
                    transition-all duration-250 ease-out
                    ${animationState === 'exiting' ? 'opacity-0 scale-[0.98] pointer-events-none' : ''}
                    ${animationState === 'visible' ? 'opacity-100 scale-100' : ''}
                  `}
                >
                  <ProgressIndicator currentStep={step} totalSteps={3} />

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-red-800">Submission Error</p>
                          <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                      </div>
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
              )}

              {/* AI Clarification Flow */}
              {wizardState === 'clarifying' && aiSessionId && firstQuestion && (
                <div
                  className={`
                    transition-all duration-300 ease-out
                    ${animationState === 'entering' ? 'opacity-0 scale-[0.98]' : ''}
                    ${animationState === 'visible' ? 'opacity-100 scale-100' : ''}
                  `}
                >
                  <ClarificationFlow
                    sessionId={aiSessionId}
                    initialQuestion={firstQuestion}
                    maxQuestions={AI_MAX_QUESTIONS}
                    onComplete={handleClarificationComplete}
                    onError={handleClarificationError}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntakeModal;
