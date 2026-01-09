/**
 * Gate logic for lead qualification and routing.
 * Client-side preview of backend logic in backend/app/services/gate.py
 *
 * IMPORTANT: This is for UI feedback only. The backend is the source of truth.
 */

import {
  FormData,
  GateEvaluationPreview,
  GateStatus,
  RoutingResult,
  AccessModel,
  BudgetRange,
  RoleTitle,
  Timeline,
} from '../types';
import { isBusinessEmail } from './emailValidation';

// Minimum context length required
const MIN_CONTEXT_LENGTH = 100;

// Senior roles that qualify for free strategy call
const SENIOR_ROLES: RoleTitle[] = ['founder_csuite', 'vp_director', 'eng_manager'];

// Qualified access models (others trigger manual review)
const QUALIFIED_ACCESS_MODELS: AccessModel[] = ['remote_access', 'own_environment_own_tools'];

// Manual review access models
const MANUAL_REVIEW_ACCESS_MODELS: AccessModel[] = ['managed_devices', 'onpremise_only', 'unsure'];

// Urgent timelines that qualify
const URGENT_TIMELINES: Timeline[] = ['urgent', 'soon'];

// Budget ranges that meet threshold ($25k+)
const QUALIFYING_BUDGETS: BudgetRange[] = ['25k_50k', 'over_50k'];

/**
 * Check if role qualifies as senior (includes decision-maker upgrade for IC/Other)
 */
function isSeniorRole(role: RoleTitle | '', isDecisionMaker: boolean | null): boolean {
  if (!role) return false;

  // Standard senior roles
  if (SENIOR_ROLES.includes(role as RoleTitle)) {
    return true;
  }

  // IC/Other with decision-maker = treat as senior
  if ((role === 'ic_engineer' || role === 'other') && isDecisionMaker === true) {
    return true;
  }

  return false;
}

/**
 * Check if access model is qualified
 */
function isQualifiedAccess(access: AccessModel | ''): boolean {
  if (!access) return false;
  return QUALIFIED_ACCESS_MODELS.includes(access as AccessModel);
}

/**
 * Check if access model triggers manual review
 */
function triggersManualReview(access: AccessModel | ''): boolean {
  if (!access) return false;
  return MANUAL_REVIEW_ACCESS_MODELS.includes(access as AccessModel);
}

/**
 * Check if timeline is urgent
 */
function isUrgentTimeline(timeline: Timeline | ''): boolean {
  if (!timeline) return false;
  return URGENT_TIMELINES.includes(timeline as Timeline);
}

/**
 * Check if budget meets threshold
 */
function meetsBudgetThreshold(budget: BudgetRange | ''): boolean {
  if (!budget) return false;
  return QUALIFYING_BUDGETS.includes(budget as BudgetRange);
}

/**
 * Check if context is sufficient
 */
function hasSufficientContext(context: string): boolean {
  return context.trim().length >= MIN_CONTEXT_LENGTH;
}

/**
 * Check if IC/Other role with strong signals should go to manual review
 * instead of fail (giving you a chance to review)
 */
function isStrongICSignal(form: FormData): boolean {
  const { role_title, is_decision_maker, budget_range, timeline, access_model, context_raw } = form;

  // Only applies to IC/Other who are NOT decision makers
  if (role_title !== 'ic_engineer' && role_title !== 'other') return false;
  if (is_decision_maker === true) return false;

  // Check if all other signals are strong
  const hasQualifyingBudget = meetsBudgetThreshold(budget_range);
  const hasUrgentTimeline = isUrgentTimeline(timeline);
  const hasQualifiedAccess = isQualifiedAccess(access_model);
  const hasSuffContext = hasSufficientContext(context_raw);

  return hasQualifyingBudget && hasUrgentTimeline && hasQualifiedAccess && hasSuffContext;
}

/**
 * Check if "Not sure" budget with strong signals should go to manual review
 */
