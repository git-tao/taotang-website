import React from 'react';
import { Link } from 'react-router-dom';
import { caseStudies } from '../../data/caseStudies';

const CaseStudies: React.FC = () => {
  return (
    <section id="case-studies" className="section-padding px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#212529] mb-12 animate-on-scroll">
          Case Studies
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {caseStudies.map((study, index) => (
            <Link
              key={study.slug}
              to={`/case-study/${study.slug}`}
              className={`card-hover group block p-8 rounded-xl animate-on-scroll stagger-${index + 1}`}
            >
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
              <h3 className="text-xl font-bold text-[#212529] mb-3 group-hover:text-[#FFBF00] transition-colors">
                {study.title}
              </h3>
              <p className="text-[#6C757D] mb-4">{study.summary}</p>
              <div className="flex flex-wrap gap-2">
                {study.technologies.slice(0, 4).map(tech => (
                  <span key={tech} className="px-2 py-1 bg-[#E9ECEF] rounded text-xs text-[#212529]">
                    {tech}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
