"""AI Intake Assistant service for clarification and qualification.

This service orchestrates the AI-powered intake clarification flow:
1. Analyzes form submissions for triggers (ambiguity, contradiction, budget/scope mismatch)
2. Creates AI sessions when clarification is needed
3. Generates questions and processes answers
4. Re-gates after each answer to allow early resolution
5. Builds final output when session completes
"""

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import google.generativeai as genai

from app.config import get_settings
from app.prompts.clarification import (
    FALLBACK_QUESTIONS,
    QUESTION_GENERATION_SYSTEM,
    QUESTION_GENERATION_USER,
    TRIGGER_DETECTION_SYSTEM,
    TRIGGER_DETECTION_USER,
)
from app.schemas.ai_assistant import (
    AIQuestion,
    AIQuestionType,
    AISessionStartResponse,
    AISessionStatus,
    AITriggerReason,
    AITurnResponse,
    DetectedIssue,
    FieldUpdate,
    FinalOutput,
    QuestionOption,
    TriggerAnalysisResult,
)
from app.schemas.intake import (
    AccessModel,
    BudgetRange,
    GateEvaluationResult,
    GateStatus,
    IntakeFormRequest,
    RoleTitle,
    RoutingResult,
    ServiceType,
)
from app.services.gate import evaluate_gate, get_routing_message
from app.services.supabase import get_supabase_service


