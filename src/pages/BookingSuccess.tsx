import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://taotang-api.onrender.com';
const CALENDLY_ADVISORY_URL = 'https://calendly.com/hello-compliantphotos/30-minute-meeting';

const BookingSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'verified' | 'failed' | 'missing'>('loading');

  // Load Calendly widget script
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="calendly"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

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
          className="calendly-inline-widget rounded-xl overflow-hidden shadow-lg border border-[#E9ECEF]"
          data-url={`${CALENDLY_ADVISORY_URL}?hide_gdpr_banner=1&primary_color=FFBF00`}
          style={{ minWidth: '320px', height: '630px' }}
        />
      </div>
    </div>
  );
};

export default BookingSuccess;
