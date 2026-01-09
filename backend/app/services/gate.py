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

# Qualified access models (others trigger manual review)
QUALIFIED_ACCESS_MODELS = {
    AccessModel.REMOTE_ACCESS,
    AccessModel.OWN_ENVIRONMENT_OWN_TOOLS,
}

# Access models that trigger manual review
MANUAL_REVIEW_ACCESS_MODELS = {
    AccessModel.MANAGED_DEVICES,
    AccessModel.ONPREMISE_ONLY,
    AccessModel.UNSURE,
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

# Budget threshold for qualifying ($25k+)
QUALIFYING_BUDGETS = {
    BudgetRange.TWENTY_FIVE_TO_50K,
    BudgetRange.OVER_50K,
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


def is_senior_role(role_title: RoleTitle, is_decision_maker: bool | None = None) -> bool:
    """Check if role indicates seniority.

    IC/Other roles can qualify as senior if they are the budget owner/project sponsor.
    """
    # Standard senior roles
    if role_title in SENIOR_ROLES:
        return True

    # IC/Other with decision-maker authority = treat as senior
    if role_title in {RoleTitle.IC_ENGINEER, RoleTitle.OTHER}:
        return is_decision_maker is True

    return False


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
    - Access model = qualified (not managed_devices, onpremise_only, unsure)
    - Timeline = urgent or soon
    - Budget range >= $25k (25k_50k or over_50k)
    - Role/title indicates seniority (or IC/Other with decision-maker authority)
    - Context length >= 100 characters

    Special cases:
    - Paid advisory service bypasses gate entirely
    - IC/Other with strong signals → manual review (not fail)
    - "Not sure" budget with strong signals → manual review
    - Access flagged → manual review

    Args:
        form: The intake form submission

    Returns:
        GateEvaluationResult with status, details, qualification, and routing
    """
    settings = get_settings()
    flags: list[str] = []

    # Extract is_decision_maker from answers_raw
    is_decision_maker = None
    if form.answers_raw:
        is_decision_maker = form.answers_raw.is_decision_maker

    # Evaluate each criterion
    criteria = {
        "business_email": f"Email domain is business (not {settings.personal_email_domains[:3]}...)",
        "qualified_access": f"Access model in {[a.value for a in QUALIFIED_ACCESS_MODELS]}",
        "urgent_timeline": f"Timeline in {[t.value for t in URGENT_TIMELINES]}",
        "budget_threshold": f"Budget >= {settings.gate_min_budget_threshold}",
        "senior_role": f"Role in {[r.value for r in SENIOR_ROLES]} or IC/Other with decision-maker authority",
        "context_length": f"Context length >= {settings.gate_min_context_length} chars",
    }

    results = {
        "business_email": is_business_email(form.email),
        "qualified_access": is_qualified_access(form.access_model),
        "urgent_timeline": is_urgent_timeline(form.timeline),
        "budget_threshold": meets_budget_threshold(form.budget_range),
        "senior_role": is_senior_role(form.role_title, is_decision_maker),
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
    if form.access_model in MANUAL_REVIEW_ACCESS_MODELS:
        flags.append("access_requires_review")

    # Determine qualification
    if form.access_model in MANUAL_REVIEW_ACCESS_MODELS:
        qualification = Qualification.FLAGGED
    elif flags:
        qualification = Qualification.LOW_QUALITY if "very_short_context" in flags else Qualification.FLAGGED
    else:
        qualification = Qualification.QUALIFIED

    # Determine gate status with new logic
    gate_status = _determine_gate_status(form, results, is_decision_maker)

    # Determine routing based on service type and gate status
    routing_result = determine_routing(form.service_type, gate_status, results["qualified_access"])

    return GateEvaluationResult(
        gate_status=gate_status,
        gate_details=gate_details,
        qualification=qualification,
        routing_result=routing_result,
        flags=flags,
    )


def _determine_gate_status(
    form: IntakeFormRequest,
    results: dict[str, bool],
    is_decision_maker: bool | None,
) -> GateStatus:
    """Determine gate status based on criteria results and special cases.

    Logic:
    1. Access flagged (managed_devices, onpremise_only, unsure) → manual review
    2. All criteria pass → pass
    3. IC/Other (non-decision-maker) with strong signals → manual review
    4. "Not sure" budget with strong signals → manual review
    5. Otherwise → fail
    """
    # Access flagged = manual review required
    if form.access_model in MANUAL_REVIEW_ACCESS_MODELS:
        return GateStatus.MANUAL

    # All criteria passed = gate pass
    if all(results.values()):
        return GateStatus.PASS

    # Special case: IC/Other non-decision-maker with strong signals → manual review
    if form.role_title in {RoleTitle.IC_ENGINEER, RoleTitle.OTHER}:
        if is_decision_maker is not True:  # Not a decision maker
            # Check if all OTHER signals are strong
            has_qualifying_budget = form.budget_range in QUALIFYING_BUDGETS
            has_urgent_timeline = form.timeline in URGENT_TIMELINES
            has_qualified_access = form.access_model in QUALIFIED_ACCESS_MODELS
            has_sufficient_context = results["context_length"]
            has_business_email = results["business_email"]

            if (has_qualifying_budget and has_urgent_timeline and
                has_qualified_access and has_sufficient_context and has_business_email):
                return GateStatus.MANUAL

    # Special case: "Not sure" budget with strong signals → manual review
    if form.budget_range == BudgetRange.UNSURE:
        has_senior_role = results["senior_role"]
        has_urgent_timeline = form.timeline in URGENT_TIMELINES
        has_qualified_access = form.access_model in QUALIFIED_ACCESS_MODELS
        has_sufficient_context = results["context_length"]
        has_business_email = results["business_email"]

        if (has_senior_role and has_urgent_timeline and
            has_qualified_access and has_sufficient_context and has_business_email):
            return GateStatus.MANUAL

    # Default: fail
    return GateStatus.FAIL


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
