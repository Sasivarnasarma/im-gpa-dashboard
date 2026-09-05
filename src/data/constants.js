// Single source of truth for localStorage key names used across the app.
export const STORAGE_KEYS = {
  PROFILES: 'mit-gpa-calculator-profiles',
  SECURITY_ACCEPTED: 'mit-gpa-calculator-security-accepted',
  INSTALL_PROMPT_DISMISSED: 'mit-gpa-calculator-install-prompt-dismissed',
  INSTALLED: 'mit-gpa-calculator-installed',
};

// Display abbreviations for the MIT Year 3 specializations
export const SPECIALIZATION_LABELS = {
  undecided: 'UNDECIDED',
  bse: 'BSE',
  oscm: 'OSCM',
  is: 'IS',
};

export const GRADING_SCALE = [
  {
    grade: 'A+',
    marks: '100 - 85',
    gpv: '4.0',
    color: 'text-m-blue-light',
    border: 'border-m-blue-light/40 hover:border-m-blue-light',
    bg: 'bg-m-blue-light/5',
  },
  {
    grade: 'A',
    marks: '84 - 70',
    gpv: '4.0',
    color: 'text-m-blue-light',
    border: 'border-m-blue-light/40 hover:border-m-blue-light',
    bg: 'bg-m-blue-light/5',
  },
  {
    grade: 'A-',
    marks: '69 - 65',
    gpv: '3.7',
    color: 'text-m-blue-light',
    border: 'border-m-blue-light/40 hover:border-m-blue-light',
    bg: 'bg-m-blue-light/5',
  },
  {
    grade: 'B+',
    marks: '64 - 60',
    gpv: '3.3',
    color: 'text-[#4DA6FF]',
    border: 'border-[#4DA6FF]/40 hover:border-[#4DA6FF]',
    bg: 'bg-[#4DA6FF]/5',
  },
  {
    grade: 'B',
    marks: '59 - 55',
    gpv: '3.0',
    color: 'text-[#4DA6FF]',
    border: 'border-[#4DA6FF]/40 hover:border-[#4DA6FF]',
    bg: 'bg-[#4DA6FF]/5',
  },
  {
    grade: 'B-',
    marks: '54 - 50',
    gpv: '2.7',
    color: 'text-[#4DA6FF]',
    border: 'border-[#4DA6FF]/40 hover:border-[#4DA6FF]',
    bg: 'bg-[#4DA6FF]/5',
  },
  {
    grade: 'C+',
    marks: '49 - 45',
    gpv: '2.3',
    color: 'text-m-orange',
    border: 'border-m-orange/40 hover:border-m-orange',
    bg: 'bg-m-orange/5',
  },
  {
    grade: 'C',
    marks: '44 - 40',
    gpv: '2.0',
    color: 'text-m-orange',
    border: 'border-m-orange/40 hover:border-m-orange',
    bg: 'bg-m-orange/5',
  },
  {
    grade: 'C-',
    marks: '39 - 35',
    gpv: '1.7',
    color: 'text-m-red',
    border: 'border-m-red/40 hover:border-m-red',
    bg: 'bg-m-red/5',
  },
  {
    grade: 'D+',
    marks: '34 - 30',
    gpv: '1.3',
    color: 'text-m-red',
    border: 'border-m-red/40 hover:border-m-red',
    bg: 'bg-m-red/5',
  },
  {
    grade: 'D',
    marks: '29 - 25',
    gpv: '1.0',
    color: 'text-m-red',
    border: 'border-m-red/40 hover:border-m-red',
    bg: 'bg-m-red/5',
  },
  {
    grade: 'E',
    marks: '24 - 00',
    gpv: '0.0',
    color: 'text-m-red',
    border: 'border-m-red/40 hover:border-m-red',
    bg: 'bg-m-red/5',
  },
];
