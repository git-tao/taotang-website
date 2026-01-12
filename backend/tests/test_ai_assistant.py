"""Unit tests for AI Assistant service.

Tests cover:
1. Rule-based trigger detection
2. Fallback question generation
3. Field update logic
4. Session management helpers
"""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime, timezone

from app.schemas.intake import (
    IntakeFormRequest,
    AccessModel,
    BudgetRange,
    RoleTitle,
    ServiceType,
    Timeline,
    GateStatus,
    AnswersRaw,
)
from app.schemas.ai_assistant import (
    AITriggerReason,
    AIQuestionType,
    DetectedIssue,
)


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def mock_settings():
    """Create mock settings for testing."""
    settings = MagicMock()
    settings.gemini_api_key = ""  # No API key = use fallbacks
    settings.gemini_model = "gemini-3-flash-preview"
    settings.ai_max_questions = 3
    settings.ai_session_ttl_minutes = 30
    settings.gate_min_context_length = 100
    return settings


@pytest.fixture
def qualifying_form():
    """Form data that should pass gate without triggers."""
    return IntakeFormRequest(
        name="John Doe",
        email="john@company.com",
        role_title=RoleTitle.FOUNDER_CSUITE,
        service_type=ServiceType.PROJECT,
        context_raw="We have an AI chatbot prototype that works well in development but struggles with production traffic. We need help scaling it to handle 10x load.",
        access_model=AccessModel.REMOTE_ACCESS,
        timeline=Timeline.URGENT,
        budget_range=BudgetRange.BUDGET_25K_50K,
    )


@pytest.fixture
def ambiguous_budget_form():
    """Form data with unsure budget - should trigger ambiguity."""
    return IntakeFormRequest(
        name="Jane Smith",
        email="jane@company.com",
        role_title=RoleTitle.VP_DIRECTOR,
        service_type=ServiceType.PROJECT,
        context_raw="We need help building an AI-powered recommendation engine. The project involves processing user behavior data and generating personalized suggestions.",
        access_model=AccessModel.REMOTE_ACCESS,
        timeline=Timeline.SOON,
        budget_range=BudgetRange.UNSURE,
    )


@pytest.fixture
def unclear_service_form():
    """Form data with unclear service type - should trigger ambiguity."""
    return IntakeFormRequest(
        name="Bob Wilson",
        email="bob@company.com",
        role_title=RoleTitle.ENG_MANAGER,
        service_type=ServiceType.UNCLEAR,
        context_raw="We're exploring options to improve our ML pipeline but aren't sure what exactly we need. We have some performance issues but also want new features.",
        access_model=AccessModel.REMOTE_ACCESS,
        timeline=Timeline.PLANNING,
        budget_range=BudgetRange.BUDGET_25K_50K,
    )


@pytest.fixture
def short_context_form():
    """Form data with insufficient context - should trigger ambiguity."""
    return IntakeFormRequest(
        name="Alice Brown",
        email="alice@company.com",
        role_title=RoleTitle.FOUNDER_CSUITE,
        service_type=ServiceType.PROJECT,
        context_raw="Need AI help.",  # Too short
        access_model=AccessModel.REMOTE_ACCESS,
        timeline=Timeline.URGENT,
        budget_range=BudgetRange.BUDGET_25K_50K,
    )


@pytest.fixture
def ic_without_decision_maker_form():
    """IC engineer without decision-maker status - should trigger ambiguity."""
    return IntakeFormRequest(
        name="Charlie Tech",
        email="charlie@company.com",
        role_title=RoleTitle.IC_ENGINEER,
        service_type=ServiceType.PROJECT,
        context_raw="We have an AI chatbot prototype that works well in development but struggles with production traffic. We need help scaling it to handle 10x load.",
        access_model=AccessModel.REMOTE_ACCESS,
        timeline=Timeline.URGENT,
        budget_range=BudgetRange.BUDGET_25K_50K,
        answers_raw=AnswersRaw(is_decision_maker=None),  # Not answered
    )


# =============================================================================
# TRIGGER DETECTION TESTS
# =============================================================================

