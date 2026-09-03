import {
  FIRST_CLASS_GPA,
  SECOND_UPPER_GPA,
  SECOND_LOWER_GPA,
  MIN_SAFE_GPA,
  GPA_TIER,
} from './gpaEngine';

// Degree eligibility and honours classification engine for BSc (IT/MIT) exit degrees.
// Criteria project into three states: 'met', 'pending', and 'failed'.
export const STATUS = { MET: 'met', PENDING: 'pending', FAILED: 'failed' };

// Grade-point floors, read through gradeMap so they track the grading scale.
const POINTS = { A: 4.0, B: 3.0, C: 2.0, D: 1.0 };

// Handbook thresholds for the three-year exit degree.
export const EXIT_DEGREE_RULES = {
  minYear12Credits: 72,
  minTotalCredits: 102,
  minYear3Credits: 30,
  minCreditsAtC: 85,
  minGpa: MIN_SAFE_GPA,
  // Courses that must be passed at a specific standard, by code.
  requireCOrBetter: ['INTE 31356', 'GNCT 32216'],
  requirePass: ['GNCT 11212', 'GNCT 24212'],
  // Second Class (either division) needs this many credits at C or better.
  classCreditsAtC: 99,
};

const isGraded = (grades, code) => (grades[code] ?? '') !== '';

// Resolves criterion status based on current progress, target, and remaining headroom
function thresholdStatus(current, target, remaining) {
  if (current >= target) return STATUS.MET;
  if (current + remaining < target) return STATUS.FAILED;
  return STATUS.PENDING;
}

// Splits the active curriculum into the figures both assessments need.
function summarise(activeModules, grades, gradeMap) {
  const gpaModules = activeModules.filter((m) => !m.nonGpa);

  let creditsAtC = 0; // graded C or better
  let creditsAtD = 0; // graded D or better
  let creditsAtA = 0; // graded A or better
  let creditsAtB = 0; // graded B or better
  let gradedGpaCredits = 0;
  let ungradedGpaCredits = 0;
  let year12Credits = 0; // Y1+Y2, graded D or better
  let year3Credits = 0; // Y3, graded D or better

  const belowC = []; // graded GPA courses under C
  const belowD = []; // graded GPA courses under D

  gpaModules.forEach((mod) => {
    const grade = grades[mod.code] ?? '';
    if (grade === '') {
      ungradedGpaCredits += mod.cr;
      return;
    }
    const points = gradeMap[grade] ?? 0;
    gradedGpaCredits += mod.cr;

    if (points >= POINTS.A) creditsAtA += mod.cr;
    if (points >= POINTS.B) creditsAtB += mod.cr;
    if (points >= POINTS.C) creditsAtC += mod.cr;
    if (points >= POINTS.D) {
      creditsAtD += mod.cr;
      if (mod.y === 3) year3Credits += mod.cr;
      else year12Credits += mod.cr;
    } else {
      belowD.push(mod);
    }
    if (points < POINTS.C) belowC.push(mod);
  });

  // Headroom by year, for the per-year credit thresholds.
  const ungradedBy = (pred) =>
    gpaModules
      .filter((m) => pred(m) && !isGraded(grades, m.code))
      .reduce((total, m) => total + m.cr, 0);

  return {
    gpaModules,
    creditsAtA,
    creditsAtB,
    creditsAtC,
    creditsAtD,
    gradedGpaCredits,
    ungradedGpaCredits,
    year12Credits,
    year3Credits,
    ungradedYear12: ungradedBy((m) => m.y !== 3),
    ungradedYear3: ungradedBy((m) => m.y === 3),
    belowC,
    belowD,
    curriculumGpaCredits: gpaModules.reduce((total, m) => total + m.cr, 0),
  };
}

