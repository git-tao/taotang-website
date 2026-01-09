import React, { useState, useEffect } from 'react';
import { FormData, RoleTitle } from '../types';
import { isValidEmailFormat, isBusinessEmail, getEmailValidationMessage } from '../utils/emailValidation';

interface BasicInfoStepProps {
  formData: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
}

const ROLE_OPTIONS: { value: RoleTitle; label: string }[] = [
  { value: 'founder_csuite', label: 'Founder / C-Suite' },
  { value: 'vp_director', label: 'VP / Director' },
  { value: 'eng_manager', label: 'Engineering Manager' },
  { value: 'ic_engineer', label: 'IC Engineer' },
  { value: 'other', label: 'Other' },
];

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  formData,
  onChange,
  onNext,
}) => {
  const [emailTouched, setEmailTouched] = useState(false);
  const [showDecisionMakerQuestion, setShowDecisionMakerQuestion] = useState(false);

  // Show decision-maker question for IC/Other roles
  useEffect(() => {
    const needsDecisionMakerCheck =
      formData.role_title === 'ic_engineer' || formData.role_title === 'other';
    setShowDecisionMakerQuestion(needsDecisionMakerCheck);

    // Reset decision-maker if role changes to senior
    if (!needsDecisionMakerCheck && formData.is_decision_maker !== null) {
      onChange({ is_decision_maker: null });
    }
  }, [formData.role_title]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleDecisionMakerChange = (value: boolean) => {
    onChange({ is_decision_maker: value });
  };

  // Validation
  const emailError = emailTouched ? getEmailValidationMessage(formData.email) : null;
  const isEmailValid = isValidEmailFormat(formData.email) && isBusinessEmail(formData.email);

  const canProceed =
    formData.name.trim().length > 0 &&
    isEmailValid &&
    formData.role_title !== '' &&
    (!showDecisionMakerQuestion || formData.is_decision_maker !== null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-[#212529]">Let's start with the basics</h3>
        <p className="text-sm text-[#6C757D]">
          This helps me understand who I'm speaking with.
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
          Full Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          autoFocus
          className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100 transition-all bg-white text-[#212529] text-sm"
          placeholder="John Doe"
        />
      </div>

      {/* Work Email */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
          Work Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={() => setEmailTouched(true)}
          required
          className={`
            w-full px-4 py-3 border rounded-lg focus:outline-none transition-all bg-white text-[#212529] text-sm
            ${emailError
              ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100'
              : 'border-[#E9ECEF] focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100'
            }
          `}
          placeholder="name@company.com"
        />
        {emailError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {emailError}
          </p>
        )}
        {formData.email && isEmailValid && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Business email verified
          </p>
        )}
      </div>

      {/* Company Name (Optional) */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
          Company Name <span className="text-[#ADB5BD]">(optional)</span>
        </label>
        <input
          type="text"
          name="company_name"
          value={formData.company_name}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100 transition-all bg-white text-[#212529] text-sm"
          placeholder="Acme Corp"
        />
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#6C757D]">
          Your Role *
        </label>
        <select
          name="role_title"
          value={formData.role_title}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 border border-[#E9ECEF] rounded-lg focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-amber-100 transition-all bg-white appearance-none cursor-pointer text-[#212529] text-sm"
        >
          <option value="">Select your role...</option>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional: Decision Maker Question for IC/Other */}
      {showDecisionMakerQuestion && (
        <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <label className="text-sm font-medium text-[#212529]">
            Are you the budget owner or project sponsor? *
          </label>
          <p className="text-xs text-[#6C757D]">
            This helps me understand your decision-making authority.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleDecisionMakerChange(true)}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all
                ${formData.is_decision_maker === true
                  ? 'bg-[#212529] text-white'
                  : 'bg-white border border-[#E9ECEF] text-[#212529] hover:border-[#FFBF00]'
                }
              `}
            >
              Yes, I am
            </button>
            <button
              type="button"
              onClick={() => handleDecisionMakerChange(false)}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all
                ${formData.is_decision_maker === false
                  ? 'bg-[#212529] text-white'
                  : 'bg-white border border-[#E9ECEF] text-[#212529] hover:border-[#FFBF00]'
                }
              `}
            >
              No, I'm not
            </button>
          </div>
        </div>
      )}

      {/* Next Button */}
      <button
        type="submit"
        disabled={!canProceed}
        className={`
          w-full py-4 rounded-lg font-bold text-sm transition-all
          ${canProceed
            ? 'bg-[#FFBF00] text-[#212529] hover:bg-[#E6AC00] shadow-lg shadow-amber-200/40 transform hover:-translate-y-0.5'
            : 'bg-[#E9ECEF] text-[#ADB5BD] cursor-not-allowed'
          }
        `}
      >
        Continue to Project Details
      </button>
    </form>
  );
};

export default BasicInfoStep;
