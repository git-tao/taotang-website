# Intake System Critical Fix Plan

**Date:** January 13, 2026
**Status:** Ready for Implementation (v2 - Validation Issues Addressed)
**Estimated Effort:** 4-6 hours

---

## Validation Issues Addressed (v2)

| Issue | Severity | Resolution |
|-------|----------|------------|
| PaidAdvisoryOutcome missing `result`/`API_URL` props | Critical | Updated component signature and parent to pass props |
| BookingSuccess doesn't load Calendly script | High | Added useEffect to load Calendly widget.js |
| Verification endpoint leaks PII | High | Returns only `{ verified: boolean }` |
| Verification doesn't validate product type | Medium | Added `metadata.service === "advisory"` check |
| BookingSuccess missing session_id handling | Medium | Added early return and defined helper components |
| Checkout doesn't validate inquiry_id exists | Medium | Added Supabase lookup before creating session |
| FRONTEND_URL not environment-specific | Medium | Made configurable per environment |

---

## Executive Summary

The intake form submission system has several critical issues preventing the paid advisory flow from working and causing unacceptable latency (40+ seconds). This plan addresses all issues in priority order.

---

## Current State Analysis

### What's Broken

| Issue | Severity | Impact |
|-------|----------|--------|
| Paid advisory links to non-existent Calendly URL | **Critical** | Users see 404, cannot book |
| No Stripe checkout endpoint exists | **Critical** | Payment cannot be collected |
| Stripe keys are placeholders | **Critical** | All Stripe functionality broken |
| Wrong Calendly account (`hello-compliantphotos`) | **High** | URLs don't exist |
| Render cold start (30-60s) | **High** | Terrible UX on first request |
| Synchronous Gemini API calls | **Medium** | Adds 4-8s to every submission |
| Tailwind CDN warning | **Low** | Console noise, minor perf impact |

### Root Cause: Incomplete Integration

The webhook handler (`stripe_webhooks.py`) was built to **receive** payments, but the checkout flow to **initiate** payments was never implemented. The frontend links directly to Calendly URLs that don't exist.

---

## Architecture: Correct Flow

### Current (Broken) Flow
```
User submits form → Gate evaluates → "paid_advisory" result
    → OutcomeScreen shows "Book Advisory" button
    → Links to calendly.com/hello-compliantphotos/paid-advisory
    → 404 ERROR
```

### Target (Correct) Flow
```
User submits form → Gate evaluates → "paid_advisory" result
    → OutcomeScreen shows "Book Advisory" button
    → Frontend calls POST /api/checkout/advisory
    → Backend creates Stripe Checkout Session
    → User redirected to Stripe hosted checkout
    → User pays $400
    → Stripe sends webhook to /api/webhooks/stripe
    → Backend marks inquiry as "paid"
    → User redirected to success page
    → Success page verifies payment
    → Shows Calendly embed to book time slot
```

---

## Implementation Plan

### Phase 0: Configuration Setup (Prerequisites)

**Owner:** User (Tao)

Before code changes can work, these must be configured:

#### 0.1 Stripe Dashboard Setup
- [ ] Create Product: "Strategic Advisory Session"
- [ ] Create Price: $400 USD, one-time payment
- [ ] Note the Price ID (e.g., `price_1ABC...`)
- [ ] Verify webhook endpoint is configured: `https://taotang-api.onrender.com/api/webhooks/stripe`
- [ ] Webhook events enabled: `checkout.session.completed`, `payment_intent.succeeded`

#### 0.2 Environment Variables (Backend)
```bash
# Add to Render environment variables
STRIPE_SECRET_KEY=sk_live_your_actual_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret
STRIPE_PRICE_ADVISORY=price_your_price_id
```

#### 0.3 Calendly Verification
- [ ] Confirm `https://calendly.com/taotang/strategy-call` exists and works
- [ ] Create or verify advisory booking event type (free, post-payment)
- [ ] Note the correct URL for post-payment booking

---

### Phase 1: Backend - Stripe Checkout Endpoint (P0)

**Files to create/modify:**
- `backend/app/routers/checkout.py` (NEW)
- `backend/app/main.py` (add router)
- `backend/app/config.py` (add price ID setting)

#### 1.1 Create Checkout Router