// Named-course requirements: a specific course at a specific standard.
function namedCourseCriteria(activeModules, grades, gradeMap) {
  const byCode = new Map(activeModules.map((m) => [m.code, m]));
  const criteria = [];

  EXIT_DEGREE_RULES.requireCOrBetter.forEach((code) => {
    const mod = byCode.get(code);
    if (!mod) return; // not in this pathway's curriculum
    const grade = grades[code] ?? '';
    const points = gradeMap[grade] ?? 0;
    criteria.push({
      id: `c-or-better-${code}`,
      label: `Grade C or better in ${mod.name}`,
      detail: code,
      status: grade === '' ? STATUS.PENDING : points >= POINTS.C ? STATUS.MET : STATUS.FAILED,
      current: grade || null,
    });
  });

  EXIT_DEGREE_RULES.requirePass.forEach((code) => {
    const mod = byCode.get(code);
    if (!mod) return;
    const grade = grades[code] ?? '';
    criteria.push({
      id: `pass-${code}`,
      label: `Pass ${mod.name}`,
      detail: code,
      status: grade === '' ? STATUS.PENDING : grade === 'Pass' ? STATUS.MET : STATUS.FAILED,
      current: grade || null,
    });
  });

  return criteria;
}

// Assesses overall degree eligibility criteria (credit floors, minimum GPA, named courses)
export function assessEligibility(activeModules, grades, gradeMap, cgpa) {
  const s = summarise(activeModules, grades, gradeMap);
  const R = EXIT_DEGREE_RULES;

  const criteria = [
    {
      id: 'year12-credits',
      label: `${R.minYear12Credits} credits from Years 1 and 2 at D or better`,
      status: thresholdStatus(s.year12Credits, R.minYear12Credits, s.ungradedYear12),
      current: s.year12Credits,
      target: R.minYear12Credits,
    },
    {
      id: 'year3-credits',
      label: `${R.minYear3Credits} credits from Year 3 at D or better`,
      status: thresholdStatus(s.year3Credits, R.minYear3Credits, s.ungradedYear3),
      current: s.year3Credits,
      target: R.minYear3Credits,
    },
    {
      id: 'total-credits',
      label: `${R.minTotalCredits} credits across all three years`,
      status: thresholdStatus(s.creditsAtD, R.minTotalCredits, s.ungradedGpaCredits),
      current: s.creditsAtD,
      target: R.minTotalCredits,
    },
    {
      id: 'credits-at-c',
      label: `${R.minCreditsAtC} credits at C or better`,
      status: thresholdStatus(s.creditsAtC, R.minCreditsAtC, s.ungradedGpaCredits),
      current: s.creditsAtC,
      target: R.minCreditsAtC,
    },
    ...namedCourseCriteria(activeModules, grades, gradeMap),
    {
      id: 'min-gpa',
      label: `Cumulative GPA of ${R.minGpa.toFixed(2)} or above`,
      // GPA can move in either direction while credits remain, so it is only
      // final once everything is graded.
      status:
        cgpa >= R.minGpa
          ? s.ungradedGpaCredits === 0
            ? STATUS.MET
            : STATUS.PENDING
          : s.ungradedGpaCredits === 0
            ? STATUS.FAILED
            : STATUS.PENDING,
      current: cgpa,
      target: R.minGpa,
      isGpa: true,
    },
  ];

  return {
    criteria,
    failed: criteria.filter((c) => c.status === STATUS.FAILED),
    eligible: criteria.every((c) => c.status === STATUS.MET),
    // The handbook also caps the degree at five consecutive academic years.
    // The app holds no enrolment dates, so that one cannot be assessed here.
    untrackable: 'Completion within five consecutive academic years',
  };
}

