/**
 * ClarificationFlow - Main AI Q&A orchestrator
 * Manages the clarification session, displaying one question at a time
 */

import React, { useState, useEffect } from 'react';
import { AIQuestion, AITurnResponse, GateStatus, RoutingResult } from '../types';
import QuestionCard from './QuestionCard';
import ProgressDots from './ProgressDots';

const API_URL = import.meta.env.VITE_API_URL || 'https://taotang-api.onrender.com';

interface ClarificationFlowProps {
  sessionId: string;
  initialQuestion: AIQuestion;
  maxQuestions: number;
  onComplete: (result: {
    gate_status: GateStatus;
    routing_result: RoutingResult;
    message: string;
  }) => void;
  onError: (error: string) => void;
}

const ClarificationFlow: React.FC<ClarificationFlowProps> = ({
  sessionId,
  initialQuestion,
  maxQuestions,
  onComplete,
  onError,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion>(initialQuestion);
  const [turnIndex, setTurnIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [animationState, setAnimationState] = useState<'visible' | 'exiting' | 'entering'>('visible');

  // Keep-alive interval to prevent session expiration
  useEffect(() => {
    const keepAlive = setInterval(async () => {
      try {
        await fetch(`${API_URL}/api/intake/session/${sessionId}/keepalive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch (e) {
        console.warn('Keep-alive failed:', e);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(keepAlive);
  }, [sessionId]);

  const handleAnswer = async (answerValue: string) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/intake/clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          turn_index: turnIndex,
          answer_value: answerValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Handle both array (Pydantic) and string error details
        let errorMessage = 'Failed to submit answer';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail[0]?.msg || errorMessage;
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
        }
        throw new Error(errorMessage);
      }

      const result: AITurnResponse = await response.json();

      // Check if session is complete
      if (result.session_status === 'resolved' || result.session_status === 'manual') {
        // Session complete - trigger completion callback
        onComplete({
          gate_status: (result.gate_status || 'manual') as GateStatus,
          routing_result: (result.routing_result || 'manual') as RoutingResult,
          message: result.message || 'Thank you for your responses.',
        });
        return;
      }

      // More questions to ask
      if (result.next_question) {
        // Animate transition to next question
        setAnimationState('exiting');

        setTimeout(() => {
          setCurrentQuestion(result.next_question!);
          setTurnIndex(turnIndex + 1);
          setQuestionsAnswered(questionsAnswered + 1);
          setAnimationState('entering');

          setTimeout(() => {
            setAnimationState('visible');
          }, 300);
        }, 200);
      }
    } catch (error) {
      console.error('Clarification error:', error);
      onError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#212529] mb-2">
          A Few Quick Questions
        </h2>
        <p className="text-sm text-[#6C757D]">
          Help us understand your needs better
        </p>
      </div>

      {/* Progress indicator */}
      <ProgressDots
        current={questionsAnswered}
        total={maxQuestions}
        className="mb-6"
      />

      {/* Question card with animation */}
      <div
        className={`
          transition-all duration-200 ease-out
          ${animationState === 'exiting' ? 'opacity-0 scale-95 translate-y-2' : ''}
          ${animationState === 'entering' ? 'opacity-0 scale-95 -translate-y-2' : ''}
          ${animationState === 'visible' ? 'opacity-100 scale-100 translate-y-0' : ''}
        `}
      >
        <QuestionCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Questions remaining text */}
      <p className="text-xs text-[#ADB5BD] text-center mt-4">
        {maxQuestions - questionsAnswered > 1
          ? `${maxQuestions - questionsAnswered - 1} question${maxQuestions - questionsAnswered - 1 !== 1 ? 's' : ''} remaining`
          : 'Last question'}
      </p>
    </div>
  );
};

export default ClarificationFlow;
