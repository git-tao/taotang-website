import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://taotang-api.onrender.com';
const CALENDLY_ADVISORY_URL = 'https://calendly.com/hello-compliantphotos/1-1-with-tao';

// Extend window type for Calendly
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        prefill?: Record<string, string>;
        utm?: Record<string, string>;
      }) => void;
    };
  }
}

const BookingSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'verified' | 'failed' | 'missing'>('loading');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const calendlyContainerRef = useRef<HTMLDivElement>(null);

  // Load Calendly widget script
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="calendly"]');
    if (existingScript) {
      // Script already exists, check if Calendly is ready
      if (window.Calendly) {
        setScriptLoaded(true);
      } else {
        existingScript.addEventListener('load', () => setScriptLoaded(true));
      }
    } else {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    }
  }, []);

  // Listen for Calendly event_scheduled message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.event === 'calendly.event_scheduled') {
        setBookingComplete(true);
        // Replace history so back button doesn't return to booking page
        window.history.replaceState(null, '', '/booking/complete');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize Calendly widget when both script is loaded and payment is verified
  useEffect(() => {
    if (scriptLoaded && status === 'verified' && !bookingComplete && calendlyContainerRef.current && window.Calendly) {
      // Clear any existing content
      calendlyContainerRef.current.innerHTML = '';

      // Initialize the widget
      window.Calendly.initInlineWidget({
        url: `${CALENDLY_ADVISORY_URL}?hide_gdpr_banner=1&primary_color=FFBF00`,
        parentElement: calendlyContainerRef.current,
      });
    }
  }, [scriptLoaded, status, bookingComplete]);

  // Verify payment
  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    // Handle missing session_id immediately
    if (!sessionId) {
      setStatus('missing');
      return;
    }

    // Verify with backend
    const verifyPayment = async () => {
      try {
        const response = await fetch(`${API_URL}/api/checkout/verify/${sessionId}`);
        if (!response.ok) {
          setStatus('failed');
          return;
        }
        const data = await response.json();
        setStatus(data.verified ? 'verified' : 'failed');
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [searchParams]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFBF00] mx-auto mb-4" />
          <p className="text-[#6C757D]">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  // Missing session_id or failed verification
  if (status === 'missing' || status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#212529] mb-4">
            {status === 'missing' ? 'Invalid Booking Link' : 'Payment Not Verified'}
          </h1>
          <p className="text-[#6C757D] mb-6">
            {status === 'missing'
              ? 'This booking link is invalid or has expired.'
              : "We couldn't verify your payment. If you completed payment, please contact us."}
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00]"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Booking complete - show confirmation
  if (bookingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#212529] mb-4">
            You're All Set!
          </h1>
          <p className="text-[#6C757D] mb-2">
            Your advisory session has been scheduled.
          </p>
          <p className="text-[#6C757D] mb-8">
            You'll receive a calendar invite and confirmation email shortly with all the details.
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-colors shadow-lg"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Verified - show Calendly
  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#212529] mb-2">Payment Successful!</h1>
          <p className="text-[#6C757D]">
            Thank you for your purchase. Please select a time for your advisory session below.
          </p>
        </div>

        {/* Calendly embed */}
        <div
          ref={calendlyContainerRef}
          className="rounded-xl overflow-hidden shadow-lg border border-[#E9ECEF]"
          style={{ minWidth: '320px', height: '630px' }}
        />

        {/* Return home link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-[#6C757D] hover:text-[#212529] underline underline-offset-4"
          >
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
