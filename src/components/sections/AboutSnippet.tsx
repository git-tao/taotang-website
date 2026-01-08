import React from 'react';

const AboutSnippet: React.FC = () => {
  return (
    <section className="section-padding px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-[#212529] mb-12">A Hands-On Partner for Technical Leaders</h2>
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-lg text-[#212529] leading-relaxed font-light">
              I work as a focused, senior-level individual contributor to solve complex AI systems problems. My background includes shipping production systems at <span className="font-semibold text-[#212529]">Meta</span> and multiple venture-backed startups, combined with a foundational computer science education from <span className="font-semibold text-[#212529]">Stanford University</span>. I don't manage teams or engage in consulting theater; I build, audit, and stabilize systems.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-12 grayscale opacity-60">
            {/* Meta Logo */}
            <div className="h-8 flex items-center gap-2">
              <svg className="h-full w-auto text-[#212529]" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M17.5 12c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5 1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5zm-3.5-5.5c-3.04 0-5.5 2.46-5.5 5.5s2.46 5.5 5.5 5.5 5.5-2.46 5.5-5.5-2.46-5.5-5.5-5.5zm-6.5 5.5c0-1.93-1.57-3.5-3.5-3.5S.5 10.07.5 12s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5zm-3.5-5.5C1.46 6.5-1 8.96-1 12s2.46 5.5 5.5 5.5 5.5-2.46 5.5-5.5-2.46-5.5-5.5-5.5z" clipRule="evenodd" fillRule="evenodd"/>
              </svg>
              <span className="text-xl font-bold tracking-tighter text-[#212529]">Meta</span>
            </div>
            {/* Stanford */}
            <div className="h-8 flex items-center">
              <span className="text-xl font-bold tracking-tight text-[#212529]">Stanford University</span>
            </div>
            {/* Startup Icon */}
            <div className="h-8 flex items-center gap-2">
               <svg className="w-6 h-6 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-semibold uppercase tracking-widest text-[#212529]">Startups</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSnippet;