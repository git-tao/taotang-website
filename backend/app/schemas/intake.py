"""Pydantic schemas for intake form submission and responses."""

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# Enums matching database types
class ServiceType(str, Enum):
    ADVISORY_PAID = "advisory_paid"
    AUDIT = "audit"
    PROJECT = "project"
    UNCLEAR = "unclear"


class AccessModel(str, Enum):
    REMOTE_ACCESS = "remote_access"
    OWN_ENVIRONMENT_OWN_TOOLS = "own_environment_own_tools"
    MANAGED_DEVICES = "managed_devices"
    ONPREMISE_ONLY = "onpremise_only"
    UNSURE = "unsure"


class Timeline(str, Enum):
    URGENT = "urgent"
    SOON = "soon"
    PLANNING = "planning"
    EXPLORING = "exploring"


class BudgetRange(str, Enum):
    UNDER_10K = "under_10k"
    TEN_TO_25K = "10k_25k"
    TWENTY_FIVE_TO_50K = "25k_50k"
    OVER_50K = "over_50k"
    UNSURE = "unsure"


class RoleTitle(str, Enum):
    FOUNDER_CSUITE = "founder_csuite"
    VP_DIRECTOR = "vp_director"
    ENG_MANAGER = "eng_manager"
    IC_ENGINEER = "ic_engineer"
    OTHER = "other"


class ProjectSubtype(str, Enum):
    """Subtype for 'Build or ship something' projects."""
    PROTOTYPE_TO_PRODUCTION = "prototype_to_production"
    RAG_RELIABILITY_SPRINT = "rag_reliability_sprint"
    OTHER_BUILD = "other_build"


class GateStatus(str, Enum):
    PASS = "pass"
    MANUAL = "manual"
    FAIL = "fail"


class Qualification(str, Enum):
    QUALIFIED = "qualified"
    FLAGGED = "flagged"
    LOW_QUALITY = "low_quality"


class RoutingResult(str, Enum):
    CALENDLY_STRATEGY_FREE = "calendly_strategy_free"
    PAID_ADVISORY = "paid_advisory"
    STRIPE_AUDIT = "stripe_audit"
    STRIPE_PROJECT = "stripe_project"
    MANUAL = "manual"


# Extended answers for conditional follow-ups
class AnswersRaw(BaseModel):
    """Extended answers from conditional form fields."""

    # Basic info extensions
    company_name: Optional[str] = None
    is_decision_maker: Optional[bool] = None  # For IC/Other roles

    # Conditional follow-ups based on service_type
    audit_symptoms: Optional[str] = None  # If service_type = audit
    project_subtype: Optional[str] = None  # If service_type = project
    project_state: Optional[str] = None  # If project_subtype = prototype_to_production
    rag_issues: Optional[str] = None  # If project_subtype = rag_reliability_sprint
    advisory_questions: Optional[str] = None  # If service_type = advisory_paid
    desired_outcome: Optional[str] = None  # If service_type = unclear


# Request schemas
class IntakeFormRequest(BaseModel):
    """Intake form submission from frontend."""

    # Step 1: Basic Info
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    role_title: RoleTitle

    # Step 2: Project Details
    service_type: ServiceType
    context_raw: str = Field(..., min_length=1, max_length=10000)

    # Step 3: Qualification
    access_model: AccessModel
    timeline: Timeline
    budget_range: BudgetRange

    # Extended answers (conditional fields)
    answers_raw: Optional[AnswersRaw] = None

    # Optional tracking fields
    entry_point: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None
    referrer: Optional[str] = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("context_raw")
    @classmethod
    def strip_context(cls, v: str) -> str:
        return v.strip()


# Internal schemas for gate evaluation
class GateDetails(BaseModel):
    """Snapshot of gate criteria evaluation."""

    criteria: dict[str, str]  # What was evaluated
    results: dict[str, bool]  # Pass/fail for each criterion
    passed: list[str]  # List of passed criteria
    failed: list[str]  # List of failed criteria


class GateEvaluationResult(BaseModel):
    """Result of gate evaluation."""

    gate_status: GateStatus
    gate_details: GateDetails
    qualification: Qualification
    routing_result: RoutingResult
    flags: list[str]


# Response schemas
class IntakeResponse(BaseModel):
    """Response after intake form submission."""

    inquiry_id: str
    gate_status: GateStatus
    routing_result: RoutingResult
    message: str

    # AI Clarification fields (only present when needs_clarification=True)
    needs_clarification: bool = False
    ai_session_id: Optional[str] = None
    provisional_gate_status: Optional[GateStatus] = None  # Gate status before clarification
    first_question: Optional[Any] = None  # AIQuestion object (typed as Any to avoid circular import)


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None