class TestRuleBasedTriggerDetection:
    """Tests for _detect_rule_based_triggers method."""

    def test_qualifying_form_has_no_triggers(self, mock_settings, qualifying_form):
        """Fully qualifying form should not trigger any rules."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                triggers = service._detect_rule_based_triggers(qualifying_form)

        assert triggers == []

    def test_unsure_budget_triggers_ambiguity(self, mock_settings, ambiguous_budget_form):
        """Budget=unsure should trigger AMBIGUITY."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                triggers = service._detect_rule_based_triggers(ambiguous_budget_form)

        assert AITriggerReason.AMBIGUITY in triggers

    def test_unclear_service_triggers_ambiguity(self, mock_settings, unclear_service_form):
        """Service_type=unclear should trigger AMBIGUITY."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                triggers = service._detect_rule_based_triggers(unclear_service_form)

        assert AITriggerReason.AMBIGUITY in triggers

    def test_short_context_triggers_ambiguity(self, mock_settings, short_context_form):
        """Short context (<100 chars) should trigger AMBIGUITY."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                triggers = service._detect_rule_based_triggers(short_context_form)

        assert AITriggerReason.AMBIGUITY in triggers

    def test_ic_without_decision_maker_triggers_ambiguity(self, mock_settings, ic_without_decision_maker_form):
        """IC engineer without decision-maker answer should trigger AMBIGUITY."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                triggers = service._detect_rule_based_triggers(ic_without_decision_maker_form)

        assert AITriggerReason.AMBIGUITY in triggers

    def test_unsure_access_model_triggers_ambiguity(self, mock_settings):
        """Access_model=unsure should trigger AMBIGUITY."""
        from app.services.ai_assistant import AIAssistantService

        form = IntakeFormRequest(
            name="Test User",
            email="test@company.com",
            role_title=RoleTitle.FOUNDER_CSUITE,
            service_type=ServiceType.PROJECT,
            context_raw="We need help building an AI-powered recommendation engine. The project involves processing user behavior data and generating personalized suggestions.",
            access_model=AccessModel.UNSURE,
            timeline=Timeline.URGENT,
            budget_range=BudgetRange.BUDGET_25K_50K,
        )

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                triggers = service._detect_rule_based_triggers(form)

        assert AITriggerReason.AMBIGUITY in triggers


# =============================================================================
# FALLBACK QUESTION TESTS
# =============================================================================

class TestFallbackQuestionGeneration:
    """Tests for _get_fallback_question method."""

    def test_budget_unsure_gets_budget_question(self, mock_settings, ambiguous_budget_form):
        """Form with budget=unsure should get budget clarification question."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                issues = [
                    DetectedIssue(
                        trigger_type=AITriggerReason.AMBIGUITY,
                        field="budget_range",
                        description="User unsure of budget",
                        priority=1,
                    )
                ]
                question = service._get_fallback_question(
                    form=ambiguous_budget_form,
                    issues=issues,
                    previous_turns=[],
                )

        assert question.target_field == "budget_range"
        assert question.question_type == AIQuestionType.SINGLE_CHOICE
        assert question.options is not None
        assert len(question.options) > 0

    def test_service_unclear_gets_service_question(self, mock_settings, unclear_service_form):
        """Form with service_type=unclear should get service clarification question."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                issues = [
                    DetectedIssue(
                        trigger_type=AITriggerReason.AMBIGUITY,
                        field="service_type",
                        description="User unsure of service type",
                        priority=2,
                    )
                ]
                question = service._get_fallback_question(
                    form=unclear_service_form,
                    issues=issues,
                    previous_turns=[],
                )

        assert question.target_field == "service_type"
        assert question.question_type == AIQuestionType.SINGLE_CHOICE

    def test_short_context_gets_context_question(self, mock_settings, short_context_form):
        """Form with short context should get context clarification question."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                issues = [
                    DetectedIssue(
                        trigger_type=AITriggerReason.AMBIGUITY,
                        field="context_raw",
                        description="Context too brief",
                        priority=3,
                    )
                ]
                question = service._get_fallback_question(
                    form=short_context_form,
                    issues=issues,
                    previous_turns=[],
                )

        assert question.target_field == "context_raw"
        assert question.question_type == AIQuestionType.TEXT

    def test_skips_already_asked_fields(self, mock_settings, ambiguous_budget_form):
        """Should skip fields that have already been asked about."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                issues = [
                    DetectedIssue(
                        trigger_type=AITriggerReason.AMBIGUITY,
                        field="budget_range",
                        description="User unsure of budget",
                        priority=1,
                    )
                ]
                # Simulate budget question already asked
                previous_turns = [{"target_field": "budget_range", "answer_text": "$25k-$50k"}]
                question = service._get_fallback_question(
                    form=ambiguous_budget_form,
                    issues=issues,
                    previous_turns=previous_turns,
                )

        # Should get a different question (fallback context question)
        assert question.target_field != "budget_range"


# =============================================================================
# TRIGGERS TO ISSUES CONVERSION TESTS
# =============================================================================

class TestTriggersToIssues:
    """Tests for _triggers_to_issues method."""

    def test_ambiguity_trigger_creates_budget_issue(self, mock_settings, ambiguous_budget_form):
        """AMBIGUITY trigger with unsure budget should create budget issue."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                issues = service._triggers_to_issues(
                    triggers=[AITriggerReason.AMBIGUITY],
                    form=ambiguous_budget_form,
                )

        budget_issues = [i for i in issues if i.field == "budget_range"]
        assert len(budget_issues) == 1
        assert budget_issues[0].priority == 1  # Budget is highest priority

    def test_budget_scope_mismatch_creates_budget_issue(self, mock_settings, qualifying_form):
        """BUDGET_SCOPE_MISMATCH trigger should create budget issue."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                issues = service._triggers_to_issues(
                    triggers=[AITriggerReason.BUDGET_SCOPE_MISMATCH],
                    form=qualifying_form,
                )

        assert len(issues) == 1
        assert issues[0].trigger_type == AITriggerReason.BUDGET_SCOPE_MISMATCH
        assert issues[0].field == "budget_range"

    def test_contradiction_creates_generic_issue(self, mock_settings, qualifying_form):
        """CONTRADICTION trigger should create generic contradiction issue."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                issues = service._triggers_to_issues(
                    triggers=[AITriggerReason.CONTRADICTION],
                    form=qualifying_form,
                )

        assert len(issues) == 1
        assert issues[0].trigger_type == AITriggerReason.CONTRADICTION
        assert issues[0].field is None  # Generic contradiction

    def test_issues_sorted_by_priority(self, mock_settings, ambiguous_budget_form):
        """Issues should be sorted by priority (lower = higher priority)."""
        from app.services.ai_assistant import AIAssistantService

        # Modify form to have multiple ambiguity issues
        form = IntakeFormRequest(
            name="Test",
            email="test@company.com",
            role_title=RoleTitle.FOUNDER_CSUITE,
            service_type=ServiceType.UNCLEAR,  # Priority 2
            context_raw="Short",  # Priority 3
            access_model=AccessModel.REMOTE_ACCESS,
            timeline=Timeline.URGENT,
            budget_range=BudgetRange.UNSURE,  # Priority 1
        )

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                issues = service._triggers_to_issues(
                    triggers=[AITriggerReason.AMBIGUITY],
                    form=form,
                )

        # Budget (priority 1) should come first
        if len(issues) >= 2:
            assert issues[0].priority <= issues[1].priority


