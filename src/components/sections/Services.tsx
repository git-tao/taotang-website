import React from 'react';

const serviceData = [
  {
    title: "AI Systems Audit",
    icon: (
      <svg className="w-8 h-8 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
    desc: "A fixed-scope engagement to diagnose critical issues in your existing AI systems. You get a prioritized list of actionable fixes for performance, reliability, and cost.",
    deliverables: ["Full Repository Review", "Architectural Stress Test", "Cost & Latency Analysis", "Executive Fix Roadmap"]
  },
  {
    title: "Prototype-to-Production",
    icon: (
      <svg className="w-8 h-8 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    desc: "A 4-week sprint to turn your promising ML prototype into a robust, production-ready system. We build the scaffolding, CI/CD, and monitoring you need to ship with confidence.",
    deliverables: ["Hardened Codebase", "Auto-scaling Deployment", "Observability Stack", "Team Handoff Guide"]
  },
  {
    title: "RAG Reliability Sprint",
    icon: (
      <svg className="w-8 h-8 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    desc: "For teams struggling with inconsistent or inaccurate RAG pipeline performance. We diagnose and fix issues in retrieval and generation to deliver trustworthy results.",
    deliverables: ["Eval-Driven Benchmark", "Optimized Embedding Strategy", "Advanced Reranker Setup", "System Guardrails"]
  }
];

const Services: React.FC = () => {
  return (
    <section id="services" className="section-padding px-6 bg-[#F8F9FA] border-y border-[#E9ECEF]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#212529] mb-16">Services</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {serviceData.map((s, idx) => (
            <div key={idx} className="card-hover flex flex-col p-10 rounded-xl bg-white border border-[#E9ECEF] shadow-sm transition-all duration-300 hover:shadow-[0_8px_24px_rgba(255,191,0,0.15)] hover:border-[#FFBF00]">
              <div className="mb-8">{s.icon}</div>
              <h3 className="text-xl font-bold text-[#212529] mb-4">{s.title}</h3>
              <p className="text-sm text-[#212529] mb-10 leading-relaxed font-light">
                {s.desc}
              </p>
              <div className="mt-auto pt-8 border-t border-[#E9ECEF]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFBF00] block mb-4">Core Deliverables</span>
                <ul className="text-xs space-y-3 text-[#212529] font-semibold">
                  {s.deliverables.map(d => (
                    <li key={d} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFBF00]"></div>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;