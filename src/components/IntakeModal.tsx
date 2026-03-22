import React, { useState, useEffect } from 'react';
import { useModal } from '../context/ModalContext';
import {
  FormData,
  IntakeResponse,
  WizardStep,
  initialFormData,
} from './intake/types';
import ProgressIndicator from './intake/components/ProgressIndicator';
import BasicInfoStep from './intake/components/BasicInfoStep';
import ProjectDetailsStep from './intake/components/ProjectDetailsStep';
import QualificationStep from './intake/components/QualificationStep';
import OutcomeScreen from './intake/components/OutcomeScreen';
import { evaluateGate } from './intake/utils/gateLogic';

type WizardState = 'form' | 'success';

const IntakeModal: React.FC = () => {
  const { isOpen, closeModal } = useModal();
  const [step, setStep] = useState<WizardStep>(1);
  const [wizardState, setWizardState] = useState<WizardState>('form');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal animation state - separate from isOpen to allow exit animation
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle modal open/close animation
  useEffect(() => {
    if (isOpen) {
      // Opening: render first, then animate in
      setShouldRender(true);
      setIsClosing(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else if (shouldRender) {
      // Closing: animate out, then stop rendering
      setIsClosing(true);
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        // Reset form after modal is fully closed
        handleReset();
      }, 300);
      return () => clearTimeout(timer);
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

  const handleSubmit = () => {
    const gateResult = evaluateGate(formData);
    setResult({
      inquiry_id: '',
      gate_status: gateResult.gate_status,
      routing_result: gateResult.routing_result,
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

  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300 ease-out
        ${isVisible ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-0'}
      `}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`
          relative w-full max-w-xl max-h-[90vh] overflow-y-auto
          bg-white rounded-2xl shadow-2xl
          transition-all duration-300 ease-out
          ${isVisible && !isClosing
            ? 'opacity-100 scale-100 translate-y-0'
            : isClosing
              ? 'opacity-0 scale-95 translate-y-8'
              : 'opacity-0 scale-95 -translate-y-4'
          }
        `}
      >
        {/* Close Button */}
        <button
          onClick={closeModal}
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

              <ProgressIndicator currentStep={step} totalSteps={3} />

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
                  isSubmitting={false}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntakeModal;
