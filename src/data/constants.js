// Single source of truth for localStorage key names used across the app.
// Import these instead of retyping the string literal so a rename or typo
// can't silently desync one component's read/write from another's.
export const STORAGE_KEYS = {
  GRADES: 'mit-gpa-calculator-v1',
  PATHWAY: 'mit-gpa-calculator-pathway',
  SPECIALIZATION: 'mit-gpa-calculator-specialization',
  SECURITY_ACCEPTED: 'mit-gpa-calculator-security-accepted',
  INSTALL_PROMPT_DISMISSED: 'mit-gpa-calculator-install-prompt-dismissed',
};
