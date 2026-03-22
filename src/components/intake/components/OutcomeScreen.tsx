import React from 'react';
import { IntakeResponse } from '../types';

interface OutcomeScreenProps {
  result: IntakeResponse;
  onReset: () => void;
}

// Google Calendar Appointment Scheduling URL
const BOOKING_URL = 'https://calendar.app.google/yochBqeYtLimcXc76';

const OutcomeScreen: React.FC<OutcomeScreenProps> = ({ result, onReset }) => {
  // Render based on routing result
  const renderOutcome = () => {
    switch (result.routing_result) {
      case 'calendly_strategy_free':
        return <FreeStrategyCallOutcome />;
      case 'paid_advisory':
        return <AdvisoryOutcome />;
      case 'manual':
        return <ManualReviewOutcome />;
      default:
        return <ManualReviewOutcome />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {renderOutcome()}

      <div className="mt-8 text-center">
        <button
          onClick={onReset}
          className="text-sm font-medium text-[#FFBF00] hover:text-[#E6AC00] underline underline-offset-4"
        >
          Start over
        </button>
      </div>
    </div>
  );
};

/**
 * Outcome: Gate PASS - Free Strategy Call
 */
const FreeStrategyCallOutcome: React.FC = () => {
  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-green-600"
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
      </div>

      <h2 className="text-2xl font-bold text-[#212529] mb-4">
        Let's Talk
      </h2>
      <p className="text-[#6C757D] mb-6 max-w-md mx-auto">
        Your project looks like a strong potential fit. Pick a time below
        for a free discovery call to discuss your goals and the best path forward.
      </p>

      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-8 py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-colors shadow-lg shadow-amber-200/40 text-lg"
      >
        Book a Discovery Call
      </a>
    </div>
  );
};

/**
 * Outcome: Gate FAIL - Advisory Session (now free booking)
 */
const AdvisoryOutcome: React.FC = () => {
  return (
    <div className="text-center">
      {/* Amber Icon */}
      <div className="mb-6">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-[#FFBF00]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[#212529] mb-4">
        Let's Talk
      </h2>
      <p className="text-[#6C757D] mb-8 max-w-md mx-auto">
        I'd love to learn more about your project. Pick a time below
        for a discovery call to discuss your needs.
      </p>

      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-8 py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-colors shadow-lg shadow-amber-200/40 text-lg"
      >
        Book a Discovery Call
      </a>
    </div>
  );
};

/**
 * Outcome: Manual Review - No Scheduling
 */
const ManualReviewOutcome: React.FC = () => {
  return (
    <div className="text-center">
      {/* Blue Icon */}
      <div className="mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* Headline & Body (from design doc) */}
      <h2 className="text-2xl font-bold text-[#212529] mb-4">
        Thank You for Your Inquiry
      </h2>
      <p className="text-[#6C757D] mb-6 max-w-md mx-auto">
        Thank you for providing your project details. Your submission requires a manual
        review to ensure we're the right fit for your needs.
      </p>

      {/* Timeline indicator */}
      <div className="bg-[#F8F9FA] p-6 rounded-xl max-w-md mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <svg
            className="w-5 h-5 text-[#6C757D]"
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
          <span className="text-sm font-medium text-[#212529]">
            Response within 24-48 hours
          </span>
        </div>
        <p className="text-sm text-[#6C757D]">
          I'll personally review your submission and reach out via email with the next steps.
        </p>
      </div>
    </div>
  );
};

export default OutcomeScreen;
