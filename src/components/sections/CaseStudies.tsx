import React from 'react';

const CaseStudies: React.FC = () => {
  return (
    <section id="case-studies" className="section-padding px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#212529] mb-16">Case Studies</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <a href="#" className="card-hover group p-10 rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] flex flex-col justify-between hover:border-[#FFBF00] hover:shadow-[0_8px_24px_rgba(255,191,0,0.15)] transition-all">
            <div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-[#212529]">CompliantPhotos.com</h3>
                <svg className="w-6 h-6 text-[#E9ECEF] group-hover:text-[#FFBF00] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <p className="text-base text-[#212529] leading-relaxed font-light mb-4">
                Architected and deployed an end-to-end vision AI system for passport photo regulatory compliance. Automated 90% of manual quality control with sub-second latency.
              </p>
            </div>
            <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-widest mt-4">Full Stack AI System</span>
          </a>
          
          <a href="#" className="card-hover group p-10 rounded-xl border border-[#E9ECEF] bg-[#F8F9FA] flex flex-col justify-between hover:border-[#FFBF00] hover:shadow-[0_8px_24px_rgba(255,191,0,0.15)] transition-all">
            <div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-[#212529]">Agent Orchestration</h3>
                <svg className="w-6 h-6 text-[#E9ECEF] group-hover:text-[#FFBF00] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <p className="text-base text-[#212529] leading-relaxed font-light mb-4">
                Led the engineering of a high-concurrency autonomous agent platform at Meta. Scaled to thousands of concurrent dynamic tool-use workflows with guaranteed state consistency.
              </p>
            </div>
            <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-widest mt-4">Infrastructure & Scale</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;