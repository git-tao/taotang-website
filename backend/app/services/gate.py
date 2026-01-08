"""Gate logic service for lead qualification and routing."""

from app.config import get_settings
from app.schemas.intake import (
    AccessModel,
    BudgetRange,
    GateDetails,
    GateEvaluationResult,
    GateStatus,
    IntakeFormRequest,
    Qualification,
    RoleTitle,
    RoutingResult,
    ServiceType,
    Timeline,
)


# Budget ordering for comparison
BUDGET_ORDER = {
    BudgetRange.UNDER_10K: 0,
    BudgetRange.TEN_TO_25K: 1,
    BudgetRange.TWENTY_FIVE_TO_50K: 2,
    BudgetRange.OVER_50K: 3,
    BudgetRange.UNSURE: 0,  # Treat unsure as low signal
}

# Qualified access models (others are flagged)
QUALIFIED_ACCESS_MODELS = {
    AccessModel.REMOTE_ACCESS,
    AccessModel.OWN_ENVIRONMENT_OWN_TOOLS,
}

# Senior roles that pass the seniority gate
SENIOR_ROLES = {
    RoleTitle.FOUNDER_CSUITE,
    RoleTitle.VP_DIRECTOR,
    RoleTitle.ENG_MANAGER,
}

# Timelines that indicate urgency
URGENT_TIMELINES = {
    Timeline.URGENT,
    Timeline.SOON,
}


def extract_email_domain(email: str) -> str:
    """Extract domain from email address."""
    return email.split("@")[1].lower()


def is_business_email(email: str) -> bool:
    """Check if email is from a business domain (not personal)."""
    settings = get_settings()
    domain = extract_email_domain(email)
    return domain not in settings.personal_email_domains


def is_qualified_access(access_model: AccessModel) -> bool:
    """Check if access model is qualified (not flagged)."""
    return access_model in QUALIFIED_ACCESS_MODELS


def is_senior_role(role_title: RoleTitle) -> bool:
    """Check if role indicates seniority."""
    return role_title in SENIOR_ROLES


def is_urgent_timeline(timeline: Timeline) -> bool:
    """Check if timeline indicates urgency."""
    return timeline in URGENT_TIMELINES


def meets_budget_threshold(budget_range: BudgetRange) -> bool:
    """Check if budget meets minimum threshold."""
    settings = get_settings()
    min_budget = BudgetRange(settings.gate_min_budget_threshold)
    return BUDGET_ORDER[budget_range] >= BUDGET_ORDER[min_budget]


def has_sufficient_context(context: str) -> bool:
    """Check if context has sufficient detail."""
    settings = get_settings()
    return len(context) >= settings.gate_min_context_length


