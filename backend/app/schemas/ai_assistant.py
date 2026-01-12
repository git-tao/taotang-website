"""Pydantic schemas for AI Intake Assistant."""

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


# ============================================================================
# ENUMS (match database types)
# ============================================================================

class AISessionStatus(str, Enum):
    """Status of an AI clarification session."""
    ACTIVE = "active"
    RESOLVED = "resolved"
    MANUAL = "manual"
    EXPIRED = "expired"
    ERROR = "error"


class AITriggerReason(str, Enum):
    """Reason that triggered AI clarification."""
    AMBIGUITY = "ambiguity"
    CONTRADICTION = "contradiction"
    BUDGET_SCOPE_MISMATCH = "budget_scope_mismatch"
    INTELLIGENCE = "intelligence"


class AIQuestionType(str, Enum):
    """Type of clarification question."""
    SINGLE_CHOICE = "single_choice"
    TEXT = "text"
    CONFIRMATION = "confirmation"


# ============================================================================
# QUESTION & OPTION SCHEMAS
# ============================================================================

class QuestionOption(BaseModel):
    """Option for choice-type questions."""
    value: str = Field(..., description="Unique identifier for this option")
    label: str = Field(..., description="Display text for this option")
    description: Optional[str] = Field(None, description="Optional helper text")
    maps_to_field: Optional[str] = Field(None, description="Form field this option updates")
    maps_to_value: Optional[Any] = Field(None, description="Value to set on the form field")


class AIQuestion(BaseModel):
    """A clarification question to present to the user."""
    question_text: str = Field(..., description="The question to ask")
    question_type: AIQuestionType = Field(..., description="Type of question")
    question_purpose: Optional[str] = Field(None, description="Why we're asking (shown to user)")
    options: Optional[list[QuestionOption]] = Field(None, description="Options for choice questions")
    target_field: Optional[str] = Field(None, description="Form field this question resolves")


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class ClarifyAnswerRequest(BaseModel):
    """User's answer to a clarification question."""
    session_id: str = Field(..., description="AI session ID")
    turn_index: int = Field(..., ge=0, description="Index of the question being answered")
    answer_value: Any = Field(..., description="User's answer (string, option value, or bool)")


class SessionKeepAliveRequest(BaseModel):
    """Keep session alive while user is thinking."""
    session_id: str = Field(..., description="AI session ID")


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class AITurnResponse(BaseModel):
    """Response after processing a user's answer."""
    session_id: str
    turn_index: int
    session_status: AISessionStatus

    # If session still active, next question
    next_question: Optional[AIQuestion] = None

    # If session resolved/completed, final routing
    gate_status: Optional[str] = None
    routing_result: Optional[str] = None
    message: Optional[str] = None

    # Progress indicator
    questions_remaining: int = Field(..., ge=0)

    # Field update that occurred (if any)
    field_updated: Optional[str] = None
    field_old_value: Optional[Any] = None
    field_new_value: Optional[Any] = None


class AISessionStartResponse(BaseModel):
    """Response when form is submitted - indicates if clarification is needed."""
    needs_clarification: bool = Field(..., description="Whether AI clarification is needed")

    # If clarification needed
    session_id: Optional[str] = Field(None, description="AI session ID")
    trigger_reasons: list[AITriggerReason] = Field(default_factory=list)
    first_question: Optional[AIQuestion] = Field(None, description="First question to ask")
    provisional_gate_status: Optional[str] = Field(None, description="Gate status before clarification (for logging)")

    # If no clarification needed (normal routing)
    inquiry_id: Optional[str] = None
    gate_status: Optional[str] = None
    routing_result: Optional[str] = None
    message: Optional[str] = None


class AISessionStateResponse(BaseModel):
    """Current state of an AI session (for resume)."""
    session_id: str
    status: AISessionStatus
    trigger_reasons: list[AITriggerReason]
    question_count: int = Field(..., ge=0)
    max_questions: int = Field(..., gt=0)
    questions_remaining: int = Field(..., ge=0)
    current_question: Optional[AIQuestion] = None
    field_updates: dict[str, Any] = Field(default_factory=dict)
    expires_at: str


# ============================================================================
# INTERNAL SCHEMAS (used by AI service, not exposed via API)
# ============================================================================

class DetectedIssue(BaseModel):
    """An issue detected during trigger analysis."""
    trigger_type: AITriggerReason
    field: Optional[str] = None
    description: str
    priority: int = Field(..., ge=1, le=3, description="1=highest, 3=lowest")
    confidence: float = Field(1.0, ge=0.0, le=1.0)


class TriggerAnalysisResult(BaseModel):
    """Result of analyzing form submission for triggers."""
    has_triggers: bool
    triggers: list[AITriggerReason] = Field(default_factory=list)
    issues: list[DetectedIssue] = Field(default_factory=list)
    llm_available: bool = True
    llm_error: Optional[str] = None


class FieldUpdate(BaseModel):
    """Record of a field update made during clarification."""
    field: str
    old_value: Any
    new_value: Any
    turn_index: int
    user_confirmed: bool = True
    trigger_reason: str


class FinalOutput(BaseModel):
    """Final structured output when session completes."""
    clarifications: list[FieldUpdate] = Field(default_factory=list)
    intelligence_gathered: dict[str, Any] = Field(default_factory=dict)
    ai_pre_call_notes: dict[str, Any] = Field(default_factory=dict)
