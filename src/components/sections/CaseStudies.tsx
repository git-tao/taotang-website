import React, { useState } from 'react';
import { caseStudies, CaseStudy } from '../../data/caseStudies';
import CaseStudyModal from '../CaseStudyModal';
import TechBadge from '../TechBadge';

const CaseStudies: React.FC = () => {
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (study: CaseStudy) => {
    setSelectedStudy(study);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Delay clearing the study to allow exit animation
    setTimeout(() => setSelectedStudy(null), 300);
  };

  return (
    <>
      <section id="case-studies" className="section-padding px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#212529] mb-12 animate-on-scroll">
            Past Projects
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caseStudies.map((study, index) => (
              <button
                key={study.slug}
                onClick={() => openModal(study)}
                className={`card-hover group block p-6 rounded-xl text-left animate-on-scroll stagger-${index + 1} transition-all duration-300`}
              >
                {/* Category badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-widest">
                    {study.category}
                  </span>
                  <svg
                    className="w-5 h-5 text-[#E9ECEF] group-hover:text-[#FFBF00] group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#212529] mb-2 group-hover:text-[#FFBF00] transition-colors">
                  {study.title}
                </h3>

                {/* Subtitle/tagline */}
                <p className="text-sm text-[#6C757D] mb-4 line-clamp-2">
                  {study.subtitle}
                </p>

                {/* Impact metrics - compact */}
                <div className="flex gap-4 mb-4">
                  {study.impact.slice(0, 2).map((metric, i) => (
                    <div key={i} className="text-center">
                      <div className="text-lg font-bold text-[#FFBF00]">{metric.value}</div>
                      <div className="text-[10px] text-[#6C757D] uppercase tracking-wide">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Tech stack with logos */}
                <div className="flex flex-wrap gap-1.5">
                  {study.technologies.slice(0, 4).map(tech => (
                    <TechBadge key={tech} name={tech} />
                  ))}
                  {study.technologies.length > 4 && (
                    <span className="inline-flex items-center px-2 py-1 bg-[#E9ECEF] rounded text-xs text-[#6C757D]">
                      +{study.technologies.length - 4} more
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      <CaseStudyModal
        study={selectedStudy}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
};

export default CaseStudies;
