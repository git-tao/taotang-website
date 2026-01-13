import React from 'react';

const AboutSnippet: React.FC = () => {
  return (
    <section className="section-padding px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          {/* Photo Column */}
          <div className="md:col-span-4 animate-on-scroll">
            <div className="relative max-w-[320px] mx-auto">
              <img
                src="/images/tao-portrait.jpg"
                alt="Tao Tang - AI Systems Engineer"
                width="320"
                height="320"
                loading="lazy"
                decoding="async"
                className="w-full rounded-2xl shadow-lg object-cover aspect-square"
              />
              {/* Subtle border overlay */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5 pointer-events-none" />
            </div>
          </div>

          {/* Content Column */}
          <div className="md:col-span-8">
            <h2 className="text-3xl font-bold text-[#212529] mb-6 animate-on-scroll">
              A Hands-On Partner for Technical Leaders
            </h2>
            <p className="text-lg text-[#212529] leading-relaxed mb-8 animate-on-scroll">
              I work as a focused, senior-level individual contributor to solve
              complex AI systems problems. My background includes shipping production
              systems at <span className="font-semibold">Meta</span> and multiple
              venture-backed startups, combined with a foundational computer science
              education from <span className="font-semibold">Stanford University</span>.
            </p>

            {/* Enhanced Credentials */}
            <div className="flex flex-wrap gap-4 animate-on-scroll">
              <div className="credential-badge">Meta</div>
              <div className="credential-badge">Stanford University</div>
              <div className="credential-badge">Venture-backed Startups</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSnippet;
