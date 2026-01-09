/**
 * Email validation utilities for business domain detection.
 * Mirrors backend logic in backend/app/services/gate.py
 */

// Common personal email domains that don't qualify for free strategy call
const PERSONAL_EMAIL_DOMAINS = new Set([
  // Major providers
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  // Regional providers
  'mail.com',
  'email.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'fastmail.com',
  'tutanota.com',
  'gmx.com',
  'gmx.net',
  'web.de',
  'mailinator.com',
  // Temporary/disposable
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'throwaway.email',
]);

/**
 * Extract domain from email address
 */
export function extractEmailDomain(email: string): string {
  const parts = email.toLowerCase().trim().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Check if email is from a business domain (not personal)
 */
export function isBusinessEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = extractEmailDomain(email);
  return domain.length > 0 && !PERSONAL_EMAIL_DOMAINS.has(domain);
}

/**
 * Validate email format
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Get validation message for email
 */
export function getEmailValidationMessage(email: string): string | null {
  if (!email) return null;
  if (!isValidEmailFormat(email)) {
    return 'Please enter a valid email address';
  }
  if (!isBusinessEmail(email)) {
    return 'Please use your work email for business inquiries';
  }
  return null;
}