# =============================================================================
# QUESTION OPTIONS MAPPING TESTS
# =============================================================================

class TestQuestionOptionsMapping:
    """Tests for fallback question option field mappings."""

    def test_budget_options_map_to_enum_values(self, mock_settings, ambiguous_budget_form):
        """Budget question options should map directly to BudgetRange enum values."""
        from app.services.ai_assistant import AIAssistantService

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service'):
                service = AIAssistantService()
                issues = [
                    DetectedIssue(
                        trigger_type=AITriggerReason.AMBIGUITY,
                        field="budget_range",
                        description="User unsure of budget",
                        priority=1,
                    )
                ]
                question = service._get_fallback_question(
                    form=ambiguous_budget_form,
                    issues=issues,
                    previous_turns=[],
                )

        valid_budget_values = {"under_10k", "10k_25k", "25k_50k", "over_50k"}
        for option in question.options:
            if option.maps_to_value:
                assert option.maps_to_value in valid_budget_values
                assert option.maps_to_field == "budget_range"


# =============================================================================
# INTEGRATION-LIKE TESTS (With Mocked Dependencies)
# =============================================================================

class TestAnalyzeSubmissionFlow:
    """Integration-style tests for the analyze_submission flow."""

    @pytest.mark.asyncio
    async def test_qualifying_submission_returns_no_clarification(self, mock_settings, qualifying_form):
        """Fully qualifying submission should not need clarification."""
        from app.services.ai_assistant import AIAssistantService
        from app.schemas.intake import GateEvaluationResult, RoutingResult

        mock_supabase = MagicMock()

        gate_result = GateEvaluationResult(
            gate_status=GateStatus.PASS,
            routing_result=RoutingResult.CALENDLY_STRATEGY_FREE,
            criteria={},
            fail_reasons=[],
        )

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service', return_value=mock_supabase):
                service = AIAssistantService()
                result = await service.analyze_submission(
                    form=qualifying_form,
                    inquiry_id="test-inquiry-123",
                    gate_result=gate_result,
                )

        assert result.needs_clarification is False
        assert result.gate_status == "pass"

    @pytest.mark.asyncio
    async def test_ambiguous_submission_triggers_clarification(self, mock_settings, ambiguous_budget_form):
        """Submission with ambiguity should trigger clarification."""
        from app.services.ai_assistant import AIAssistantService
        from app.schemas.intake import GateEvaluationResult, RoutingResult

        mock_supabase = MagicMock()
        mock_supabase.client.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{"id": "session-123", "max_questions": 3, "question_count": 0}]
        )

        gate_result = GateEvaluationResult(
            gate_status=GateStatus.MANUAL,
            routing_result=RoutingResult.MANUAL,
            criteria={},
            fail_reasons=["budget_unsure"],
        )

        with patch('app.services.ai_assistant.get_settings', return_value=mock_settings):
            with patch('app.services.ai_assistant.get_supabase_service', return_value=mock_supabase):
                service = AIAssistantService()
                result = await service.analyze_submission(
                    form=ambiguous_budget_form,
                    inquiry_id="test-inquiry-456",
                    gate_result=gate_result,
                )

        assert result.needs_clarification is True
        assert result.session_id is not None
        assert result.first_question is not None
