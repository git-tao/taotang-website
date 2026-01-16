import React, { useEffect, useRef } from 'react';
import { CaseStudy } from '../data/caseStudies';
import TechBadge from './TechBadge';

interface CaseStudyModalProps {
  study: CaseStudy | null;
  isOpen: boolean;
  onClose: () => void;
}

const CaseStudyModal: React.FC<CaseStudyModalProps> = ({ study, isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap and scroll to top when opening
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen, study]);

  if (!study) return null;

  // Parse markdown-style bold text
  const parseText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-semibold text-[#212529]">{part}</strong> : part
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 transition-all duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop with blur - clicking does NOT close */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        ref={modalRef}
        className={`relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Close button - only way to close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#6C757D] hover:text-[#212529] shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable content */}
        <div ref={contentRef} className="overflow-y-auto max-h-[90vh] p-8 md:p-12">
          {/* Header */}
          <header className="mb-10">
            <span className="inline-block text-xs font-bold text-[#FFBF00] uppercase tracking-widest mb-3">
              {study.category}
            </span>
            <h2 id="modal-title" className="text-3xl md:text-4xl font-bold text-[#212529] mb-2">
              {study.title}
            </h2>
            <p className="text-lg md:text-xl text-[#6C757D] mb-6">
              {study.subtitle}
            </p>

            {/* Impact metrics */}
            <div className="grid grid-cols-3 gap-4">
              {study.impact.map((metric, i) => (
                <div key={i} className="bg-[#F8F9FA] rounded-xl p-4 text-center">
                  <div className="text-xl md:text-2xl font-bold text-[#FFBF00]">{metric.value}</div>
                  <div className="text-xs text-[#6C757D] uppercase tracking-wide mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          </header>

          {/* Tech Stack with logos */}
          <section className="mb-10">
            <h3 className="text-sm font-bold text-[#212529] uppercase tracking-widest mb-4">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {study.technologies.map(tech => (
                <TechBadge key={tech} name={tech} />
              ))}
            </div>
          </section>

          {/* The Problem */}
          <section className="mb-10">
            <h3 className="text-xl font-bold text-[#212529] mb-4">The Problem</h3>
            <p className="text-[#495057] leading-relaxed">
              {study.fullContent.problem}
            </p>
          </section>

          {/* The Architecture */}
          <section className="mb-10">
            <h3 className="text-xl font-bold text-[#212529] mb-4">The Architecture</h3>
            <div className="space-y-4">
              {study.fullContent.architecture.map((item, i) => (
                <div key={i} className="pl-4 border-l-2 border-[#FFBF00]">
                  <p className="text-[#495057] leading-relaxed">{parseText(item)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Engineering Trade-offs */}
          <section className="mb-6">
            <h3 className="text-xl font-bold text-[#212529] mb-4">Engineering Trade-offs</h3>
            <div className="space-y-4">
              {study.fullContent.tradeoffs.map((item, i) => (
                <div key={i} className="bg-[#F8F9FA] rounded-lg p-4">
                  <p className="text-[#495057] leading-relaxed">{parseText(item)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyModal;
