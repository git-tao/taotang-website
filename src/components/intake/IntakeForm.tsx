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
const BOOKING_URL = 'https://calendar.app.google/yochBqeYtLimcXc76';

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
            // Qualified lead - book a call
            <div className="text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-[#212529] mb-4">You're Qualified</h2>
                <p className="text-[#6C757D] text-lg mb-6">{result.message}</p>
              </div>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-colors shadow-lg shadow-amber-200/40 text-lg"
              >
                Book Your Free Strategy Call
              </a>
            </div>
          ) : result.routing_result === 'paid_advisory' ? (
            // Advisory path - book a call
            <div className="text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-[#212529] mb-4">Thank You for Your Inquiry</h2>
                <p className="text-[#6C757D] text-lg mb-6">I'd recommend scheduling a call to discuss your needs and determine the best path forward.</p>
              </div>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-[#FFBF00] text-[#212529] font-bold rounded-lg hover:bg-[#E6AC00] transition-colors shadow-lg shadow-amber-200/40 text-lg"
              >
                Book a Call
              </a>
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
