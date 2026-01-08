import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="pt-40 pb-20 md:pt-60 md:pb-32 px-6 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div className="text-left">
          <h1 className="text-5xl md:text-7xl text-[#212529] leading-[1.05] mb-8 font-bold">
            I help teams ship and stabilize production AI systems.
          </h1>
          <p className="text-xl md:text-2xl text-[#212529] mb-12 max-w-3xl leading-relaxed font-light">
            Hands-on, project-based work for engineering and product leaders who need to unblock delivery, audit complex systems, or move from prototype to production. No consulting theater, just clear scope and real outcomes.
          </p>
          <div>
            <a 
              href="#services" 
              className="inline-block px-10 py-5 bg-[#FFBF00] text-[#212529] font-bold rounded-md hover:bg-[#E6AC00] transition-all shadow-md transform hover:-translate-y-0.5"
            >
              View Services
            </a>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="aspect-[4/5] bg-white rounded-2xl overflow-hidden relative border border-[#E9ECEF] shadow-2xl">
            {/* Professional Portrait Placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6C757D]">
              <svg className="w-24 h-24 mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span className="text-sm font-medium uppercase tracking-widest opacity-40">Professional Portrait</span>
            </div>
            {/* Subtle overlay for quality feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#212529]/10 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;