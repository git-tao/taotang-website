"""Intake form submission endpoint."""

import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.schemas.intake import (
    ErrorResponse,
    IntakeFormRequest,
    IntakeResponse,
)
from app.services.gate import (
    evaluate_gate,
    extract_email_domain,
    get_routing_message,
)
from app.services.supabase import get_supabase_service
from app.services.ai_assistant import get_ai_assistant

router = APIRouter(prefix="/api", tags=["intake"])


@router.post(
    "/intake",
    response_model=IntakeResponse,
    responses={
        400: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def submit_intake(
    form: IntakeFormRequest,
    request: Request,
) -> IntakeResponse:
    """Submit intake form and receive routing result.

    This endpoint:
    1. Validates the form submission
    2. Checks rate limits
    3. Evaluates the high-signal gate
    4. Creates the inquiry record
    5. Returns the routing result

    The routing determines whether the lead should:
    - Book a free strategy call (gate passed)
    - Book a paid advisory session (gate failed or advisory requested)
    - Wait for manual review (access flagged)
    """
    settings = get_settings()
    supabase = get_supabase_service()

    # Extract client IP (handle proxies)
    ip_address: Optional[str] = None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()
    else:
        ip_address = request.client.host if request.client else None

    # Check rate limits
    is_allowed, rate_limit_reason = await supabase.check_rate_limit(
        email=form.email,
        ip_address=ip_address,
    )
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=rate_limit_reason,
        )

    # Evaluate gate and determine routing
    evaluation = evaluate_gate(form)

    # Extract email domain
    email_domain = extract_email_domain(form.email)

    # Build answers_raw with all form data including extensions
    answers_raw_data = form.model_dump(mode="json")
    if form.answers_raw:
        # Merge extended answers into answers_raw for complete storage
        answers_raw_data["extended"] = form.answers_raw.model_dump(mode="json")

    # Build inquiry record
    inquiry_data = {
        # Identity
        "name": form.name,
        "email": form.email,
        "email_domain": email_domain,
        # Form answers
        "role_title": form.role_title.value,
        "service_type": form.service_type.value,
        "access_model": form.access_model.value,
        "timeline": form.timeline.value,
        "budget_range": form.budget_range.value,
        "context_raw": form.context_raw,
        # Qualification & Routing (computed)
        "gate_status": evaluation.gate_status.value,
        "gate_details": evaluation.gate_details.model_dump(),
        "status": "new",
        "qualification": evaluation.qualification.value,
        "routing_result": evaluation.routing_result.value,
        "flags": evaluation.flags,
        # Tracking
        "entry_point": form.entry_point,
        "utm_source": form.utm_source,
        "utm_medium": form.utm_medium,
        "utm_campaign": form.utm_campaign,
        "utm_term": form.utm_term,
        "utm_content": form.utm_content,
        "referrer": form.referrer,
        "ip_address": ip_address,
        "user_agent": request.headers.get("user-agent"),
        # Versioning
        "form_version": settings.form_version,
        "rules_version": settings.rules_version,
        "answers_raw": answers_raw_data,
        "answers_version": settings.answers_version,
    }

    try:
        # Create inquiry in database
        inquiry = await supabase.create_inquiry(inquiry_data)

        # Create audit event
        await supabase.create_inquiry_event(
            inquiry_id=inquiry["id"],
            event_type="created",
            actor_type="system",
            new_value=json.dumps({
                "gate_status": evaluation.gate_status.value,
                "routing_result": evaluation.routing_result.value,
            }),
            reason="Form submission",
        )

        # AI Analysis: Check for clarification triggers
        ai_service = get_ai_assistant()
        ai_result = await ai_service.analyze_submission(
            form=form,
            inquiry_id=inquiry["id"],
            gate_result=evaluation,
        )

        # If AI clarification is needed, return modified response
        if ai_result.needs_clarification:
            return IntakeResponse(
                inquiry_id=inquiry["id"],
                gate_status=evaluation.gate_status,
                routing_result=evaluation.routing_result,
                message="A few quick questions to help us understand your needs better.",
                needs_clarification=True,
                ai_session_id=ai_result.session_id,
                provisional_gate_status=evaluation.gate_status,
                first_question=ai_result.first_question.model_dump() if ai_result.first_question else None,
            )

        # No clarification needed - return normal response
        message = get_routing_message(evaluation.routing_result)

        return IntakeResponse(
            inquiry_id=inquiry["id"],
            gate_status=evaluation.gate_status,
            routing_result=evaluation.routing_result,
            message=message,
        )

    except Exception as e:
        # Log error but don't expose details
        print(f"Error creating inquiry: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your request. Please try again or email directly.",
        )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
