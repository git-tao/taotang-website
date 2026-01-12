"""API endpoints for AI clarification flow."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.ai_assistant import (
    AISessionStateResponse,
    AITurnResponse,
    ClarifyAnswerRequest,
    SessionKeepAliveRequest,
)
from app.services.ai_assistant import get_ai_assistant

router = APIRouter(prefix="/api/intake", tags=["ai-clarify"])


@router.post("/clarify", response_model=AITurnResponse)
async def submit_clarification_answer(request: ClarifyAnswerRequest) -> AITurnResponse:
    """Submit an answer to a clarification question.

    This endpoint processes the user's answer to a clarification question
    and returns either:
    - The next question (if more clarification needed)
    - The final routing result (if session resolved or max questions reached)

    Args:
        request: Contains session_id, turn_index, and answer_value

    Returns:
        AITurnResponse with next_question or final gate_status/routing_result

    Raises:
        400: Invalid session, already answered, or validation error
        404: Session or turn not found
        500: Internal error (routes to manual review)
    """
    ai_service = get_ai_assistant()

    try:
        return await ai_service.process_answer(
            session_id=request.session_id,
            turn_index=request.turn_index,
            answer_value=request.answer_value,
        )
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    except Exception as e:
        print(f"Clarification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred. Please try again or contact us directly.",
        )


@router.get("/session/{session_id}", response_model=AISessionStateResponse)
async def get_session_state(session_id: str) -> AISessionStateResponse:
    """Get current state of an AI clarification session.

    Used for resuming interrupted sessions. Returns the current question
    if the session is still active.

    Args:
        session_id: The AI session ID

    Returns:
        AISessionStateResponse with session state and current question

    Raises:
        404: Session not found
        410: Session expired
    """
    ai_service = get_ai_assistant()

    session_state = await ai_service.get_session_state(session_id)

    if not session_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Check if expired
    if session_state["status"] == "expired":
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Session has expired. Please submit the form again.",
        )

    return AISessionStateResponse(
        session_id=session_state["session_id"],
        status=session_state["status"],
        trigger_reasons=session_state["trigger_reasons"],
        question_count=session_state["question_count"],
        max_questions=session_state["max_questions"],
        questions_remaining=session_state["questions_remaining"],
        current_question=session_state.get("current_question"),
        field_updates=session_state.get("field_updates", {}),
        expires_at=session_state["expires_at"],
    )


@router.post("/session/{session_id}/keepalive")
async def keep_session_alive(session_id: str, request: SessionKeepAliveRequest) -> dict:
    """Keep a session alive while the user is thinking.

    Extends the session TTL by resetting the idle timer.
    Should be called periodically (e.g., every 5 minutes) while
    the user is actively on the clarification page.

    Args:
        session_id: The AI session ID
        request: Keep-alive request body

    Returns:
        {"status": "ok", "expires_at": "..."}

    Raises:
        404: Session not found
        400: Session already completed
    """
    ai_service = get_ai_assistant()

    session_state = await ai_service.get_session_state(session_id)

    if not session_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    if session_state["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot extend {session_state['status']} session",
        )

    # Extend TTL
    from datetime import datetime, timedelta, timezone
    from app.config import get_settings

    settings = get_settings()
    new_expires = datetime.now(timezone.utc) + timedelta(minutes=settings.ai_session_ttl_minutes)

    await ai_service._update_session(session_id, {"expires_at": new_expires.isoformat()})

    return {"status": "ok", "expires_at": new_expires.isoformat()}