def evaluate_gate(form: IntakeFormRequest) -> GateEvaluationResult:
    """Evaluate the high-signal gate for an intake submission.

    Gate Criteria (all required for pass):
    - Business email (non-personal domain)
    - Access model = qualified
    - Timeline = urgent or soon
    - Budget range meets minimum threshold
    - Role/title indicates seniority
    - Context length >= 100 characters

    Args:
        form: The intake form submission

    Returns:
        GateEvaluationResult with status, details, qualification, and routing
    """
    settings = get_settings()
    flags: list[str] = []

    # Evaluate each criterion
    criteria = {
        "business_email": f"Email domain is business (not {settings.personal_email_domains[:3]}...)",
        "qualified_access": f"Access model in {[a.value for a in QUALIFIED_ACCESS_MODELS]}",
        "urgent_timeline": f"Timeline in {[t.value for t in URGENT_TIMELINES]}",
        "budget_threshold": f"Budget >= {settings.gate_min_budget_threshold}",
        "senior_role": f"Role in {[r.value for r in SENIOR_ROLES]}",
        "context_length": f"Context length >= {settings.gate_min_context_length} chars",
    }

    results = {
        "business_email": is_business_email(form.email),
        "qualified_access": is_qualified_access(form.access_model),
        "urgent_timeline": is_urgent_timeline(form.timeline),
        "budget_threshold": meets_budget_threshold(form.budget_range),
        "senior_role": is_senior_role(form.role_title),
        "context_length": has_sufficient_context(form.context_raw),
    }

    passed = [k for k, v in results.items() if v]
    failed = [k for k, v in results.items() if not v]

    gate_details = GateDetails(
        criteria=criteria,
        results=results,
        passed=passed,
        failed=failed,
    )

    # Add flags for specific conditions
    if not results["business_email"]:
        flags.append("personal_email")
    if len(form.context_raw) < 20:
        flags.append("very_short_context")
    if form.timeline == Timeline.EXPLORING:
        flags.append("just_exploring")

    # Determine qualification
    if not results["qualified_access"]:
        # Access flagged = always flagged qualification
        qualification = Qualification.FLAGGED
    elif flags:
        qualification = Qualification.LOW_QUALITY if "very_short_context" in flags else Qualification.FLAGGED
    else:
        qualification = Qualification.QUALIFIED

    # Determine gate status
    if not results["qualified_access"]:
        # Access flagged = manual review required
        gate_status = GateStatus.MANUAL
    elif all(results.values()):
        # All criteria passed
        gate_status = GateStatus.PASS
    elif sum(results.values()) >= 4:
        # Most criteria passed, manual review
        gate_status = GateStatus.MANUAL
    else:
        # Below threshold
        gate_status = GateStatus.FAIL

    # Determine routing based on service type and gate status
    routing_result = determine_routing(form.service_type, gate_status, results["qualified_access"])

    return GateEvaluationResult(
        gate_status=gate_status,
        gate_details=gate_details,
        qualification=qualification,
        routing_result=routing_result,
        flags=flags,
    )


def determine_routing(
    service_type: ServiceType,
    gate_status: GateStatus,
    is_access_qualified: bool,
) -> RoutingResult:
    """Determine the routing path based on service type and gate status.

    Routing Logic:
    - If access is flagged -> MANUAL (never auto-route)
    - If service_type = advisory_paid -> PAID_ADVISORY
    - If gate_status = pass and service_type in {audit, project, unclear} -> CALENDLY_STRATEGY_FREE
    - If gate_status = fail -> PAID_ADVISORY (no free call)
    - If gate_status = manual -> MANUAL

    Args:
        service_type: The requested service type
        gate_status: The gate evaluation result
        is_access_qualified: Whether access model is qualified

    Returns:
        RoutingResult indicating where to route the lead
    """
    # Access flagged = always manual
    if not is_access_qualified:
        return RoutingResult.MANUAL

    # Paid advisory is direct path regardless of gate
    if service_type == ServiceType.ADVISORY_PAID:
        return RoutingResult.PAID_ADVISORY

    # Based on gate status
    if gate_status == GateStatus.PASS:
        return RoutingResult.CALENDLY_STRATEGY_FREE
    elif gate_status == GateStatus.FAIL:
        return RoutingResult.PAID_ADVISORY
    else:  # MANUAL
        return RoutingResult.MANUAL


def get_routing_message(routing_result: RoutingResult) -> str:
    """Get user-facing message based on routing result."""
    messages = {
        RoutingResult.CALENDLY_STRATEGY_FREE: (
            "You qualify for a free strategy call. "
            "Book a time that works for you."
        ),
        RoutingResult.PAID_ADVISORY: (
            "Based on your needs, a paid advisory session would be the best fit. "
            "You'll get focused, actionable guidance."
        ),
        RoutingResult.MANUAL: (
            "Thanks for reaching out! I'll review your request and "
            "follow up via email within 24 hours."
        ),
        RoutingResult.STRIPE_AUDIT: (
            "Ready to proceed with an AI systems audit. "
            "Complete the deposit to get started."
        ),
        RoutingResult.STRIPE_PROJECT: (
            "Ready to proceed with your project. "
            "Complete the deposit to kick things off."
        ),
    }
    return messages.get(routing_result, "Thanks for your submission!")
