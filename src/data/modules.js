export const gradeMap = {
  '': 0,
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  E: 0.0,
};

export const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E'];
export const PASSFAIL_OPTIONS = ['Pass', 'Fail'];

export const modules = [
  // ==========================================
  // YEAR 1 SEMESTER 1 (All Common)
  // ==========================================
  {
    code: 'MGTE 11243',
    name: 'Principles of Management & Organizational Behaviour',
    y: 1,
    s: 1,
    cr: 3,
  },
  { code: 'MGTE 11233', name: 'Business Statistics and Economics', y: 1, s: 1, cr: 3 },
  { code: 'INTE 11213', name: 'Fundamentals of Computing', y: 1, s: 1, cr: 3 },
  { code: 'INTE 11223', name: 'Programming Concepts', y: 1, s: 1, cr: 3 },
  { code: 'DELT 11232', name: 'English for Professionals', y: 1, s: 1, cr: 2 },
  { code: 'PMAT 11212', name: 'Discrete Mathematics for Computing I', y: 1, s: 1, cr: 2 },
  { code: 'ACLT 11013', name: 'Academic Literacy I', y: 1, s: 1, cr: 0, nonGpa: true },
  {
    code: 'GNCT 11212',
    name: 'Personal Progress Development I',
    y: 1,
    s: 1,
    cr: 2,
    nonGpa: true,
    gradeType: 'passfail',
  },

  // ==========================================
  // YEAR 1 SEMESTER 2 (All Common)
  // ==========================================
  { code: 'MGTE 12253', name: 'Accounting Concepts and Costing', y: 1, s: 2, cr: 3 },
  { code: 'INTE 12243', name: 'Computer Networks', y: 1, s: 2, cr: 3 },
  { code: 'INTE 12213', name: 'Object Oriented Programming', y: 1, s: 2, cr: 3 },
  { code: 'INTE 12223', name: 'Database Design and Development', y: 1, s: 2, cr: 3 },
  { code: 'MGTE 12263', name: 'Optimization Methods in Management Science', y: 1, s: 2, cr: 3 },
  { code: 'MGTE 12273', name: 'Industry and Technology', y: 1, s: 2, cr: 3 },
  { code: 'PMAT 12212', name: 'Discrete Mathematics for Computing II', y: 1, s: 2, cr: 2 },
  {
    code: 'ACLT 12022',
    name: 'Academic Literacy II',
    y: 1,
    s: 2,
    cr: 0,
    nonGpa: true,
    optional: true,
  },

  // ==========================================
  // YEAR 2 SEMESTER 1
  // ==========================================
  // [Common Subjects]
  { code: 'INTE 21213', name: 'Information Systems Modelling', y: 2, s: 1, cr: 3, pathway: 'both' },
  { code: 'INTE 21313', name: 'Business Information Systems', y: 2, s: 1, cr: 3, pathway: 'both' },
  { code: 'INTE 21323', name: 'Web Applications Development', y: 2, s: 1, cr: 3, pathway: 'both' },
  { code: 'INTE 21333', name: 'Event Driven Programming', y: 2, s: 1, cr: 3, pathway: 'both' },
  {
    code: 'ACLT 21032',
    name: 'Academic Literacy III',
    y: 2,
    s: 1,
    cr: 0,
    nonGpa: true,
    optional: true,
    pathway: 'both',
  },

  // [IT Pathway Specific]
  {
    code: 'INTE 21243',
    name: 'Computer Architecture and Operating Systems',
    y: 2,
    s: 1,
    cr: 3,
    pathway: 'it',
  },

  // [MIT Pathway Specific]
  { code: 'MGTE 21243', name: 'Marketing Management', y: 2, s: 1, cr: 3, pathway: 'mit' },
  { code: 'MGTE 21233', name: 'Operations Management', y: 2, s: 1, cr: 3, pathway: 'mit' },
  { code: 'INTE 21343', name: 'Software Engineering Concepts', y: 2, s: 1, cr: 3, pathway: 'mit' },

  // ==========================================
  // YEAR 2 SEMESTER 2
  // ==========================================
  // [Common Subjects]
  {
    code: 'INTE 22343',
    name: 'Data Structures and Algorithms',
    y: 2,
    s: 2,
    cr: 3,
    pathway: 'both',
  },
  { code: 'INTE 22303', name: 'Artificial Intelligence', y: 2, s: 2, cr: 3, pathway: 'both' },
  {
    code: 'INTE 22283',
    name: 'Mobile Applications Development',
    y: 2,
    s: 2,
    cr: 3,
    pathway: 'both',
  },
  {
    code: 'GNCT 24212',
    name: 'Personal Progress Development II',
    y: 2,
    s: 2,
    cr: 2,
    nonGpa: true,
    gradeType: 'passfail',
    pathway: 'both',
  },

  // [IT Pathway Specific]
  {
    code: 'INTE 22253',
    name: 'Distributed Systems and Cloud Computing',
    y: 2,
    s: 2,
    cr: 3,
    pathway: 'it',
  },
  { code: 'INTE 22263', name: 'Embedded Systems Development', y: 2, s: 2, cr: 3, pathway: 'it' },
  {
    code: 'INTE 22293',
    name: 'Software Architecture and Process Models',
    y: 2,
    s: 2,
    cr: 3,
    pathway: 'it',
  },
  {
    code: 'INTE 22313',
    name: 'Software Design Patterns and Frameworks',
    y: 2,
    s: 2,
    cr: 3,
    pathway: 'it',
  },

  // [MIT Pathway Specific]
  {
    code: 'MGTE 22273',
    name: 'Human Resource Management & Leadership Communication',
    y: 2,
    s: 2,
    cr: 3,
    pathway: 'mit',
  },
  {
    code: 'MGTE 22263',
    name: 'Logistics and Supply Chain Management',
    y: 2,
    s: 2,
    cr: 3,
    pathway: 'mit',
  },

  // ==========================================
  // YEAR 3 SEMESTER 1
  // ==========================================
  // [Common Subjects]
  {
    code: 'INTE 31356',
    name: 'Software Development Project',
    y: 3,
    s: 1,
    cr: 6,
    pathway: 'both',
    specCompulsory: ['bse', 'oscm', 'is'],
  },
  {
    code: 'MGTE 31373',
    name: 'Project Management',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'both',
    specCompulsory: ['bse', 'oscm', 'is'],
  },
  {
    code: 'INTE 31393',
    name: 'Information Security',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'both',
    specCompulsory: ['is'],
    specOptional: ['bse', 'oscm'],
  },
  {
    code: 'MGTE 31383',
    name: 'Research Methods',
    y: 3,
    s: 1,
    cr: 3,
    optional: true,
    pathway: 'both',
    specOptional: ['bse', 'oscm', 'is'],
  },

  // [IT Pathway Specific]
  { code: 'INTE 31233', name: 'Human Computer Interaction', y: 3, s: 1, cr: 3, pathway: 'it' },
  {
    code: 'INTE 31243',
    name: 'Software Quality Engineering',
    y: 3,
    s: 1,
    cr: 3,
    optional: true,
    pathway: 'it',
  },
  {
    code: 'INTE 31283',
    name: 'Big Data and Data Warehousing',
    y: 3,
    s: 1,
    cr: 3,
    optional: true,
    pathway: 'it',
  },
  {
    code: 'INTE 31373',
    name: 'Machine Learning',
    y: 3,
    s: 1,
    cr: 3,
    optional: true,
    pathway: 'it',
  },
  {
    code: 'INTE 31403',
    name: 'System Administration and Maintenance',
    y: 3,
    s: 1,
    cr: 3,
    optional: true,
    pathway: 'it',
  },
  {
    code: 'PMAT 31212',
    name: 'Mathematics for Computing - 3',
    y: 3,
    s: 1,
    cr: 2,
    optional: true,
    pathway: 'it',
  },

  // [MIT Degree Specific]
  {
    code: 'MGTE 31393',
    name: 'Managerial Finance',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specCompulsory: ['bse', 'oscm', 'is'],
  },
  {
    code: 'MGTE 31293',
    name: 'Computer Integrated Manufacturing',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specCompulsory: ['bse'],
    specOptional: ['oscm', 'is'],
  },
  {
    code: 'MGTE 31403',
    name: 'Management of Technology',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specCompulsory: ['bse'],
    specOptional: ['oscm', 'is'],
  },
  {
    code: 'MGTE 31413',
    name: 'Warehouse Management and Industrial Shipping',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specCompulsory: ['oscm'],
    specOptional: ['bse', 'is'],
  },
  {
    code: 'MGTE 31423',
    name: 'Advanced Optimization Methods in Management Science',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specCompulsory: ['bse', 'oscm'],
    specOptional: ['is'],
  },
  {
    code: 'MGTE 31433',
    name: 'Computer based tools for Management Applications',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specOptional: ['bse', 'oscm', 'is'],
  },
  {
    code: 'MGTE 31303',
    name: 'Procurement and Supply Management',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specCompulsory: ['oscm'],
    specOptional: ['bse', 'is'],
  },
  {
    code: 'INTE 31423',
    name: 'Data Analytics and Visualization',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specCompulsory: ['is'],
    specOptional: ['bse', 'oscm'],
  },
  {
    code: 'INTE 31413',
    name: 'Information Technology Infrastructure',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specCompulsory: ['is'],
    specOptional: ['bse', 'oscm'],
  },
  {
    code: 'MGTE 31443',
    name: 'Strategic Marketing and International Trade',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specOptional: ['bse', 'oscm', 'is'],
  },

  // ==========================================
  // YEAR 3 SEMESTER 2
  // ==========================================
  // [Common Subjects]
  {
    code: 'GNCT 32216',
    name: 'Internship',
    y: 3,
    s: 2,
    cr: 6,
    pathway: 'both',
    specCompulsory: ['bse', 'oscm', 'is'],
  },
];
