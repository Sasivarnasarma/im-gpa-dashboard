// Pure GPA calculation engine, extracted out of App.jsx so the math that
// drives every number on the dashboard can be unit-tested independently of
// React rendering. Behavior is unchanged from the original inline version —
// only the "which props go where" wiring around it is what tends to break
// (see TargetPlanner's history), which is exactly what these functions make
// testable at the boundary.

// Filters the full curriculum down to what's relevant for the student's
// pathway/specialization, and marks Year 3 MIT modules optional/compulsory
// based on the chosen specialization.
export function getActiveModules(modules, pathway, specialization) {
  const currentPathway = pathway || 'undecided';

  return modules
    .filter((m) => {
      if (currentPathway === 'undecided') {
        return m.y === 1;
      }
      if (m.y === 3 && currentPathway === 'mit' && specialization === 'undecided') {
        return false;
      }
      return !m.pathway || m.pathway === 'both' || m.pathway === currentPathway;
    })
    .map((m) => {
      if (m.y === 3 && currentPathway === 'mit' && specialization !== 'undecided') {
        const isCompulsory = m.specCompulsory?.includes(specialization);
        return {
          ...m,
          optional: !isCompulsory,
        };
      }
      return m;
    });
}

const emptyYearStat = () => ({
  points: 0,
  credits: 0,
  gradedCredits: 0,
  totalCredits: 0,
  compulsoryGraded: 0,
  compulsoryTotal: 0,
  optionalGraded: 0,
  optionalTotal: 0,
});

// Rolls the active module list + entered grades up into every stat the
// dashboard displays: cumulative/per-year GPA, credit completion counts, and
// the compulsory/optional split.
export function computeGpaStats(activeModules, grades, gradeMap) {
  let totalWeightedPoints = 0;
  let totalGpaCredits = 0;
  let totalCurriculumGpaCredits = 0;
  let ungradedGpaCredits = 0;
  const totalModulesCount = activeModules.length;
  let gradedModulesCount = 0;

  let baseCompulsoryCount = 0;
  let gradedOptionalCount = 0;

  let gradedCredits = 0;
  let baseCompulsoryCredits = 0;
  let gradedOptionalCredits = 0;
  let totalCreditsCount = 0;

  const yearStats = { 1: emptyYearStat(), 2: emptyYearStat(), 3: emptyYearStat() };

  activeModules.forEach((mod) => {
    const grade = grades[mod.code] || '';
    const hasGrade = grade !== '';

    if (hasGrade) {
      gradedModulesCount++;
    }

    if (!mod.optional) {
      baseCompulsoryCount++;
      baseCompulsoryCredits += mod.cr;
    } else if (hasGrade) {
      gradedOptionalCount++;
      gradedOptionalCredits += mod.cr;
    }

    totalCreditsCount += mod.cr;
    if (hasGrade) {
      gradedCredits += mod.cr;
    }

    if (mod.cr > 0) {
      yearStats[mod.y].totalCredits += mod.cr;
      if (mod.optional) {
        yearStats[mod.y].optionalTotal += mod.cr;
      } else {
        yearStats[mod.y].compulsoryTotal += mod.cr;
      }

      if (hasGrade) {
        yearStats[mod.y].gradedCredits += mod.cr;
        if (mod.optional) {
          yearStats[mod.y].optionalGraded += mod.cr;
        } else {
          yearStats[mod.y].compulsoryGraded += mod.cr;
        }
      }
    }

    if (!mod.nonGpa) {
      totalCurriculumGpaCredits += mod.cr;
      if (hasGrade) {
        totalWeightedPoints += gradeMap[grade] * mod.cr;
        totalGpaCredits += mod.cr;
        yearStats[mod.y].points += gradeMap[grade] * mod.cr;
        yearStats[mod.y].credits += mod.cr;
      } else {
        ungradedGpaCredits += mod.cr;
      }
    }
  });

  const activeCompulsoryCount = baseCompulsoryCount + gradedOptionalCount;
  const activeCompulsoryCredits = baseCompulsoryCredits + gradedOptionalCredits;

  const y1GPA = yearStats[1].credits > 0 ? yearStats[1].points / yearStats[1].credits : 0;
  const y2GPA = yearStats[2].credits > 0 ? yearStats[2].points / yearStats[2].credits : 0;
  const y3GPA = yearStats[3].credits > 0 ? yearStats[3].points / yearStats[3].credits : 0;
  const cgpa = totalGpaCredits > 0 ? totalWeightedPoints / totalGpaCredits : 0;

  return {
    totalWeightedPoints,
    totalGpaCredits,
    totalCurriculumGpaCredits,
    ungradedGpaCredits,
    totalModulesCount,
    gradedModulesCount,
    gradedCredits,
    totalCreditsCount,
    activeCompulsoryCount,
    activeCompulsoryCredits,
    yearStats,
    y1GPA,
    y2GPA,
    y3GPA,
    cgpa,
  };
}

