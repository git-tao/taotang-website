"""Stripe webhook handlers for payment events."""

import stripe
from fastapi import APIRouter, HTTPException, Header, Request, status

from app.config import get_settings
from app.services.supabase import get_supabase_service

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
    """Handle Stripe webhook events.

    Supported events:
    - checkout.session.completed: When a checkout session is completed
    - payment_intent.succeeded: When a payment is successfully processed

    The webhook verifies the signature to ensure the request came from Stripe.
    """
    settings = get_settings()
    supabase = get_supabase_service()

    # Get raw body for signature verification
    payload = await request.body()

    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret,
        )
    except ValueError:
        # Invalid payload
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )

    # Log webhook event for debugging
    event_type = event["type"]
    event_id = event["id"]

    # Store webhook event in database for idempotency
    try:
        await supabase.create_webhook_event(
            event_id=event_id,
            event_type=event_type,
            payload=event,
        )
    except Exception as e:
        # If event already exists, it's a duplicate - skip processing
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            return {"status": "already_processed", "event_id": event_id}
        raise

    # Handle specific event types
    try:
        if event_type == "checkout.session.completed":
            await handle_checkout_completed(event, supabase)
        elif event_type == "payment_intent.succeeded":
            await handle_payment_succeeded(event, supabase)
        else:
            # Log unhandled event type
            print(f"Unhandled webhook event type: {event_type}")

        # Mark webhook as processed
        await supabase.update_webhook_event(event_id, status="processed")

    except Exception as e:
        # Mark webhook as failed
        await supabase.update_webhook_event(
            event_id,
            status="failed",
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook: {str(e)}",
        )

    return {"status": "success", "event_id": event_id}


async def handle_checkout_completed(event: dict, supabase) -> None:
    """Handle checkout.session.completed event.

    This is triggered when a user completes a Stripe Checkout session,
    typically for a paid advisory booking.
    """
    session = event["data"]["object"]

    # Extract relevant data
    customer_email = session.get("customer_email") or session.get("customer_details", {}).get("email")
    amount_total = session.get("amount_total", 0)  # In cents
    currency = session.get("currency", "usd")
    payment_intent_id = session.get("payment_intent")
    session_id = session.get("id")

    # Get metadata (we can pass inquiry_id here when creating checkout)
    metadata = session.get("metadata", {})
    inquiry_id = metadata.get("inquiry_id")

    # Create payment record
    payment_data = {
        "stripe_payment_id": payment_intent_id or session_id,
        "amount": amount_total / 100,  # Convert from cents
        "currency": currency.upper(),
        "status": "completed",
        "payment_type": "advisory",  # Can be customized via metadata
        "metadata": {
            "session_id": session_id,
            "customer_email": customer_email,
        },
    }

    if inquiry_id:
        payment_data["inquiry_id"] = inquiry_id

    await supabase.create_payment(payment_data)

    # If linked to an inquiry, update the inquiry status
    if inquiry_id:
        await supabase.update_inquiry(
            inquiry_id,
            {
                "status": "paid",
                "payment_status": "completed",
            },
        )

        # Create audit event
        await supabase.create_inquiry_event(
            inquiry_id=inquiry_id,
            event_type="payment_completed",
            actor_type="system",
            new_value=f"Payment of {amount_total/100} {currency.upper()} received",
            reason="Checkout completed",
        )


async def handle_payment_succeeded(event: dict, supabase) -> None:
    """Handle payment_intent.succeeded event.

    This is triggered when a payment is successfully processed.
    We use this as a backup/confirmation for checkout.session.completed.
    """
    payment_intent = event["data"]["object"]

    payment_id = payment_intent.get("id")
    amount = payment_intent.get("amount", 0)  # In cents
    currency = payment_intent.get("currency", "usd")

    # Check if we already have a payment record for this payment_intent
    existing = await supabase.get_payment_by_stripe_id(payment_id)

    if existing:
        # Update status to confirmed
        await supabase.update_payment(
            existing["id"],
            {"status": "confirmed"},
        )
    else:
        # Create a new payment record (fallback)
        metadata = payment_intent.get("metadata", {})
        await supabase.create_payment({
            "stripe_payment_id": payment_id,
            "amount": amount / 100,
            "currency": currency.upper(),
            "status": "confirmed",
            "payment_type": metadata.get("payment_type", "unknown"),
            "metadata": metadata,
        })
