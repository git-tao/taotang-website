/**
 * Type definitions for the intake form wizard.
 * Maps to backend schema in backend/app/schemas/intake.py
 */

// Enums matching backend
export type ServiceType = 'advisory_paid' | 'audit' | 'project' | 'unclear';
export type AccessModel = 'remote_access' | 'own_environment_own_tools' | 'managed_devices' | 'onpremise_only' | 'unsure';
export type Timeline = 'urgent' | 'soon' | 'planning' | 'exploring';
export type BudgetRange = 'under_10k' | '10k_25k' | '25k_50k' | 'over_50k' | 'unsure';
export type RoleTitle = 'founder_csuite' | 'vp_director' | 'eng_manager' | 'ic_engineer' | 'other';
export type GateStatus = 'pass' | 'fail' | 'manual';
export type RoutingResult = 'calendly_strategy_free' | 'paid_advisory' | 'manual';

// Project subtype for "Build or ship something"
export type ProjectSubtype = 'prototype_to_production' | 'rag_reliability_sprint' | 'other_build';

// Complete form data structure
export interface FormData {
  // Step 1: Basic Info
  name: string;
  email: string;
  company_name: string;
  role_title: RoleTitle | '';
  is_decision_maker: boolean | null; // Only asked if role is IC/Other

  // Step 2: Project Details
  service_type: ServiceType | '';
  context_raw: string;

  // Conditional follow-ups (stored in answers_raw)
  audit_symptoms: string;           // If service_type = audit
  project_subtype: ProjectSubtype | ''; // If service_type = project
  project_state: string;            // If project_subtype = prototype_to_production
  rag_issues: string;               // If project_subtype = rag_reliability_sprint
  advisory_questions: string;       // If service_type = advisory_paid
  desired_outcome: string;          // If service_type = unclear

  // Step 3: Qualification
  timeline: Timeline | '';
  budget_range: BudgetRange | '';
  access_model: AccessModel | '';
}

// Initial empty form state
export const initialFormData: FormData = {
  name: '',
  email: '',
  company_name: '',
  role_title: '',
  is_decision_maker: null,
  service_type: '',
  context_raw: '',
  audit_symptoms: '',
  project_subtype: '',
  project_state: '',
  rag_issues: '',
  advisory_questions: '',
  desired_outcome: '',
  timeline: '',
  budget_range: '',
  access_model: '',
};

// ============================================================================
// AI Clarification Types
// ============================================================================

export type AISessionStatus = 'active' | 'resolved' | 'manual' | 'expired' | 'error';
export type AITriggerReason = 'ambiguity' | 'contradiction' | 'budget_scope_mismatch' | 'intelligence';
export type AIQuestionType = 'single_choice' | 'text' | 'confirmation';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  maps_to_field?: string;
  maps_to_value?: string | null;
}

export interface AIQuestion {
  question_text: string;
  question_type: AIQuestionType;
  question_purpose?: string;
  options?: QuestionOption[];
  target_field?: string;
}

export interface AITurnResponse {
  session_id: string;
  turn_index: number;
  session_status: AISessionStatus;
  next_question?: AIQuestion;
  gate_status?: GateStatus;
  routing_result?: RoutingResult;
  message?: string;
  questions_remaining: number;
  field_updated?: string;
  field_old_value?: unknown;
  field_new_value?: unknown;
}

// ============================================================================
// API Response Types
// ============================================================================

// API response type (extended with AI clarification fields)
export interface IntakeResponse {
  inquiry_id: string;
  gate_status: GateStatus;
  routing_result: RoutingResult;
  message: string;
  // AI Clarification fields
  needs_clarification?: boolean;
  ai_session_id?: string;
  provisional_gate_status?: GateStatus;
  first_question?: AIQuestion;
}

// Gate evaluation result (client-side preview)
export interface GateEvaluationPreview {
  gate_status: GateStatus;
  routing_result: RoutingResult;
  criteria: {
    is_business_email: boolean;
    is_qualified_access: boolean;
    is_urgent_timeline: boolean;
    is_sufficient_budget: boolean;
    is_senior_role: boolean;
    is_sufficient_context: boolean;
  };
  fail_reasons: string[];
}

// Wizard step type
export type WizardStep = 1 | 2 | 3;
