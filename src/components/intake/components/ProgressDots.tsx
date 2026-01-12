/**
 * ProgressDots - Visual indicator for AI clarification progress
 * Shows dots representing questions asked vs remaining
 */

import React from 'react';

interface ProgressDotsProps {
  current: number;      // Questions answered (0-indexed, so 0 = first question showing)
  total: number;        // Total max questions
  className?: string;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({ current, total, className = '' }) => {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }, (_, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;

        return (
          <div
            key={index}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${isCompleted
                ? 'bg-[#FFBF00] scale-100'
                : isCurrent
                  ? 'bg-[#FFBF00] scale-125 ring-2 ring-[#FFBF00]/30'
                  : 'bg-[#E9ECEF]'
              }
            `}
            aria-label={
              isCompleted
                ? `Question ${index + 1} completed`
                : isCurrent
                  ? `Question ${index + 1} current`
                  : `Question ${index + 1} pending`
            }
          />
        );
      })}
    </div>
  );
};

export default ProgressDots;