// Assesses honours classifications across First Class, Second Upper, and Second Lower
export function assessClasses(activeModules, grades, gradeMap, cgpa) {
  const s = summarise(activeModules, grades, gradeMap);
  const R = EXIT_DEGREE_RULES;
  const halfCredits = s.curriculumGpaCredits / 2;

  const allAtLeastC =
    s.belowC.length > 0 ? STATUS.FAILED : s.ungradedGpaCredits > 0 ? STATUS.PENDING : STATUS.MET;

  const gpaCriterion = (threshold) => ({
    id: `gpa-${threshold}`,
    label: `Cumulative GPA of ${threshold.toFixed(2)} or above`,
    status:
      cgpa >= threshold
        ? s.ungradedGpaCredits === 0
          ? STATUS.MET
          : STATUS.PENDING
        : s.ungradedGpaCredits === 0
          ? STATUS.FAILED
          : STATUS.PENDING,
    current: cgpa,
    target: threshold,
    isGpa: true,
  });

  const first = {
    tier: 'first',
    label: 'First Class Honours',
    criteria: [
      {
        id: 'first-all-c',
        label: 'Grade C or better in every course counted for GPA',
        status: allAtLeastC,
        detail:
          s.belowC.length > 0
            ? `${s.belowC.length} course${s.belowC.length > 1 ? 's' : ''} below C`
            : null,
        offenders: s.belowC.map((m) => ({ code: m.code, name: m.name, grade: grades[m.code] })),
      },
      {
        id: 'first-half-a',
        label: 'Grade A or better across at least half your credits',
        status: thresholdStatus(s.creditsAtA, halfCredits, s.ungradedGpaCredits),
        current: s.creditsAtA,
        target: halfCredits,
      },
      gpaCriterion(FIRST_CLASS_GPA),
    ],
  };

  const secondClass = (tier, label, threshold) => ({
    tier,
    label,
    criteria: [
      {
        id: `${tier}-credits-at-c`,
        label: `${R.classCreditsAtC} credits at C or better, including every compulsory course`,
        status: thresholdStatus(s.creditsAtC, R.classCreditsAtC, s.ungradedGpaCredits),
        current: s.creditsAtC,
        target: R.classCreditsAtC,
      },
      {
        id: `${tier}-remaining-at-d`,
        label: 'Grade D or better in the remaining courses',
        status:
          s.belowD.length > 0
            ? STATUS.FAILED
            : s.ungradedGpaCredits > 0
              ? STATUS.PENDING
              : STATUS.MET,
        detail:
          s.belowD.length > 0
            ? `${s.belowD.length} course${s.belowD.length > 1 ? 's' : ''} below D`
            : null,
        offenders: s.belowD.map((m) => ({ code: m.code, name: m.name, grade: grades[m.code] })),
      },
      {
        id: `${tier}-half-b`,
        label: 'Grade B or better across at least half your credits',
        status: thresholdStatus(s.creditsAtB, halfCredits, s.ungradedGpaCredits),
        current: s.creditsAtB,
        target: halfCredits,
      },
      gpaCriterion(threshold),
    ],
  });

  const classes = [
    first,
    secondClass('upper', 'Second Class (Upper Division)', SECOND_UPPER_GPA),
    secondClass('lower', 'Second Class (Lower Division)', SECOND_LOWER_GPA),
  ];

  // A class is blocked when any criterion has already been lost, and still
  // reachable when nothing has failed.
  classes.forEach((c) => {
    c.blocked = c.criteria.some((x) => x.status === STATUS.FAILED);
    c.achieved = c.criteria.every((x) => x.status === STATUS.MET);
    c.blockers = c.criteria.filter((x) => x.status === STATUS.FAILED);
  });

  return {
    classes,
    // The best class nothing has ruled out yet.
    highestReachable: classes.find((c) => !c.blocked) ?? null,
    highestAchieved: classes.find((c) => c.achieved) ?? null,
    complete: s.ungradedGpaCredits === 0,
  };
}

// Resolves highest reachable honours class permitted by both GPA and handbook criteria
export function resolveAwardTier(gpaTier, classes) {
  const HONOURS_ORDER = [GPA_TIER.FIRST, GPA_TIER.UPPER, GPA_TIER.LOWER];
  if (!HONOURS_ORDER.includes(gpaTier)) return gpaTier;

  const blocked = new Set(classes.classes.filter((c) => c.blocked).map((c) => c.tier));

  // Only classes at or below the GPA standing are candidates.
  const candidates = HONOURS_ORDER.slice(HONOURS_ORDER.indexOf(gpaTier));
  const awarded = candidates.find((tier) => !blocked.has(tier));

  // Every honours class ruled out, but the GPA still clears the pass mark.
  return awarded ?? GPA_TIER.PASS;
}