class AIAssistantService:
    """Orchestrates AI-powered intake clarification."""

    def __init__(self):
        settings = get_settings()
        self.settings = settings
        self.supabase = get_supabase_service()
        self.model = None

        # Initialize Gemini if API key is available
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel(settings.gemini_model)

    # =========================================================================
    # PUBLIC API
    # =========================================================================

    async def analyze_submission(
        self,
        form: IntakeFormRequest,
        inquiry_id: str,
        gate_result: GateEvaluationResult,
    ) -> AISessionStartResponse:
        """Analyze form submission for triggers, create session if needed.

        This is the main entry point called after form submission.

        Args:
            form: The submitted form data
            inquiry_id: ID of the created inquiry record
            gate_result: Initial gate evaluation result

        Returns:
            AISessionStartResponse indicating if clarification is needed
        """
        # Step 1: Rule-based trigger detection (always runs)
        rule_triggers = self._detect_rule_based_triggers(form)

        # Step 2: LLM-based trigger detection (may fail gracefully)
        llm_result = await self._detect_llm_triggers(form)

        # Combine triggers
        all_triggers = list(set(rule_triggers + llm_result.triggers))

        # Step 3: Handle LLM failure case
        if not llm_result.llm_available and not rule_triggers:
            # LLM failed and no rule-based triggers
            # Route to manual with note (per requirements)
            return AISessionStartResponse(
                needs_clarification=False,
                inquiry_id=inquiry_id,
                gate_status=GateStatus.MANUAL.value,
                routing_result=RoutingResult.MANUAL.value,
                message="We'll review your submission and follow up shortly.",
            )

        # Step 4: If no triggers, return normal result
        if not all_triggers:
            return AISessionStartResponse(
                needs_clarification=False,
                inquiry_id=inquiry_id,
                gate_status=gate_result.gate_status.value,
                routing_result=gate_result.routing_result.value,
                message=get_routing_message(gate_result.routing_result),
            )

        # Step 5: Create AI session
        session = await self._create_session(
            inquiry_id=inquiry_id,
            triggers=all_triggers,
            provisional_gate_status=gate_result.gate_status,
        )

        # Step 6: Generate first question
        all_issues = self._triggers_to_issues(all_triggers, form)
        first_question = await self._generate_question(
            session=session,
            form=form,
            issues=all_issues,
            previous_turns=[],
        )

        # Step 7: Store first turn
        await self._create_turn(session["id"], 0, first_question)

        return AISessionStartResponse(
            needs_clarification=True,
            session_id=session["id"],
            trigger_reasons=all_triggers,
            first_question=first_question,
            provisional_gate_status=gate_result.gate_status.value,
        )

    async def process_answer(
        self,
        session_id: str,
        turn_index: int,
        answer_value: Any,
    ) -> AITurnResponse:
        """Process user's answer and determine next action.

        Args:
            session_id: AI session ID
            turn_index: Index of the question being answered
            answer_value: User's answer

        Returns:
            AITurnResponse with next question or final routing
        """
        # 1. Get session and validate
        session = await self._get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        if session["status"] != "active":
            raise ValueError(f"Session is {session['status']}, not active")

        # 2. Get the turn and validate
        turn = await self._get_turn(session_id, turn_index)
        if not turn:
            raise ValueError("Turn not found")
        if turn.get("answered_at"):
            raise ValueError("Question already answered")

        # 3. Update turn with answer
        await self._update_turn_answer(turn["id"], answer_value, turn)

        # 4. Apply field update if applicable
        field_updated, old_value, new_value = await self._apply_field_update(
            session, turn, answer_value
        )

        # 5. Increment question count
        new_count = session["question_count"] + 1
        await self._update_session(session_id, {"question_count": new_count})

        # 6. Get updated inquiry and re-run gate
        inquiry = await self.supabase.get_inquiry(session["inquiry_id"])
        form = self._inquiry_to_form(inquiry)
        gate_result = evaluate_gate(form)

        # 7. Update session with latest gate result
        await self._update_session(session_id, {
            "latest_gate_status": gate_result.gate_status.value,
            "latest_routing_result": gate_result.routing_result.value,
        })

        # 8. Check if resolved (gate now passes)
        if gate_result.gate_status == GateStatus.PASS:
            await self._complete_session(session_id, AISessionStatus.RESOLVED, gate_result)
            return AITurnResponse(
                session_id=session_id,
                turn_index=turn_index,
                session_status=AISessionStatus.RESOLVED,
                gate_status=gate_result.gate_status.value,
                routing_result=gate_result.routing_result.value,
                message=get_routing_message(gate_result.routing_result),
                questions_remaining=0,
                field_updated=field_updated,
                field_old_value=old_value,
                field_new_value=new_value,
            )

        # 9. Check if max questions reached
        if new_count >= session["max_questions"]:
            await self._complete_session(session_id, AISessionStatus.MANUAL, gate_result)
            return AITurnResponse(
                session_id=session_id,
                turn_index=turn_index,
                session_status=AISessionStatus.MANUAL,
                gate_status=GateStatus.MANUAL.value,
                routing_result=RoutingResult.MANUAL.value,
                message=get_routing_message(RoutingResult.MANUAL),
                questions_remaining=0,
                field_updated=field_updated,
                field_old_value=old_value,
                field_new_value=new_value,
            )

        # 10. Generate next question
        triggers = [AITriggerReason(t) for t in session["trigger_reasons"]]
        issues = self._triggers_to_issues(triggers, form)
        previous_turns = await self._get_all_turns(session_id)

        next_question = await self._generate_question(
            session=session,
            form=form,
            issues=issues,
            previous_turns=previous_turns,
        )

        # 11. Create next turn
        await self._create_turn(session_id, new_count, next_question)

        return AITurnResponse(
            session_id=session_id,
            turn_index=turn_index,
            session_status=AISessionStatus.ACTIVE,
            next_question=next_question,
            questions_remaining=session["max_questions"] - new_count,
            field_updated=field_updated,
            field_old_value=old_value,
            field_new_value=new_value,
        )

    async def get_session_state(self, session_id: str) -> Optional[dict]:
        """Get current state of an AI session for resume."""
        session = await self._get_session(session_id)
        if not session:
            return None

        # Get current turn if session is active
        current_question = None
        if session["status"] == "active":
            turn = await self._get_turn(session_id, session["question_count"])
            if turn and not turn.get("answered_at"):
                current_question = self._turn_to_question(turn)

        return {
            "session_id": session_id,
            "status": session["status"],
            "trigger_reasons": session["trigger_reasons"],
            "question_count": session["question_count"],
            "max_questions": session["max_questions"],
            "questions_remaining": session["max_questions"] - session["question_count"],
            "current_question": current_question,
            "field_updates": session.get("field_updates", {}),
            "expires_at": session["expires_at"],
        }

    # =========================================================================
    # TRIGGER DETECTION
    # =========================================================================

    def _detect_rule_based_triggers(self, form: IntakeFormRequest) -> list[AITriggerReason]:
        """Detect triggers using deterministic rules."""
        triggers = []

        # Ambiguity triggers
        if form.service_type == ServiceType.UNCLEAR:
            triggers.append(AITriggerReason.AMBIGUITY)
        if form.budget_range == BudgetRange.UNSURE:
            triggers.append(AITriggerReason.AMBIGUITY)
        if form.access_model == AccessModel.UNSURE:
            triggers.append(AITriggerReason.AMBIGUITY)

        # IC/Other without decision-maker status
        if form.role_title in (RoleTitle.IC_ENGINEER, RoleTitle.OTHER):
            is_decision_maker = None
            if form.answers_raw:
                is_decision_maker = form.answers_raw.is_decision_maker
            if is_decision_maker is None:
                triggers.append(AITriggerReason.AMBIGUITY)

        # Context too short
        if len(form.context_raw) < self.settings.gate_min_context_length:
            triggers.append(AITriggerReason.AMBIGUITY)

        return list(set(triggers))

    async def _detect_llm_triggers(self, form: IntakeFormRequest) -> TriggerAnalysisResult:
        """Use LLM to detect contradictions and budget/scope mismatches."""
        if not self.model:
            return TriggerAnalysisResult(
                has_triggers=False,
                llm_available=False,
                llm_error="Gemini API key not configured",
            )

        try:
            # Get decision maker status
            is_decision_maker = None
            if form.answers_raw:
                is_decision_maker = form.answers_raw.is_decision_maker

            prompt = TRIGGER_DETECTION_USER.format(
                name=form.name,
                role_title=form.role_title.value,
                is_decision_maker=is_decision_maker,
                service_type=form.service_type.value,
                context_raw=form.context_raw,
                timeline=form.timeline.value,
                budget_range=form.budget_range.value,
                access_model=form.access_model.value,
            )

            response = self.model.generate_content(
                [
                    {"role": "user", "parts": [TRIGGER_DETECTION_SYSTEM]},
                    {"role": "model", "parts": ["I understand. I'll analyze the form and return JSON only."]},
                    {"role": "user", "parts": [prompt]},
                ],
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.3,  # Lower temperature for more deterministic responses
                },
            )

            result = json.loads(response.text)
            triggers = []
            issues = []

            if result.get("has_issues"):
                for issue in result.get("issues", []):
                    confidence = issue.get("confidence", 0.5)
                    if confidence < 0.7:
                        continue  # Skip low-confidence issues

                    issue_type = issue.get("type", "").lower()
                    if issue_type == "contradiction":
                        triggers.append(AITriggerReason.CONTRADICTION)
                        issues.append(DetectedIssue(
                            trigger_type=AITriggerReason.CONTRADICTION,
                            field=issue.get("field"),
                            description=issue.get("description", ""),
                            priority=2,
                            confidence=confidence,
                        ))
                    elif issue_type == "budget_scope_mismatch":
                        triggers.append(AITriggerReason.BUDGET_SCOPE_MISMATCH)
                        issues.append(DetectedIssue(
                            trigger_type=AITriggerReason.BUDGET_SCOPE_MISMATCH,
                            field="budget_range",
                            description=issue.get("description", ""),
                            priority=1,
                            confidence=confidence,
                        ))

            return TriggerAnalysisResult(
                has_triggers=len(triggers) > 0,
                triggers=list(set(triggers)),
                issues=issues,
                llm_available=True,
            )

        except Exception as e:
            print(f"LLM trigger detection error: {e}")
            return TriggerAnalysisResult(
                has_triggers=False,
                llm_available=False,
                llm_error=str(e),
            )

    # =========================================================================
    # QUESTION GENERATION
    # =========================================================================

    async def _generate_question(
        self,
        session: dict,
        form: IntakeFormRequest,
        issues: list[DetectedIssue],
        previous_turns: list[dict],
    ) -> AIQuestion:
        """Generate the next clarifying question using LLM or fallback."""
        # Try LLM first
        if self.model:
            try:
                return await self._generate_question_llm(session, form, issues, previous_turns)
            except Exception as e:
                print(f"LLM question generation error: {e}")

        # Fallback to deterministic questions
        return self._get_fallback_question(form, issues, previous_turns)

    async def _generate_question_llm(
        self,
        session: dict,
        form: IntakeFormRequest,
        issues: list[DetectedIssue],
        previous_turns: list[dict],
    ) -> AIQuestion:
        """Generate question using LLM."""
        # Build form state dict
        form_state = {
            "service_type": form.service_type.value,
            "budget_range": form.budget_range.value,
            "timeline": form.timeline.value,
            "access_model": form.access_model.value,
            "context_raw": form.context_raw[:500],  # Truncate for prompt
            "role_title": form.role_title.value,
        }

        # Build issues list
        issues_list = [
            {"type": i.trigger_type.value, "field": i.field, "description": i.description}
            for i in issues
        ]

        # Build previous answers
        previous_answers = []
        for turn in previous_turns:
            if turn.get("answer_text"):
                previous_answers.append({
                    "question": turn["question_text"],
                    "answer": turn["answer_text"],
                    "field_updated": turn.get("target_field"),
                })

        prompt = QUESTION_GENERATION_USER.format(
            form_state=json.dumps(form_state, indent=2),
            issues=json.dumps(issues_list, indent=2),
            questions_asked=session.get("question_count", 0),
            questions_remaining=session.get("max_questions", 3) - session.get("question_count", 0),
            previous_answers=json.dumps(previous_answers, indent=2) if previous_answers else "None",
        )

        response = self.model.generate_content(
            [
                {"role": "user", "parts": [QUESTION_GENERATION_SYSTEM]},
                {"role": "model", "parts": ["I understand. I'll generate the most important clarifying question."]},
                {"role": "user", "parts": [prompt]},
            ],
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.5,  # Slightly higher for more natural questions
            },
        )

        result = json.loads(response.text)

        # Parse options if present
        options = None
        if result.get("options"):
            options = [
                QuestionOption(
                    value=opt["value"],
                    label=opt["label"],
                    description=opt.get("description"),
                    maps_to_field=opt.get("maps_to_field"),
                    maps_to_value=opt.get("maps_to_value"),
                )
                for opt in result["options"]
            ]

        return AIQuestion(
            question_text=result["question_text"],
            question_type=AIQuestionType(result.get("question_type", "single_choice")),
            question_purpose=result.get("question_purpose"),
            options=options,
            target_field=result.get("target_field"),
        )

    def _get_fallback_question(
        self,
        form: IntakeFormRequest,
        issues: list[DetectedIssue],
        previous_turns: list[dict],
    ) -> AIQuestion:
        """Get deterministic fallback question when LLM fails."""
        # Track which fields have already been asked
        asked_fields = {turn.get("target_field") for turn in previous_turns if turn.get("target_field")}

        # Priority order: budget_range > service_type > access_model > context_raw
        priority_fields = ["budget_range", "service_type", "access_model", "context_raw"]

        # Check which fields need clarification
        needs_clarification = {
            "budget_range": form.budget_range == BudgetRange.UNSURE or any(
                i.trigger_type == AITriggerReason.BUDGET_SCOPE_MISMATCH for i in issues
            ),
            "service_type": form.service_type == ServiceType.UNCLEAR,
            "access_model": form.access_model == AccessModel.UNSURE,
            "context_raw": len(form.context_raw) < self.settings.gate_min_context_length,
        }

        # Find first unasked field that needs clarification
        for field in priority_fields:
            if needs_clarification.get(field) and field not in asked_fields:
                fallback = FALLBACK_QUESTIONS.get(field)
                if fallback:
                    options = None
                    if fallback.get("options"):
                        options = [
                            QuestionOption(
                                value=opt["value"],
                                label=opt["label"],
                                description=opt.get("description"),
                                maps_to_field=opt.get("maps_to_field"),
                                maps_to_value=opt.get("maps_to_value"),
                            )
                            for opt in fallback["options"]
                        ]
                    return AIQuestion(
                        question_text=fallback["question_text"],
                        question_type=AIQuestionType(fallback["question_type"]),
                        question_purpose=fallback.get("question_purpose"),
                        options=options,
                        target_field=fallback.get("target_field"),
                    )

        # Ultimate fallback: context clarification
        return AIQuestion(
            question_text="Could you tell me more about your project?",
            question_type=AIQuestionType.TEXT,
            question_purpose="Helps us understand your needs better",
            target_field="context_raw",
        )

    # =========================================================================
    # SESSION MANAGEMENT
    # =========================================================================

    async def _create_session(
        self,
        inquiry_id: str,
        triggers: list[AITriggerReason],
        provisional_gate_status: GateStatus,
    ) -> dict:
        """Create a new AI clarification session."""
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=self.settings.ai_session_ttl_minutes)

        session_data = {
            "inquiry_id": inquiry_id,
            "status": AISessionStatus.ACTIVE.value,
            "trigger_reasons": [t.value for t in triggers],
            "question_count": 0,
            "max_questions": self.settings.ai_max_questions,
            "provisional_gate_status": provisional_gate_status.value,
            "expires_at": expires_at.isoformat(),
        }

        result = self.supabase.client.table("ai_sessions").insert(session_data).execute()
        return result.data[0]

    async def _get_session(self, session_id: str) -> Optional[dict]:
        """Get an AI session by ID."""
        result = self.supabase.client.table("ai_sessions").select("*").eq("id", session_id).execute()
        return result.data[0] if result.data else None

    async def _update_session(self, session_id: str, updates: dict) -> None:
        """Update session fields."""
        self.supabase.client.table("ai_sessions").update(updates).eq("id", session_id).execute()

    async def _complete_session(
        self,
        session_id: str,
        status: AISessionStatus,
        gate_result: GateEvaluationResult,
    ) -> None:
        """Complete a session and build final output."""
        # Get all turns for this session
        turns = await self._get_all_turns(session_id)

        # Build clarifications from turns with field updates
        clarifications = []
        for turn in turns:
            if turn.get("field_updated") and turn.get("target_field"):
                clarifications.append(FieldUpdate(
                    field=turn["target_field"],
                    old_value=turn.get("old_field_value"),
                    new_value=turn.get("new_field_value"),
                    turn_index=turn["turn_index"],
                    user_confirmed=True,
                    trigger_reason="user_clarification",
                ).model_dump())

        # Build final output
        final_output = FinalOutput(
            clarifications=clarifications,
            intelligence_gathered={},
            ai_pre_call_notes={
                "session_status": status.value,
                "questions_asked": len(turns),
                "final_gate_status": gate_result.gate_status.value,
                "final_routing": gate_result.routing_result.value,
            },
        )

        await self._update_session(session_id, {
            "status": status.value,
            "latest_gate_status": gate_result.gate_status.value,
            "latest_routing_result": gate_result.routing_result.value,
            "final_output": final_output.model_dump(),
        })

    # =========================================================================
    # TURN MANAGEMENT
    # =========================================================================

    async def _create_turn(self, session_id: str, turn_index: int, question: AIQuestion) -> dict:
        """Create a new turn record."""
        turn_data = {
            "session_id": session_id,
            "turn_index": turn_index,
            "question_text": question.question_text,
            "question_type": question.question_type.value,
            "question_purpose": question.question_purpose,
            "options": [opt.model_dump() for opt in question.options] if question.options else None,
            "target_field": question.target_field,
            "llm_model": self.settings.gemini_model if self.model else None,
        }

        result = self.supabase.client.table("ai_turns").insert(turn_data).execute()
        return result.data[0]

    async def _get_turn(self, session_id: str, turn_index: int) -> Optional[dict]:
        """Get a specific turn by session ID and index."""
        result = (
            self.supabase.client.table("ai_turns")
            .select("*")
            .eq("session_id", session_id)
            .eq("turn_index", turn_index)
            .execute()
        )
        return result.data[0] if result.data else None

    async def _get_all_turns(self, session_id: str) -> list[dict]:
        """Get all turns for a session, ordered by turn_index."""
        result = (
            self.supabase.client.table("ai_turns")
            .select("*")
            .eq("session_id", session_id)
            .order("turn_index")
            .execute()
        )
        return result.data or []

    async def _update_turn_answer(self, turn_id: str, answer_value: Any, turn: dict) -> None:
        """Update turn with user's answer."""
        # Determine answer_text based on answer type
        answer_text = str(answer_value)

        # If it's a choice question, find the label for the selected value
        if turn.get("options"):
            for opt in turn["options"]:
                if opt.get("value") == answer_value:
                    answer_text = opt.get("label", str(answer_value))
                    break

        self.supabase.client.table("ai_turns").update({
            "answer_value": answer_value if isinstance(answer_value, (dict, list)) else {"value": answer_value},
            "answer_text": answer_text,
            "answered_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", turn_id).execute()

    async def _apply_field_update(
        self,
        session: dict,
        turn: dict,
        answer_value: Any,
    ) -> tuple[Optional[str], Any, Any]:
        """Apply field update to inquiry if applicable.

        Returns:
            Tuple of (field_updated, old_value, new_value) or (None, None, None)
        """
        # Check if this answer maps to a field update
        if not turn.get("options"):
            # Text answer - might update context_raw
            if turn.get("target_field") == "context_raw" and isinstance(answer_value, str):
                inquiry = await self.supabase.get_inquiry(session["inquiry_id"])
                old_value = inquiry.get("context_raw", "")
                new_value = old_value + "\n\n" + answer_value if old_value else answer_value

                await self.supabase.update_inquiry(session["inquiry_id"], {"context_raw": new_value})

                # Update turn record
                self.supabase.client.table("ai_turns").update({
                    "field_updated": True,
                    "old_field_value": old_value,
                    "new_field_value": new_value,
                }).eq("id", turn["id"]).execute()

                # Update session field_updates
                field_updates = session.get("field_updates", {})
                field_updates["context_raw"] = {
                    "old": old_value,
                    "new": new_value,
                    "turn_index": turn["turn_index"],
                }
                await self._update_session(session["id"], {"field_updates": field_updates})

                return "context_raw", old_value, new_value

            return None, None, None

        # Choice question - find the selected option
        selected_option = None
        for opt in turn["options"]:
            if opt.get("value") == answer_value:
                selected_option = opt
                break

        if not selected_option:
            return None, None, None

        # Check if this option updates a field
        maps_to_field = selected_option.get("maps_to_field")
        maps_to_value = selected_option.get("maps_to_value")

        if not maps_to_field or maps_to_value is None:
            # "Keep current selection" or similar - no update
            return None, None, None

        # Get current value
        inquiry = await self.supabase.get_inquiry(session["inquiry_id"])
        old_value = inquiry.get(maps_to_field)

        # Update inquiry
        await self.supabase.update_inquiry(session["inquiry_id"], {maps_to_field: maps_to_value})

        # Update turn record
        self.supabase.client.table("ai_turns").update({
            "field_updated": True,
            "old_field_value": old_value,
            "new_field_value": maps_to_value,
        }).eq("id", turn["id"]).execute()

        # Update session field_updates
        field_updates = session.get("field_updates", {})
        field_updates[maps_to_field] = {
            "old": old_value,
            "new": maps_to_value,
            "turn_index": turn["turn_index"],
        }
        await self._update_session(session["id"], {"field_updates": field_updates})

        # Log budget upgrade if applicable
        if maps_to_field == "budget_range":
            budget_order = {"under_10k": 0, "10k_25k": 1, "25k_50k": 2, "over_50k": 3, "unsure": 0}
            if budget_order.get(maps_to_value, 0) > budget_order.get(old_value, 0):
                # This is a budget upgrade - could add a note to inquiry
                pass

        return maps_to_field, old_value, maps_to_value

    # =========================================================================
    # HELPER METHODS
    # =========================================================================

    def _triggers_to_issues(
        self,
        triggers: list[AITriggerReason],
        form: IntakeFormRequest,
    ) -> list[DetectedIssue]:
        """Convert trigger list to issue list for question generation."""
        issues = []

        if AITriggerReason.AMBIGUITY in triggers:
            if form.service_type == ServiceType.UNCLEAR:
                issues.append(DetectedIssue(
                    trigger_type=AITriggerReason.AMBIGUITY,
                    field="service_type",
                    description="User unsure of service type",
                    priority=2,
                ))
            if form.budget_range == BudgetRange.UNSURE:
                issues.append(DetectedIssue(
                    trigger_type=AITriggerReason.AMBIGUITY,
                    field="budget_range",
                    description="User unsure of budget",
                    priority=1,
                ))
            if form.access_model == AccessModel.UNSURE:
                issues.append(DetectedIssue(
                    trigger_type=AITriggerReason.AMBIGUITY,
                    field="access_model",
                    description="User unsure of access model",
                    priority=2,
                ))
            if len(form.context_raw) < self.settings.gate_min_context_length:
                issues.append(DetectedIssue(
                    trigger_type=AITriggerReason.AMBIGUITY,
                    field="context_raw",
                    description="Context too brief",
                    priority=3,
                ))

        if AITriggerReason.CONTRADICTION in triggers:
            issues.append(DetectedIssue(
                trigger_type=AITriggerReason.CONTRADICTION,
                field=None,
                description="Potential conflict between form answers and context",
                priority=2,
            ))

        if AITriggerReason.BUDGET_SCOPE_MISMATCH in triggers:
            issues.append(DetectedIssue(
                trigger_type=AITriggerReason.BUDGET_SCOPE_MISMATCH,
                field="budget_range",
                description="Project scope may exceed stated budget",
                priority=1,
            ))

        # Sort by priority (lower = higher priority)
        issues.sort(key=lambda x: x.priority)
        return issues

    def _inquiry_to_form(self, inquiry: dict) -> IntakeFormRequest:
        """Convert inquiry dict back to IntakeFormRequest for re-gating."""
        from app.schemas.intake import AnswersRaw

        answers_raw = None
        if inquiry.get("answers_raw") and inquiry["answers_raw"].get("extended"):
            ext = inquiry["answers_raw"]["extended"]
            answers_raw = AnswersRaw(
                company_name=ext.get("company_name"),
                is_decision_maker=ext.get("is_decision_maker"),
                audit_symptoms=ext.get("audit_symptoms"),
                project_subtype=ext.get("project_subtype"),
                project_state=ext.get("project_state"),
                rag_issues=ext.get("rag_issues"),
                advisory_questions=ext.get("advisory_questions"),
                desired_outcome=ext.get("desired_outcome"),
            )

        return IntakeFormRequest(
            name=inquiry["name"],
            email=inquiry["email"],
            role_title=RoleTitle(inquiry["role_title"]),
            service_type=ServiceType(inquiry["service_type"]),
            context_raw=inquiry["context_raw"],
            access_model=AccessModel(inquiry["access_model"]),
            timeline=inquiry["timeline"],
            budget_range=BudgetRange(inquiry["budget_range"]),
            answers_raw=answers_raw,
        )

    def _turn_to_question(self, turn: dict) -> AIQuestion:
        """Convert turn dict to AIQuestion."""
        options = None
        if turn.get("options"):
            options = [
                QuestionOption(
                    value=opt["value"],
                    label=opt["label"],
                    description=opt.get("description"),
                    maps_to_field=opt.get("maps_to_field"),
                    maps_to_value=opt.get("maps_to_value"),
                )
                for opt in turn["options"]
            ]

        return AIQuestion(
            question_text=turn["question_text"],
            question_type=AIQuestionType(turn["question_type"]),
            question_purpose=turn.get("question_purpose"),
            options=options,
            target_field=turn.get("target_field"),
        )


# ============================================================================
# SINGLETON
# ============================================================================

_ai_assistant: Optional[AIAssistantService] = None


def get_ai_assistant() -> AIAssistantService:
    """Get cached AI assistant service instance."""
    global _ai_assistant
    if _ai_assistant is None:
        _ai_assistant = AIAssistantService()
    return _ai_assistant
