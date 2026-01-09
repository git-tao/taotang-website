import React, { useEffect } from 'react';
import { IntakeResponse } from '../types';

interface OutcomeScreenProps {
  result: IntakeResponse;
  onReset: () => void;
}

// Calendly URLs - update with actual URLs
const CALENDLY_FREE_STRATEGY = 'https://calendly.com/hello-compliantphotos/30min';
// For paid advisory, use Calendly with Stripe payment required (or separate booking page)
const CALENDLY_PAID_ADVISORY = 'https://calendly.com/hello-compliantphotos/paid-advisory';

const OutcomeScreen: React.FC<OutcomeScreenProps> = ({ result, onReset }) => {
  // Load Calendly widget script for free strategy call
  useEffect(() => {
    if (result.routing_result === 'calendly_strategy_free') {
      const existingScript = document.querySelector('script[src*="calendly"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [result.routing_result]);

  // Render based on routing result
  const renderOutcome = () => {
    switch (result.routing_result) {
      case 'calendly_strategy_free':
        return <FreeStrategyCallOutcome />;
      case 'paid_advisory':
        return <PaidAdvisoryOutcome />;
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
          Submit another inquiry
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

      {/* Headline & Body (from design doc) */}
      <h2 className="text-2xl font-bold text-[#212529] mb-4">
        Thank You for Your Application
      </h2>
      <p className="text-[#6C757D] mb-6 max-w-md mx-auto">
        Your project looks like a strong potential fit. The next step is a complimentary
        30-minute strategy call to discuss your goals in more detail and determine the
        best path forward.
      </p>
      <p className="text-[#212529] font-medium mb-8">
        Please use the calendar below to schedule a time that works for you.
      </p>

      {/* Calendly Embed */}
      <div
        className="calendly-inline-widget rounded-xl overflow-hidden shadow-lg border border-[#E9ECEF]"
        data-url={`${CALENDLY_FREE_STRATEGY}?hide_gdpr_banner=1&primary_color=FFBF00`}
        style={{ minWidth: '320px', height: '630px' }}
      />
    </div>
  );
};

/**
 * Outcome: Gate FAIL - Paid Advisory Session
 */
const PaidAdvisoryOutcome: React.FC = () => {
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* Headline & Body (from design doc) */}
      <h2 className="text-2xl font-bold text-[#212529] mb-4">
        Thank You for Your Inquiry
      </h2>
      <p className="text-[#6C757D] mb-8 max-w-md mx-auto">
        Based on your project details, a dedicated advisory session would be the most
        effective next step. This paid 1-hour session is designed to provide you with
        actionable recommendations and a clear path forward.
      </p>

      {/* Pricing Card */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E9ECEF] max-w-md mx-auto">
        <h3 className="text-xl font-bold text-[#212529] mb-2">
          1-Hour Advisory Session
        </h3>
        <p className="text-4xl font-bold text-[#212529] mb-2">$400</p>
        <p className="text-[#6C757D] mb-6 text-sm">
          Deep-dive consultation on your AI challenges
        </p>

        <ul className="text-left text-[#6C757D] space-y-3 mb-8 text-sm">
          <li className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Personalized analysis of your situation</span>
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Actionable recommendations you can implement</span>
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Recording provided after session</span>
          </li>
        </ul>

        <a
          href={CALENDLY_PAID_ADVISORY}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-all text-center shadow-lg shadow-amber-200/40"
        >
          Book Your Paid Advisory Session
        </a>
      </div>
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
