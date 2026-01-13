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

    Returns the Stripe hosted checkout URL for the $300 advisory session.
    Validates that inquiry_id exists and matches the customer email.
    """
    settings = get_settings()
    supabase = get_supabase_service()

    if not settings.stripe_secret_key or "PLACEHOLDER" in settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment system not configured",
        )

    if not settings.stripe_price_advisory:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Advisory price not configured",
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
            cancel_url=settings.frontend_url,  # Redirect home on cancel
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


@router.get("/verify/{session_id}", response_model=VerifyResponse)
async def verify_checkout(session_id: str):
    """Verify a checkout session was completed successfully.

    SECURITY:
    - Returns only verified boolean, no PII
    - Validates service type matches 'advisory' to prevent
      other Stripe products from unlocking advisory booking
    """
    settings = get_settings()

    if not settings.stripe_secret_key or "PLACEHOLDER" in settings.stripe_secret_key:
        return VerifyResponse(verified=False)

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
