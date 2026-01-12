/**
 * QuestionCard - Individual clarification question card
 * Renders single-choice options, text input, or confirmation buttons
 */

import React, { useState } from 'react';
import { AIQuestion, QuestionOption } from '../types';

interface QuestionCardProps {
  question: AIQuestion;
  onAnswer: (value: string) => void;
  isSubmitting: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  isSubmitting,
}) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');

  const handleSubmit = () => {
    if (question.question_type === 'text') {
      onAnswer(textValue.trim());
    } else if (question.question_type === 'confirmation') {
      onAnswer(selectedValue || 'no');
    } else {
      if (selectedValue) {
        onAnswer(selectedValue);
      }
    }
  };

  const canSubmit = (() => {
    if (isSubmitting) return false;
    if (question.question_type === 'text') {
      return textValue.trim().length > 0;
    }
    return selectedValue !== null;
  })();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-[#E9ECEF]">
      {/* Question purpose (helper text) */}
      {question.question_purpose && (
        <p className="text-xs text-[#6C757D] mb-3 uppercase tracking-wide">
          {question.question_purpose}
        </p>
      )}

      {/* Question text */}
      <h3 className="text-lg sm:text-xl font-semibold text-[#212529] mb-6 leading-relaxed">
        {question.question_text}
      </h3>

      {/* Single choice options */}
      {question.question_type === 'single_choice' && question.options && (
        <div className="space-y-3 mb-6">
          {question.options.map((option: QuestionOption) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedValue(option.value)}
              disabled={isSubmitting}
              className={`
                w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                ${selectedValue === option.value
                  ? 'border-[#FFBF00] bg-amber-50 ring-2 ring-[#FFBF00]/20'
                  : 'border-[#E9ECEF] hover:border-[#FFBF00]/50 hover:bg-gray-50'
                }
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Radio indicator */}
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5
                    flex items-center justify-center transition-all
                    ${selectedValue === option.value
                      ? 'border-[#FFBF00] bg-[#FFBF00]'
                      : 'border-[#ADB5BD]'
                    }
                  `}
                >
                  {selectedValue === option.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-[#212529] block">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-sm text-[#6C757D] mt-1 block">
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Text input */}
      {question.question_type === 'text' && (
        <div className="mb-6">
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Type your answer here..."
            disabled={isSubmitting}
            className={`
              w-full p-4 border-2 border-[#E9ECEF] rounded-xl resize-none
              focus:outline-none focus:border-[#FFBF00] focus:ring-2 focus:ring-[#FFBF00]/20
              transition-all duration-200 text-[#212529] placeholder-[#ADB5BD]
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            rows={4}
          />
          <p className="text-xs text-[#6C757D] mt-2">
            {textValue.length > 0 ? `${textValue.length} characters` : 'Be as detailed as you like'}
          </p>
        </div>
      )}

      {/* Confirmation buttons */}
      {question.question_type === 'confirmation' && (
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedValue('yes')}
            disabled={isSubmitting}
            className={`
              flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all
              ${selectedValue === 'yes'
                ? 'border-[#FFBF00] bg-amber-50 text-[#212529]'
                : 'border-[#E9ECEF] text-[#6C757D] hover:border-[#FFBF00]/50'
              }
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setSelectedValue('no')}
            disabled={isSubmitting}
            className={`
              flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all
              ${selectedValue === 'no'
                ? 'border-[#FFBF00] bg-amber-50 text-[#212529]'
                : 'border-[#E9ECEF] text-[#6C757D] hover:border-[#FFBF00]/50'
              }
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            No
          </button>
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`
          w-full py-4 rounded-xl font-bold text-base transition-all duration-200
          ${canSubmit
            ? 'bg-[#FFBF00] text-[#212529] hover:bg-[#E6AC00] active:scale-[0.98]'
            : 'bg-[#E9ECEF] text-[#ADB5BD] cursor-not-allowed'
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          'Continue'
        )}
      </button>
    </div>
  );
};

export default QuestionCard;