function isStrongUnsureBudget(form: FormData): boolean {
  const { budget_range, role_title, is_decision_maker, timeline, access_model, context_raw } = form;

  if (budget_range !== 'unsure') return false;

  const isSenior = isSeniorRole(role_title, is_decision_maker);
  const hasUrgentTimeline = isUrgentTimeline(timeline);
  const hasQualifiedAccess = isQualifiedAccess(access_model);
  const hasSuffContext = hasSufficientContext(context_raw);

  return isSenior && hasUrgentTimeline && hasQualifiedAccess && hasSuffContext;
}

/**
 * Evaluate gate criteria and determine routing.
 * This is a client-side preview - backend is source of truth.
 */
export function evaluateGate(form: FormData): GateEvaluationPreview {
  const {
    email,
    role_title,
    is_decision_maker,
    service_type,
    context_raw,
    timeline,
    budget_range,
    access_model,
  } = form;

  // Evaluate each criterion
  const criteria = {
    is_business_email: isBusinessEmail(email),
    is_qualified_access: isQualifiedAccess(access_model),
    is_urgent_timeline: isUrgentTimeline(timeline),
    is_sufficient_budget: meetsBudgetThreshold(budget_range),
    is_senior_role: isSeniorRole(role_title, is_decision_maker),
    is_sufficient_context: hasSufficientContext(context_raw),
  };

  // Collect fail reasons
  const fail_reasons: string[] = [];
  if (!criteria.is_business_email) fail_reasons.push('personal_email');
  if (!criteria.is_qualified_access) fail_reasons.push('access_not_qualified');
  if (!criteria.is_urgent_timeline) fail_reasons.push('timeline_not_urgent');
  if (!criteria.is_sufficient_budget) fail_reasons.push('budget_below_threshold');
  if (!criteria.is_senior_role) fail_reasons.push('not_senior_role');
  if (!criteria.is_sufficient_context) fail_reasons.push('insufficient_context');

  // Determine gate status
  let gate_status: GateStatus;
  let routing_result: RoutingResult;

  // Special case: Paid advisory bypasses gate entirely
  if (service_type === 'advisory_paid') {
    gate_status = 'pass'; // Technically N/A but we treat as pass for UX
    routing_result = 'paid_advisory';
    return { gate_status, routing_result, criteria, fail_reasons: [] };
  }

  // Access model triggers manual review
  if (triggersManualReview(access_model)) {
    gate_status = 'manual';
    routing_result = 'manual';
    return { gate_status, routing_result, criteria, fail_reasons };
  }

  // All criteria pass = free strategy call
  if (Object.values(criteria).every(Boolean)) {
    gate_status = 'pass';
    routing_result = 'calendly_strategy_free';
    return { gate_status, routing_result, criteria, fail_reasons: [] };
  }

  // IC/Other with strong signals = manual review (not fail)
  if (isStrongICSignal(form)) {
    gate_status = 'manual';
    routing_result = 'manual';
    return { gate_status, routing_result, criteria, fail_reasons };
  }

  // "Not sure" budget with strong signals = manual review
  if (isStrongUnsureBudget(form)) {
    gate_status = 'manual';
    routing_result = 'manual';
    return { gate_status, routing_result, criteria, fail_reasons };
  }

  // Default: fail = paid advisory
  gate_status = 'fail';
  routing_result = 'paid_advisory';
  return { gate_status, routing_result, criteria, fail_reasons };
}

/**
 * Get human-readable label for budget range
 */
export function getBudgetLabel(budget: BudgetRange): string {
  const labels: Record<BudgetRange, string> = {
    under_10k: '< $10,000',
    '10k_25k': '$10,000 - $25,000',
    '25k_50k': '$25,000 - $50,000',
    over_50k: '$50,000+',
    unsure: 'Not sure',
  };
  return labels[budget];
}

/**
 * Get human-readable label for timeline
 */
export function getTimelineLabel(timeline: Timeline): string {
  const labels: Record<Timeline, string> = {
    urgent: 'Urgent: Within 2 weeks',
    soon: 'Soon: Within the next month',
    planning: 'Planning: 1-3 months',
    exploring: 'Exploring: 3+ months',
  };
  return labels[timeline];
}