```python
# backend/app/routers/checkout.py
"""Stripe Checkout session creation endpoints."""

import stripe
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.config import get_settings
from app.services.supabase import get_supabase_service

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


class CheckoutRequest(BaseModel):
    inquiry_id: str
    customer_email: str
    customer_name: str


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class VerifyResponse(BaseModel):
    verified: bool


@router.post("/advisory", response_model=CheckoutResponse)
async def create_advisory_checkout(request: CheckoutRequest):
    """Create Stripe Checkout session for paid advisory.

    Returns the Stripe hosted checkout URL for the $400 advisory session.
    Validates that inquiry_id exists and matches the customer email.
    """
    settings = get_settings()
    supabase = get_supabase_service()

    if not settings.stripe_secret_key or settings.stripe_secret_key.startswith("sk_live_PLACEHOLDER"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment system not configured",
        )

    # SECURITY: Validate inquiry exists and email matches
    inquiry = await supabase.get_inquiry(request.inquiry_id)
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found",
        )
    if inquiry.get("email", "").lower() != request.customer_email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email does not match inquiry",
        )

    stripe.api_key = settings.stripe_secret_key

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price": settings.stripe_price_advisory,
                "quantity": 1,
            }],
            mode="payment",
            customer_email=request.customer_email,
            metadata={
                "inquiry_id": request.inquiry_id,
                "customer_name": request.customer_name,
                "service": "advisory",  # Used for verification
            },
            success_url=f"{settings.frontend_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.frontend_url}/booking/cancelled",
        )

        return CheckoutResponse(
            checkout_url=session.url,
            session_id=session.id,
        )

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
```

#### 1.2 Update Config

```python
# Add to backend/app/config.py Settings class
stripe_price_advisory: str = ""
# Environment-specific: set via env var for local/staging/prod
frontend_url: str = "https://taotang.io"  # Default to prod, override in env
```

**Environment Variable Setup:**
```bash
# Local development
FRONTEND_URL=http://localhost:3000

# Staging (if applicable)
FRONTEND_URL=https://staging.taotang.io

# Production (Render)
FRONTEND_URL=https://taotang.io
```

#### 1.3 Register Router

```python
# Add to backend/app/main.py
from app.routers import checkout

app.include_router(checkout.router)
```

---

### Phase 2: Frontend - Checkout Flow (P0)

**Files to modify:**
- `src/components/intake/components/OutcomeScreen.tsx`
- `src/pages/BookingSuccess.tsx` (NEW)
- `src/pages/BookingCancelled.tsx` (NEW)
- `src/App.tsx` (add routes)

#### 2.1 Fix OutcomeScreen - Paid Advisory

**CRITICAL FIX:** The `PaidAdvisoryOutcome` component needs access to `result.inquiry_id` and `API_URL`.

**Step 1: Update component props and parent**

```tsx
// At top of OutcomeScreen.tsx - define API_URL
const API_URL = import.meta.env.VITE_API_URL || 'https://taotang-api.onrender.com';

// Update PaidAdvisoryOutcome interface to receive result
interface PaidAdvisoryOutcomeProps {
  userData?: UserData;
  result: IntakeResponse;  // ADD THIS - needed for inquiry_id
}

// Update the component call in renderOutcome()
case 'paid_advisory':
  return <PaidAdvisoryOutcome userData={userData} result={result} />;  // Pass result
```

**Step 2: Update component implementation**

```tsx
// Updated PaidAdvisoryOutcome component
const PaidAdvisoryOutcome: React.FC<PaidAdvisoryOutcomeProps> = ({ userData, result }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBookAdvisory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/checkout/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiry_id: result.inquiry_id,
          customer_email: userData?.email || '',
          customer_name: userData?.name || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const { checkout_url } = await response.json();
      window.location.href = checkout_url;

    } catch (err) {
      console.error('Checkout error:', err);
      setError('Unable to start checkout. Please try again or contact directly.');
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center">
      {/* ... existing icon and text ... */}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Replace <a> tag with button */}
      <button
        onClick={handleBookAdvisory}
        disabled={isLoading}
        className="block w-full py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg
                   hover:bg-[#E6AC00] transition-all text-center shadow-lg shadow-amber-200/40
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Preparing checkout...' : 'Book Your Paid Advisory Session'}
      </button>
    </div>
  );
};
```

#### 2.2 Fix Calendly URLs

```tsx
// Replace hello-compliantphotos with taotang
const CALENDLY_FREE_STRATEGY = 'https://calendly.com/taotang/strategy-call';
const CALENDLY_PAID_ADVISORY = 'https://calendly.com/taotang/advisory'; // Post-payment booking
```

