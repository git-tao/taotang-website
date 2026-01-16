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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen, study]);

  if (!study) return null;

  // Parse markdown-style bold text and extract title
  const parseArchitectureItem = (text: string) => {
    // Extract the bold title at the start
    const titleMatch = text.match(/^\*\*(.*?)\*\*:?\s*/);
    if (titleMatch) {
      const title = titleMatch[1];
      const body = text.slice(titleMatch[0].length);
      return { title, body };
    }
    return { title: null, body: text };
  };

  const parseTradeoff = (text: string) => {
    const titleMatch = text.match(/^\*\*(.*?)\*\*:?\s*/);
    if (titleMatch) {
      const title = titleMatch[1];
      const body = text.slice(titleMatch[0].length);
      return { title, body };
    }
    return { title: null, body: text };
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 transition-all duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative w-full max-w-5xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-[#212529] hover:bg-[#343a40] text-white shadow-lg transition-all duration-200"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable content */}
        <div ref={contentRef} className="overflow-y-auto max-h-[92vh]">
          {/* Hero header with gradient */}
          <div className="bg-gradient-to-br from-[#212529] to-[#343a40] px-8 md:px-12 py-10 md:py-12">
            <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-widest">
              {study.category}
            </span>

            <h2 id="modal-title" className="text-3xl md:text-4xl font-bold text-white mt-4 mb-2">
              {study.title}
            </h2>
            <p className="text-lg text-white/80 mb-4">
              {study.subtitle}
            </p>

            {study.externalLink && (
              <a
                href={study.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#FFBF00] hover:text-[#FFD54F] transition-colors"
              >
                <span>{study.externalLink.replace('https://', '')}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {/* Impact metrics */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {study.impact.map((metric, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#FFBF00]">{metric.value}</div>
                  <div className="text-xs text-white/60 uppercase tracking-wide mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="px-8 md:px-12 py-8 md:py-10">
            {/* Tech Stack */}
            <section className="mb-10">
              <h3 className="text-sm font-bold text-[#6C757D] uppercase tracking-widest mb-4">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {study.technologies.map(tech => (
                  <TechBadge key={tech} name={tech} />
                ))}
              </div>
            </section>

            {/* The Problem */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-[#212529] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                The Problem
              </h3>
              <div className="text-[#495057] leading-relaxed space-y-4 pl-10">
                {study.fullContent.problem.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            {/* The Architecture */}
            <section className="mb-10">
              <h3 className="text-xl font-bold text-[#212529] mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                The Architecture
              </h3>
              <div className="space-y-4 pl-10">
                {study.fullContent.architecture.map((item, i) => {
                  const { title, body } = parseArchitectureItem(item);
                  return (
                    <div key={i} className="bg-[#F8F9FA] rounded-xl p-5">
                      {title && (
                        <h4 className="font-semibold text-[#212529] mb-2">{title}</h4>
                      )}
                      <p className="text-[#495057] leading-relaxed text-sm">{body}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Engineering Trade-offs */}
            <section>
              <h3 className="text-xl font-bold text-[#212529] mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </span>
                Engineering Trade-offs
              </h3>
              <div className="grid md:grid-cols-2 gap-4 pl-10">
                {study.fullContent.tradeoffs.map((item, i) => {
                  const { title, body } = parseTradeoff(item);
                  return (
                    <div key={i} className="border border-[#E9ECEF] rounded-xl p-5 hover:border-[#FFBF00] transition-colors">
                      {title && (
                        <h4 className="font-semibold text-[#212529] mb-2 text-sm">{title}</h4>
                      )}
                      <p className="text-[#6C757D] leading-relaxed text-sm">{body}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyModal;