const SEMESTER_ORDER = [
  { label: 'Y1S1', y: 1, s: 1 },
  { label: 'Y1S2', y: 1, s: 2 },
  { label: 'Y2S1', y: 2, s: 1 },
  { label: 'Y2S2', y: 2, s: 2 },
  { label: 'Y3S1', y: 3, s: 1 },
  { label: 'Y3S2', y: 3, s: 2 },
];

// Builds the rolling cumulative-GPA-by-semester series behind the
// Performance Trend chart. A semester only appears once at least one graded
// credit exists anywhere at or before it.
export function computeTrendData(activeModules, grades, gradeMap) {
  const trendData = [];
  let rollingPoints = 0;
  let rollingCredits = 0;
  let hasGradedAny = false;

  SEMESTER_ORDER.forEach((sem) => {
    const semModules = activeModules.filter((m) => m.y === sem.y && m.s === sem.s);
    let semPoints = 0;
    let semCredits = 0;

    semModules.forEach((mod) => {
      const grade = grades[mod.code] || '';
      if (grade !== '' && !mod.nonGpa) {
        semPoints += gradeMap[grade] * mod.cr;
        semCredits += mod.cr;
        hasGradedAny = true;
      }
    });

    rollingPoints += semPoints;
    rollingCredits += semCredits;

    if (hasGradedAny && rollingCredits > 0) {
      trendData.push({
        name: sem.label,
        gpa: parseFloat((rollingPoints / rollingCredits).toFixed(2)),
      });
    }
  });

  return trendData;
}

export const FIRST_CLASS_GPA = 3.7;
export const SECOND_UPPER_GPA = 3.3;
export const SECOND_LOWER_GPA = 3.0;
export const MIN_SAFE_GPA = 2.0;

export const GPA_TIER = {
  AWAITING: 'awaiting',
  RISK: 'risk',
  PASS: 'pass',
  LOWER: 'lower',
  UPPER: 'upper',
  FIRST: 'first',
};

// Canonical names for each tier — one wording, used by every display.
export const TIER_LABELS = {
  [GPA_TIER.AWAITING]: 'AWAITING DATA',
  [GPA_TIER.RISK]: 'ACADEMIC RISK',
  [GPA_TIER.PASS]: 'PASS STANDING',
  [GPA_TIER.LOWER]: 'SECOND CLASS LOWER',
  [GPA_TIER.UPPER]: 'SECOND CLASS UPPER',
  [GPA_TIER.FIRST]: 'FIRST CLASS HONOURS',
};

// Abbreviations for the medal face, where only a few characters fit.
export const TIER_SHORT_LABELS = {
  [GPA_TIER.RISK]: 'RISK',
  [GPA_TIER.PASS]: 'PASS',
  [GPA_TIER.LOWER]: '2:2',
  [GPA_TIER.UPPER]: '2:1',
  [GPA_TIER.FIRST]: '1ST',
};

const TIER_EPSILON = 1e-9;

const meetsThreshold = (gpa, threshold) => gpa >= threshold - TIER_EPSILON;

export function getGpaTier(gpa, hasGradedCredits) {
  if (!hasGradedCredits) return GPA_TIER.AWAITING;
  if (meetsThreshold(gpa, FIRST_CLASS_GPA)) return GPA_TIER.FIRST;
  if (meetsThreshold(gpa, SECOND_UPPER_GPA)) return GPA_TIER.UPPER;
  if (meetsThreshold(gpa, SECOND_LOWER_GPA)) return GPA_TIER.LOWER;
  if (meetsThreshold(gpa, MIN_SAFE_GPA)) return GPA_TIER.PASS;
  return GPA_TIER.RISK;
}

// True when a graded GPA sits below the pass threshold — including a 0.00
// earned by failing, which is the single most at-risk case there is.
export function isAtRiskGpa(gpa, hasGradedCredits) {
  return getGpaTier(gpa, hasGradedCredits) === GPA_TIER.RISK;
}

// Maps a letter grade to the border/text color tier shown on each grade
// selector (blue for A-tier, dark blue for B-tier, orange for C-tier, red
// for everything else including ungraded... actually ungraded gets neutral).
export function getGradeBorderClass(grade) {
  if (!grade) return 'border-hairline text-muted-text';
  if (grade === 'Pass' || grade.startsWith('A')) return 'border-m-blue-light text-m-blue-light';
  if (grade.startsWith('B')) return 'border-m-blue-dark text-m-blue-dark';
  if (grade === 'C+' || grade === 'C') return 'border-m-orange text-m-orange';
  return 'border-m-red text-m-red';
}