#### 2.3 Create Success Page

**FIXES APPLIED:**
- Loads Calendly widget script
- Handles missing session_id (doesn't leave spinner forever)
- Defines helper components inline
- Verifies with backend before showing Calendly

```tsx
// src/pages/BookingSuccess.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://taotang-api.onrender.com';
const CALENDLY_ADVISORY_URL = 'https://calendly.com/taotang/strategy-call';

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
              : 'We couldn\'t verify your payment. If you completed payment, please contact us.'}
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
```

#### 2.4 Add Routes

```tsx
// In App.tsx
<Route path="/booking/success" element={<BookingSuccess />} />
<Route path="/booking/cancelled" element={<BookingCancelled />} />
```

---

### Phase 3: Backend - Payment Verification Endpoint (P0)

Add endpoint to verify payment status for success page.

**SECURITY FIXES:**
- Returns only `{ verified: boolean }` - no PII leak
- Validates `metadata.service === "advisory"` to prevent other products unlocking advisory booking

```python
# Add to backend/app/routers/checkout.py

@router.get("/verify/{session_id}", response_model=VerifyResponse)
async def verify_checkout(session_id: str):
    """Verify a checkout session was completed successfully.

    SECURITY:
    - Returns only verified boolean, no PII
    - Validates service type matches 'advisory' to prevent
      other Stripe products from unlocking advisory booking
    """
    settings = get_settings()
    stripe.api_key = settings.stripe_secret_key

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        # Must be paid
        if session.payment_status != "paid":
            return VerifyResponse(verified=False)

        # Must be advisory service (prevent other products unlocking this page)
        if session.metadata.get("service") != "advisory":
            return VerifyResponse(verified=False)

        return VerifyResponse(verified=True)

    except stripe.error.StripeError:
        return VerifyResponse(verified=False)
```

**Alternative: Verify via Supabase (webhook processed)**

If you want to ensure the webhook has been processed before showing Calendly:

```python
@router.get("/verify/{session_id}", response_model=VerifyResponse)
async def verify_checkout(session_id: str):
    """Verify payment by checking if webhook recorded it in DB."""
    supabase = get_supabase_service()

    # Check if payment exists in our database (written by webhook)
    payment = await supabase.get_payment_by_stripe_id(session_id)

    if not payment:
        return VerifyResponse(verified=False)

    # Check payment is for advisory
    if payment.get("payment_type") != "advisory":
        return VerifyResponse(verified=False)

    # Check status
    if payment.get("status") not in ("completed", "confirmed"):
        return VerifyResponse(verified=False)

    return VerifyResponse(verified=True)
```

**Decision:** Use Stripe API verification (first option) for immediate feedback. Webhook-based verification adds latency waiting for webhook to process.

---

### Phase 4: Latency Reduction (P1)

#### 4.1 Keep-Warm Cron Job

**Option A: External Cron Service (Recommended)**

Use [cron-job.org](https://cron-job.org) (free):
- URL: `https://taotang-api.onrender.com/api/health`
- Method: GET
- Schedule: Every 10 minutes

**Option B: GitHub Actions**

```yaml
# .github/workflows/keep-warm.yml
name: Keep API Warm
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -f https://taotang-api.onrender.com/api/health
```

#### 4.2 Add Timing Instrumentation

```python
# Add to backend/app/routers/intake.py
import time

@router.post("/intake")
async def submit_intake(form: IntakeFormRequest, request: Request):
    timings = {}
    start = time.time()

    # Rate limit check
    t0 = time.time()
    is_allowed, reason = await supabase.check_rate_limit(...)
    timings["rate_limit"] = time.time() - t0

    # Gate evaluation
    t0 = time.time()
    evaluation = evaluate_gate(form)
    timings["gate_eval"] = time.time() - t0

    # Database insert
    t0 = time.time()
    inquiry = await supabase.create_inquiry(inquiry_data)
    timings["db_insert"] = time.time() - t0

    # AI analysis
    t0 = time.time()
    ai_result = await ai_service.analyze_submission(...)
    timings["ai_analysis"] = time.time() - t0

    timings["total"] = time.time() - start
    print(f"TIMING: {timings}")

    return response
```

#### 4.3 Skip LLM for Advisory Requests

```python
# In ai_assistant.py, add early return
async def analyze_submission(self, form, inquiry_id, gate_result):
    # Skip AI for explicit advisory requests - no clarification needed
    if form.service_type == ServiceType.ADVISORY_PAID:
        return AISessionStartResponse(
            needs_clarification=False,
            inquiry_id=inquiry_id,
            gate_status=gate_result.gate_status.value,
            routing_result=gate_result.routing_result.value,
            message="Advisory session requested",
        )

    # ... rest of analysis
```

---

### Phase 5: Cleanup (P2-P3)

#### 5.1 Remove Unused Calendly URLs

Delete references to `hello-compliantphotos` throughout codebase.

#### 5.2 Tailwind PostCSS (Optional)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then remove CDN script from `index.html`.

---

## Testing Checklist

### Pre-Deployment
- [ ] Stripe test mode: complete $400 checkout flow end-to-end
- [ ] Verify webhook receives `checkout.session.completed`
- [ ] Verify success page shows Calendly only after payment verified
- [ ] Test cancel flow returns user gracefully
- [ ] Test cold start with keep-warm disabled (baseline)
- [ ] Test with keep-warm enabled (should be <2s)

### Post-Deployment
- [ ] Monitor `/api/intake` response times
- [ ] Verify cron job is pinging successfully
- [ ] Complete one real $400 test transaction
- [ ] Book actual advisory slot via post-payment Calendly

---

## Environment Variables Summary

### Backend - Production (Render)
```bash
STRIPE_SECRET_KEY=sk_live_xxx          # Real Stripe key
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Webhook signing secret
STRIPE_PRICE_ADVISORY=price_xxx        # $400 advisory price ID
FRONTEND_URL=https://taotang.io        # Redirect URLs (env-specific!)
```

### Backend - Local Development
```bash
STRIPE_SECRET_KEY=sk_test_xxx          # Test mode key
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Use Stripe CLI for local testing
STRIPE_PRICE_ADVISORY=price_xxx        # Same price ID works in test mode
FRONTEND_URL=http://localhost:3000     # Local frontend URL
```

### Frontend (.env.local)
```bash
VITE_API_URL=https://taotang-api.onrender.com  # Or http://localhost:8000 for local
```

---

## Files Changed Summary

| File | Action | Priority |
|------|--------|----------|
| `backend/app/routers/checkout.py` | CREATE | P0 |
| `backend/app/main.py` | MODIFY (add router) | P0 |
| `backend/app/config.py` | MODIFY (add settings) | P0 |
| `src/components/intake/components/OutcomeScreen.tsx` | MODIFY | P0 |
| `src/pages/BookingSuccess.tsx` | CREATE | P0 |
| `src/pages/BookingCancelled.tsx` | CREATE | P0 |
| `src/App.tsx` | MODIFY (add routes) | P0 |
| `.github/workflows/keep-warm.yml` | CREATE | P1 |
| `backend/app/routers/intake.py` | MODIFY (timing) | P1 |
| `backend/app/services/ai_assistant.py` | MODIFY (skip LLM) | P1 |
| `index.html` | MODIFY (remove CDN) | P3 |

---

## Questions for Tao Before Implementation

### Resolved by Validation Feedback

| Question | Decision |
|----------|----------|
| Verify via Stripe API or Supabase DB? | **Stripe API** - immediate feedback, no webhook latency |
| Return PII in verification endpoint? | **No** - only `{ verified: boolean }` |
| FRONTEND_URL environment-specific? | **Yes** - configured per environment |

### Still Need Answers

1. **Stripe Price ID**: What is the price ID for the $400 advisory?
   - Create in Stripe Dashboard → Products → Add Product → Add Price ($400, one-time)
   - Note the `price_xxx` ID

2. **Calendly Advisory URL**: After payment, which Calendly event should users book?
   - Currently using `taotang/strategy-call` (your existing event)
   - Or create new event type for paid sessions?

3. **Keep-Warm Method**:
   - Option A: cron-job.org (external, free, no code) ← **Recommended**
   - Option B: GitHub Actions (in repo, free)

4. **Cancel Flow**: When user cancels Stripe checkout:
   - Currently: Returns to `/booking/cancelled` (simple page with "Return Home" link)
   - Alternative: Return directly to home page

---

## Appendix: Ada Embed Error

**Not in codebase.** The error `AdaEmbedError: Ada Embed has already been started` comes from a browser extension. Test in Incognito mode to confirm - if error disappears, it's an extension. No action needed on our end.
