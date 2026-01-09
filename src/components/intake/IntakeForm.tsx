import React, { useState, useEffect } from 'react';

// API endpoint - use environment variable in production
const API_URL = import.meta.env.VITE_API_URL || 'https://taotang-api.onrender.com';

// Enums matching backend
type ServiceType = 'advisory_paid' | 'audit' | 'project' | 'unclear';
type AccessModel = 'remote_access' | 'own_environment_own_tools' | 'managed_devices' | 'onpremise_only' | 'unsure';
type Timeline = 'urgent' | 'soon' | 'planning' | 'exploring';
type BudgetRange = 'under_10k' | '10k_25k' | '25k_50k' | 'over_50k' | 'unsure';
type RoleTitle = 'founder_csuite' | 'vp_director' | 'eng_manager' | 'ic_engineer' | 'other';
type RoutingResult = 'calendly_strategy_free' | 'paid_advisory' | 'stripe_audit' | 'stripe_project' | 'manual';

interface IntakeResponse {
  inquiry_id: string;
  gate_status: 'pass' | 'manual' | 'fail';
  routing_result: RoutingResult;
  message: string;
}

interface FormData {
  name: string;
  email: string;
  role_title: RoleTitle | '';
  service_type: ServiceType | '';
  access_model: AccessModel | '';
  timeline: Timeline | '';
  budget_range: BudgetRange | '';
  context_raw: string;
}

// Calendly URL - update with your actual Calendly link
const CALENDLY_URL = 'https://calendly.com/taotang/strategy-call';

