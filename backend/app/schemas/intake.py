"""Pydantic schemas for intake form submission and responses."""

from enum import Enum
from typing import Optional
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


# Request schemas
class IntakeFormRequest(BaseModel):
    """Intake form submission from frontend."""

    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    role_title: RoleTitle
    service_type: ServiceType
    access_model: AccessModel
    timeline: Timeline
    budget_range: BudgetRange
    context_raw: str = Field(..., min_length=1, max_length=10000)

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


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    detail: Optional[str] = None
