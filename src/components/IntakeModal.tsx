import React, { useState, useEffect } from 'react';
import { useModal } from '../context/ModalContext';
import {
  FormData,
  WizardStep,
  initialFormData,
} from './intake/types';
import ProgressIndicator from './intake/components/ProgressIndicator';
import BasicInfoStep from './intake/components/BasicInfoStep';
import ProjectDetailsStep from './intake/components/ProjectDetailsStep';

// Google Calendar Appointment Scheduling URL
const BOOKING_URL = 'https://calendar.app.google/yochBqeYtLimcXc76';

const IntakeModal: React.FC = () => {
  const { isOpen, closeModal } = useModal();
  const [step, setStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  // Modal animation state
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else if (shouldRender) {
      setIsClosing(true);
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
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

  const handleBookingClick = () => {
    setBooked(true);
    window.open(BOOKING_URL, '_blank', 'noopener,noreferrer');
  };

  const handleReset = () => {
    setStep(1);
    setFormData(initialFormData);
    setError(null);
    setBooked(false);
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
          {/* Header */}
          <div className="mb-6">
            <h2 id="modal-title" className="text-2xl font-bold text-[#212529]">
              Free Discovery Call
            </h2>
            <p className="text-sm text-[#6C757D] mt-1">
              30 minutes. No obligation. Let's see if there's a fit.
            </p>
          </div>

          <ProgressIndicator currentStep={step} totalSteps={3} />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: About You */}
          {step === 1 && (
            <BasicInfoStep
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
            />
          )}

          {/* Step 2: Your Challenge */}
          {step === 2 && (
            <ProjectDetailsStep
              formData={formData}
              onChange={handleFormChange}
              onNext={handleNextStep}
              onBack={handlePrevStep}
            />
          )}

          {/* Step 3: Discovery Call — Booking */}
          {step === 3 && (
            <div className="space-y-6">
              {!booked ? (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#212529] mb-2">
                      You're all set — let's talk
                    </h3>
                    <p className="text-[#6C757D] text-sm max-w-sm mx-auto">
                      Pick a time for a free 30-minute discovery call.
                      No pitch, just a focused conversation about your challenge.
                    </p>
                  </div>

                  <button
                    onClick={handleBookingClick}
                    className="w-full py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-all shadow-lg shadow-amber-200/40 transform hover:-translate-y-0.5 text-lg"
                  >
                    Book a Free Discovery Call
                  </button>

                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-full py-3 rounded-lg font-medium text-sm bg-white border border-[#E9ECEF] text-[#6C757D] hover:border-[#FFBF00] hover:text-[#212529] transition-all"
                  >
                    Back
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#212529] mb-2">
                    You're All Set
                  </h3>
                  <p className="text-[#6C757D] text-sm mb-6 max-w-sm mx-auto">
                    Complete your booking in the Google Calendar tab.
                    You'll receive a confirmation email once scheduled.
                  </p>
                  <button
                    onClick={handleBookingClick}
                    className="text-sm font-medium text-[#FFBF00] hover:text-[#E6AC00] underline underline-offset-4"
                  >
                    Open booking page again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntakeModal;
