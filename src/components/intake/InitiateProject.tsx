import React, { useState } from 'react';

const InitiateProject: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="initiate" className="section-padding px-6 bg-[#F8F9FA]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#212529] mb-6">Inquiry Received</h2>
          <p className="text-[#212529] mb-10 text-lg">I personally review all technical requests and will respond via email within 24 hours.</p>
          <button onClick={() => setSubmitted(false)} className="text-sm font-bold text-[#FFBF00] hover:text-[#E6AC00] underline underline-offset-4">Submit another request</button>
        </div>
      </section>
    );
  }

  return (
    <section id="initiate" className="section-padding px-6 bg-[#F8F9FA] border-y border-[#E9ECEF]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#212529] mb-16">Initiate a Project</h2>
        <div className="grid md:grid-cols-2 gap-24">
          <div>
            <h2 className="text-4xl font-bold text-[#212529] mb-8 leading-tight">Let's Build.</h2>
            <p className="text-[#212529] leading-relaxed mb-8 text-xl font-light">
              If you have a high-stakes challenge that aligns with my services, the first step is a brief technical intake. This is the start of a professional engagement designed for speed and clarity.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                   <svg className="w-5 h-5 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm text-[#6C757D] font-medium pt-2">Typical response under 24 hours.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                   <svg className="w-5 h-5 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <p className="text-sm text-[#6C757D] font-medium pt-2">Confidential & technical-first disclosure.</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-xl shadow-gray-200/50 border border-[#E9ECEF] space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Full Name</label>
                <input required type="text" className="w-full px-5 py-4 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white placeholder-[#6C757D]/40 text-[#212529]" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Work Email</label>
                <input required type="email" className="w-full px-5 py-4 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white placeholder-[#6C757D]/40 text-[#212529]" placeholder="name@company.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Select Service</label>
              <select required className="w-full px-5 py-4 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white appearance-none cursor-pointer text-[#212529]">
                <option value="">Select an option...</option>
                <option value="audit">AI Systems Audit</option>
                <option value="production">Prototype-to-Production</option>
                <option value="rag">RAG Reliability</option>
                <option value="other">General Strategy</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Project Context</label>
              <textarea required rows={4} className="w-full px-5 py-4 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white placeholder-[#6C757D]/40 text-[#212529]" placeholder="What are the current blockers?" />
            </div>
            <button type="submit" className="w-full py-5 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-all shadow-lg shadow-amber-200/40 transform hover:-translate-y-1">
              Submit Inquiry
            </button>
            <p className="text-[10px] text-center text-[#6C757D] font-medium">This starts a professional consulting process.</p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default InitiateProject;