const IntakeForm: React.FC = () => {
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role_title: '',
    service_type: '',
    access_model: '',
    timeline: '',
    budget_range: '',
    context_raw: '',
  });

  // Load Calendly widget script
  useEffect(() => {
    if (step === 'success' && result?.routing_result === 'calendly_strategy_free') {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [step, result]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('submitting');
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          entry_point: 'homepage_form',
          referrer: document.referrer || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Submission failed');
      }

      const data: IntakeResponse = await response.json();
      setResult(data);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setStep('form');
    }
  };

  // Success state with routing-specific content
  if (step === 'success' && result) {
    return (
      <section id="initiate" className="section-padding px-6 bg-[#F8F9FA]">
        <div className="max-w-2xl mx-auto">
          {result.routing_result === 'calendly_strategy_free' ? (
            // Qualified lead - show Calendly
            <div className="text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-[#212529] mb-4">You're Qualified</h2>
                <p className="text-[#6C757D] text-lg mb-2">{result.message}</p>
                <p className="text-[#212529] font-medium">Book your free 30-minute strategy call below:</p>
              </div>
              {/* Calendly inline widget */}
              <div
                className="calendly-inline-widget rounded-xl overflow-hidden shadow-lg"
                data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&primary_color=FFBF00`}
                style={{ minWidth: '320px', height: '630px' }}
              />
            </div>
          ) : result.routing_result === 'paid_advisory' ? (
            // Paid advisory path
            <div className="text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-[#212529] mb-4">Paid Advisory Session</h2>
                <p className="text-[#6C757D] text-lg mb-6">{result.message}</p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E9ECEF]">
                <h3 className="text-xl font-bold text-[#212529] mb-4">1-Hour Advisory Session</h3>
                <p className="text-4xl font-bold text-[#212529] mb-2">$400</p>
                <p className="text-[#6C757D] mb-6">Deep-dive consultation on your AI challenges</p>
                <ul className="text-left text-[#6C757D] space-y-2 mb-8">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Personalized analysis of your situation
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Actionable recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Recording provided after session
                  </li>
                </ul>
                <a
                  href={`${CALENDLY_URL}?hide_gdpr_banner=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-all text-center"
                >
                  Book & Pay $400
                </a>
              </div>
            </div>
          ) : (
            // Manual review or other paths
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-[#212529] mb-4">Inquiry Received</h2>
              <p className="text-[#6C757D] text-lg mb-6">{result.message}</p>
              <p className="text-[#212529]">I'll personally review your inquiry and respond within 24 hours.</p>
            </div>
          )}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setStep('form');
                setResult(null);
                setFormData({
                  name: '',
                  email: '',
                  role_title: '',
                  service_type: '',
                  access_model: '',
                  timeline: '',
                  budget_range: '',
                  context_raw: '',
                });
              }}
              className="text-sm font-bold text-[#FFBF00] hover:text-[#E6AC00] underline underline-offset-4"
            >
              Submit another inquiry
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Form state
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
                  <svg className="w-5 h-5 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-[#6C757D] font-medium pt-2">Typical response under 24 hours.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-[#6C757D] font-medium pt-2">Confidential & technical-first disclosure.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-[#6C757D] font-medium pt-2">Qualified leads get a free strategy call.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-xl shadow-gray-200/50 border border-[#E9ECEF] space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Name & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Full Name *</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white placeholder-[#6C757D]/40 text-[#212529] text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Work Email *</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white placeholder-[#6C757D]/40 text-[#212529] text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Your Role *</label>
              <select
                required
                name="role_title"
                value={formData.role_title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white appearance-none cursor-pointer text-[#212529] text-sm"
              >
                <option value="">Select your role...</option>
                <option value="founder_csuite">Founder / C-suite</option>
                <option value="vp_director">VP / Director</option>
                <option value="eng_manager">Engineering Manager</option>
                <option value="ic_engineer">IC / Engineer</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">What do you need help with? *</label>
              <select
                required
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white appearance-none cursor-pointer text-[#212529] text-sm"
              >
                <option value="">Select a service...</option>
                <option value="advisory_paid">Paid advisory / second opinion</option>
                <option value="audit">Audit of existing AI system</option>
                <option value="project">Build or ship something</option>
                <option value="unclear">Not sure yet</option>
              </select>
            </div>

            {/* Access Model - Critical Filter */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">How would I access your codebase? *</label>
              <select
                required
                name="access_model"
                value={formData.access_model}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white appearance-none cursor-pointer text-[#212529] text-sm"
              >
                <option value="">Select access model...</option>
                <option value="remote_access">Remote access to cloud/repos (standard contractor setup)</option>
                <option value="own_environment_own_tools">Work in your environment with my own tools</option>
                <option value="managed_devices">Managed devices with pre-installed tools</option>
                <option value="onpremise_only">Strict on-premise only, no external tools</option>
                <option value="unsure">Not sure / need to check with IT</option>
              </select>
            </div>

            {/* Timeline & Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Timeline *</label>
                <select
                  required
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white appearance-none cursor-pointer text-[#212529] text-sm"
                >
                  <option value="">When do you need this?</option>
                  <option value="urgent">Urgent (this week)</option>
                  <option value="soon">Soon (this month)</option>
                  <option value="planning">Planning (next quarter)</option>
                  <option value="exploring">Just exploring</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Budget Range *</label>
                <select
                  required
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white appearance-none cursor-pointer text-[#212529] text-sm"
                >
                  <option value="">Estimated budget...</option>
                  <option value="under_10k">Under $10k</option>
                  <option value="10k_25k">$10k - $25k</option>
                  <option value="25k_50k">$25k - $50k</option>
                  <option value="over_50k">$50k+</option>
                  <option value="unsure">Not sure</option>
                </select>
              </div>
            </div>

            {/* Context */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">Project Context *</label>
              <textarea
                required
                name="context_raw"
                value={formData.context_raw}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-50 transition-all bg-white placeholder-[#6C757D]/40 text-[#212529] text-sm"
                placeholder="Describe your current situation, challenges, and what success looks like. The more specific, the better I can help."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={step === 'submitting'}
              className="w-full py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-all shadow-lg shadow-amber-200/40 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {step === 'submitting' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Submit Inquiry'
              )}
            </button>
            <p className="text-[10px] text-center text-[#6C757D] font-medium">This starts a professional consulting process.</p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default IntakeForm;
