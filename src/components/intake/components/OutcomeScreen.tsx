import React, { useState } from 'react';
import { IntakeResponse } from '../types';

interface OutcomeScreenProps {
  result: IntakeResponse;
  onReset: () => void;
}

// Google Calendar Appointment Scheduling URL
const BOOKING_URL = 'https://calendar.app.google/yochBqeYtLimcXc76';

const OutcomeScreen: React.FC<OutcomeScreenProps> = ({ result, onReset }) => {
  const [clicked, setClicked] = useState(false);

  const handleBookingClick = () => {
    setClicked(true);
    window.open(BOOKING_URL, '_blank', 'noopener,noreferrer');
  };

  if (clicked) {
    return (
      <div className="max-w-2xl mx-auto text-center">
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
          You're All Set
        </h2>
        <p className="text-[#6C757D] mb-6 max-w-md mx-auto">
          Complete your booking in the Google Calendar tab. You'll receive a
          confirmation email with all the details once scheduled.
        </p>

        <button
          onClick={handleBookingClick}
          className="text-sm font-medium text-[#FFBF00] hover:text-[#E6AC00] underline underline-offset-4"
        >
          Open booking page again
        </button>
      </div>
    );
  }

  // Render based on routing result
  const renderOutcome = () => {
    switch (result.routing_result) {
      case 'calendly_strategy_free':
        return <BookingOutcome onBook={handleBookingClick} />;
      case 'paid_advisory':
        return <BookingOutcome onBook={handleBookingClick} />;
      case 'manual':
        return <BookingOutcome onBook={handleBookingClick} />;
      default:
        return <BookingOutcome onBook={handleBookingClick} />;
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
 * Single booking outcome — all paths lead here now
 */
const BookingOutcome: React.FC<{ onBook: () => void }> = ({ onBook }) => {
  return (
    <div className="text-center">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[#212529] mb-4">
        Let's Talk
      </h2>
      <p className="text-[#6C757D] mb-6 max-w-md mx-auto">
        Pick a time for a free discovery call to discuss your project
        and the best path forward.
      </p>

      <button
        onClick={onBook}
        className="inline-block px-8 py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-colors shadow-lg shadow-amber-200/40 text-lg cursor-pointer"
      >
        Book a Discovery Call
      </button>
    </div>
  );
};

export default OutcomeScreen;
