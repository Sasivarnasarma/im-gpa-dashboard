import { describe, it, expect } from 'vitest';
import {
  assessClasses,
  assessEligibility,
  resolveAwardTier,
  STATUS,
} from '../../src/lib/degreeAudit';
import { modules, gradeMap } from '../../src/data/modules';
import { getActiveModules, computeGpaStats, getGpaTier, GPA_TIER } from '../../src/lib/gpaEngine';

// Preserve coverage of the three-year exit-degree rules separately from honours.
const active = getActiveModules(modules, 'it', 'undecided').filter((m) => m.y <= 3);
const gpaModules = active.filter((m) => !m.nonGpa && m.cr > 0);

// Grades every GPA-bearing course, then applies the given overrides.
function transcript(defaultGrade, overrides = {}) {
  const grades = {};
  gpaModules.forEach((m) => {
    grades[m.code] = defaultGrade;
  });
  active
    .filter((m) => m.gradeType === 'passfail')
    .forEach((m) => {
      grades[m.code] = 'Pass';
    });
  return { ...grades, ...overrides };
}

const cgpaOf = (grades) => computeGpaStats(active, grades, gradeMap).cgpa;

const criterion = (result, id) => result.criteria.find((c) => c.id === id);
const classFor = (result, tier) => result.classes.find((c) => c.tier === tier);

describe('assessClasses — First Class needs more than the GPA threshold', () => {
  it('blocks First Class when a single course is below C, despite a high GPA', () => {
    // First Class requires grade C or better across every GPA course
    const grades = transcript('A+', { [gpaModules[0].code]: 'D' });
    const cgpa = cgpaOf(grades);
    const result = assessClasses(active, grades, gradeMap, cgpa);
    const first = classFor(result, 'first');

    expect(cgpa).toBeGreaterThan(3.7);
    expect(criterion(first, 'first-all-c').status).toBe(STATUS.FAILED);
    expect(first.blocked).toBe(true);
    expect(first.achieved).toBe(false);
  });

  it('names the courses that block the class, so the reason is actionable', () => {
    const grades = transcript('A+', { [gpaModules[0].code]: 'D' });
    const result = assessClasses(active, grades, gradeMap, cgpaOf(grades));
    const blocker = criterion(classFor(result, 'first'), 'first-all-c');

    expect(blocker.offenders).toHaveLength(1);
    expect(blocker.offenders[0].code).toBe(gpaModules[0].code);
    expect(blocker.offenders[0].grade).toBe('D');
  });

  it('awards First Class when every criterion is met', () => {
    const grades = transcript('A+');
    const result = assessClasses(active, grades, gradeMap, cgpaOf(grades));
    const first = classFor(result, 'first');

    expect(first.achieved).toBe(true);
    expect(first.blocked).toBe(false);
    expect(result.highestAchieved.tier).toBe('first');
  });

  it('falls back to Second Upper for a D in an optional course', () => {
    const optional = gpaModules.find((m) => m.optional);
    const grades = transcript('A+', { [optional.code]: 'D' });
    const result = assessClasses(active, grades, gradeMap, cgpaOf(grades));

    expect(classFor(result, 'first').blocked).toBe(true);
    expect(result.highestReachable.tier).toBe('upper');
  });

  it('treats an ungraded curriculum as pending rather than failed', () => {
    const result = assessClasses(active, {}, gradeMap, 0);
    const first = classFor(result, 'first');

    expect(first.blocked).toBe(false);
    expect(first.achieved).toBe(false);
    expect(criterion(first, 'first-all-c').status).toBe(STATUS.PENDING);
    expect(result.complete).toBe(false);
  });

  it('requires A or better across half the credits, not merely a high average', () => {
    // A- (3.7) does not count toward the A (4.0) threshold
    const grades = transcript('A-');
    const result = assessClasses(active, grades, gradeMap, cgpaOf(grades));
    const halfA = criterion(classFor(result, 'first'), 'first-half-a');

    expect(halfA.current).toBe(0);
    expect(halfA.status).toBe(STATUS.FAILED);
  });
});

describe('assessEligibility — the degree itself, separate from its class', () => {
  it('fails eligibility when a named compulsory course is failed, whatever the GPA', () => {
    // A strong transcript with an E in the Software Development Project.
    const grades = transcript('A+', { 'INTE 31356': 'E' });
    const result = assessEligibility(active, grades, gradeMap, cgpaOf(grades));
    const named = criterion(result, 'c-or-better-INTE 31356');

    expect(named.status).toBe(STATUS.FAILED);
    expect(result.eligible).toBe(false);
    expect(result.failed.map((c) => c.id)).toContain('c-or-better-INTE 31356');
  });

  it('fails eligibility when a pass/fail course is failed', () => {
    const grades = transcript('A+', { 'GNCT 11212': 'Fail' });
    const result = assessEligibility(active, grades, gradeMap, cgpaOf(grades));

    expect(criterion(result, 'pass-GNCT 11212').status).toBe(STATUS.FAILED);
    expect(result.eligible).toBe(false);
  });

  it('grants eligibility on a complete, passing transcript', () => {
    const grades = transcript('A+');
    const result = assessEligibility(active, grades, gradeMap, cgpaOf(grades));

    expect(result.failed).toHaveLength(0);
    expect(result.eligible).toBe(true);
  });

  it('reports credit thresholds as pending, not failed, while courses remain ungraded', () => {
    const result = assessEligibility(active, {}, gradeMap, 0);

    expect(criterion(result, 'year12-credits').status).toBe(STATUS.PENDING);
    expect(criterion(result, 'credits-at-c').status).toBe(STATUS.PENDING);
    expect(result.failed).toHaveLength(0);
  });

  it('marks a credit threshold failed once the remaining credits cannot reach it', () => {
    // Fail everything: no credits can ever be earned from a graded E.
    const grades = transcript('E');
    const result = assessEligibility(active, grades, gradeMap, cgpaOf(grades));

    expect(criterion(result, 'credits-at-c').status).toBe(STATUS.FAILED);
    expect(criterion(result, 'total-credits').status).toBe(STATUS.FAILED);
  });

  it('surfaces the time limit as untracked rather than silently passing it', () => {
    const result = assessEligibility(active, transcript('A+'), gradeMap, 4);
    expect(result.untrackable).toMatch(/five consecutive academic years/i);
  });
});

describe('resolveAwardTier — the badge shows the class actually on offer', () => {
  it('demotes First Class to Second Upper when an optional course sits below C', () => {
    const optional = gpaModules.find((m) => m.optional);
    const grades = transcript('A+', { [optional.code]: 'D' });
    const cgpa = cgpaOf(grades);
    const classes = assessClasses(active, grades, gradeMap, cgpa);

    expect(getGpaTier(cgpa, true)).toBe(GPA_TIER.FIRST);
    expect(resolveAwardTier(GPA_TIER.FIRST, classes)).toBe(GPA_TIER.UPPER);
  });

  it('leaves an unblocked class alone', () => {
    const grades = transcript('A+');
    const classes = assessClasses(active, grades, gradeMap, cgpaOf(grades));
    expect(resolveAwardTier(GPA_TIER.FIRST, classes)).toBe(GPA_TIER.FIRST);
  });

  it('never promotes above the GPA standing', () => {
    // A clean transcript blocks nothing, but a 3.10 GPA is still only Lower.
    const grades = transcript('B');
    const classes = assessClasses(active, grades, gradeMap, cgpaOf(grades));
    expect(resolveAwardTier(GPA_TIER.LOWER, classes)).toBe(GPA_TIER.LOWER);
  });

  it('passes non-honours states straight through', () => {
    const classes = assessClasses(active, {}, gradeMap, 0);
    expect(resolveAwardTier(GPA_TIER.AWAITING, classes)).toBe(GPA_TIER.AWAITING);
    expect(resolveAwardTier(GPA_TIER.RISK, classes)).toBe(GPA_TIER.RISK);
    expect(resolveAwardTier(GPA_TIER.PASS, classes)).toBe(GPA_TIER.PASS);
  });

  it('falls back to a bare pass when every honours class is ruled out', () => {
    // An E blocks First (needs C), and both Second classes (need D or better
    // in the remainder), while the GPA still clears the 2.00 pass mark.
    const grades = transcript('A+', { [gpaModules[0].code]: 'E' });
    const classes = assessClasses(active, grades, gradeMap, cgpaOf(grades));
    expect(classes.classes.every((c) => c.blocked)).toBe(true);
    expect(resolveAwardTier(GPA_TIER.FIRST, classes)).toBe(GPA_TIER.PASS);
  });
});

describe('four-year honours audit', () => {
  it.each([
    ['it', 'undecided', 'INTE 43216'],
    ['mit', 'bse', 'MGTE 43216'],
    ['mit', 'is', 'INTE 43216'],
  ])('uses 132 / 105 / 117 credit thresholds for %s %s', (pathway, spec, research) => {
    const active = getActiveModules(modules, pathway, spec);
    const grades = Object.fromEntries(
      active.map((m) => [m.code, m.gradeType === 'passfail' ? 'Pass' : 'A'])
    );
    const stats = computeGpaStats(active, grades, gradeMap);
    const audit = assessEligibility(active, grades, gradeMap, stats.cgpa);
    expect(audit.eligible).toBe(true);
    expect(audit.criteria.find((c) => c.id === 'total-credits').target).toBe(132);
    expect(audit.criteria.find((c) => c.id === 'credits-at-c').target).toBe(105);
    expect(audit.criteria.find((c) => c.id === 'year4-credits').target).toBe(30);
    expect(audit.criteria.find((c) => c.id === 'year12-credits').current).toBe(
      active.filter((m) => m.y <= 2 && !m.nonGpa).reduce((sum, m) => sum + m.cr, 0)
    );
    expect(audit.untrackable).toMatch(/six/);
    const classes = assessClasses(active, grades, gradeMap, stats.cgpa);
    expect(classes.classes[1].criteria.find((c) => c.id === 'upper-credits-at-c').target).toBe(117);
    expect(
      assessEligibility(active, { ...grades, [research]: 'D' }, gradeMap, 3.9).failed.map(
        (c) => c.id
      )
    ).toContain(`c-or-better-${research}`);
  });
});

describe('handbook audit safeguards', () => {
  it.each([
    ['it', 'undecided'],
    ['mit', 'bse'],
    ['mit', 'oscm'],
    ['mit', 'is'],
  ])(
    'keeps an exact B+ average in Second Upper for %s %s despite floating-point drift',
    (pathway, specialization) => {
      const active = getActiveModules(modules, pathway, specialization);
      const grades = Object.fromEntries(
        active.map((m) => [m.code, m.gradeType === 'passfail' ? 'Pass' : 'B+'])
      );
      const { cgpa } = computeGpaStats(active, grades, gradeMap);
      expect(cgpa).toBeCloseTo(3.3, 12);
      const classes = assessClasses(active, grades, gradeMap, cgpa);
      expect(classes.highestAchieved.tier).toBe('upper');
      expect(resolveAwardTier(getGpaTier(cgpa, true), classes)).toBe(GPA_TIER.UPPER);
    }
  );

  it.each([2, 3, 3.3, 3.7])(
    'allows calculation drift at %s without promoting a genuinely lower GPA',
    (threshold) => {
      const grades = transcript('A');
      const assess = (gpa) =>
        threshold === 2
          ? criterion(assessEligibility(active, grades, gradeMap, gpa), 'min-gpa')
          : criterion(
              classFor(
                assessClasses(active, grades, gradeMap, gpa),
                threshold === 3 ? 'lower' : threshold === 3.3 ? 'upper' : 'first'
              ),
              `gpa-${threshold}`
            );
      expect(assess(threshold - 1e-12).status).toBe(STATUS.MET);
      expect(assess(threshold - 1e-6).status).toBe(STATUS.FAILED);
    }
  );

  const honourModules = getActiveModules(modules, 'it', 'undecided');
  const passing = Object.fromEntries(
    honourModules.map((m) => [m.code, m.gradeType === 'passfail' ? 'Pass' : 'A'])
  );
  const assess = (overrides = {}, courseList = honourModules) => {
    const grades = { ...passing, ...overrides };
    const cgpa = computeGpaStats(courseList, grades, gradeMap).cgpa;
    return {
      eligibility: assessEligibility(courseList, grades, gradeMap, cgpa),
      classes: assessClasses(courseList, grades, gradeMap, cgpa),
    };
  };

  it('rejects a failed compulsory course even when optional credits satisfy all credit floors', () => {
    const { eligibility, classes } = assess({ 'MGTE 41323': 'E' });
    expect(criterion(eligibility, 'total-credits').status).toBe(STATUS.MET);
    expect(criterion(eligibility, 'credits-at-c').status).toBe(STATUS.MET);
    expect(criterion(eligibility, 'compulsory-at-d').offenders).toEqual([
      expect.objectContaining({ code: 'MGTE 41323', grade: 'E' }),
    ]);
    expect(eligibility.eligible).toBe(false);
    expect(classes.highestAchieved).toBeNull();
    expect(classes.highestReachable).toBeNull();
    expect(classes.boardConsiderations).toEqual([]);
  });

  it('requires a passing grade in every entered elective counted for GPA', () => {
    const { eligibility } = assess({ 'INTE 41373': 'E' });
    expect(criterion(eligibility, 'total-credits').status).toBe(STATUS.MET);
    expect(criterion(eligibility, 'compulsory-at-d').status).toBe(STATUS.MET);
    expect(criterion(eligibility, 'remaining-at-d').status).toBe(STATUS.FAILED);
    expect(eligibility.eligible).toBe(false);
  });

  it.each(['D', 'D+', 'C-'])(
    'requires compulsory C grades for a standard second class, with %s flagged only for Board consideration',
    (grade) => {
      const { eligibility, classes } = assess({ 'MGTE 41323': grade });
      expect(eligibility.eligible).toBe(true);
      for (const tier of ['upper', 'lower']) {
        expect(criterion(classFor(classes, tier), `${tier}-compulsory-at-c`).status).toBe(
          STATUS.FAILED
        );
        expect(classFor(classes, tier).achieved).toBe(false);
      }
      expect(classes.highestAchieved).toBeNull();
      expect(classes.boardConsiderations).toEqual([
        expect.objectContaining({ tier: 'upper', credits: 3 }),
      ]);
      expect(resolveAwardTier(GPA_TIER.FIRST, classes)).toBe(GPA_TIER.PASS);
    }
  );

  it.each(['it', 'bse', 'oscm', 'is'])(
    'ignores an untaken elective in %s when the remaining transcript meets the requirements',
    (path) => {
      const courseList = getActiveModules(
        modules,
        path === 'it' ? 'it' : 'mit',
        path === 'it' ? 'undecided' : path
      );
      const grades = Object.fromEntries(
        courseList.map((m) => [m.code, m.gradeType === 'passfail' ? 'Pass' : 'A'])
      );
      const elective = courseList.find((m) => m.optional);
      delete grades[elective.code];
      const stats = computeGpaStats(courseList, grades, gradeMap);
      const eligibility = assessEligibility(courseList, grades, gradeMap, stats.cgpa);
      const classes = assessClasses(courseList, grades, gradeMap, stats.cgpa);
      expect(eligibility.eligible).toBe(true);
      expect(classes.complete).toBe(true);
      expect(classes.highestAchieved.tier).toBe('first');
      expect(criterion(classFor(classes, 'first'), 'first-half-a').target).toBe(
        stats.totalGpaCredits / 2
      );
      expect(criterion(classFor(classes, 'upper'), 'upper-half-b').target).toBe(
        stats.totalGpaCredits / 2
      );
    }
  );

  it('keeps an ungraded compulsory course pending despite surplus optional credits', () => {
    const { eligibility, classes } = assess({ 'MGTE 41323': '' });
    expect(criterion(eligibility, 'total-credits').status).toBe(STATUS.MET);
    expect(criterion(eligibility, 'compulsory-at-d').status).toBe(STATUS.PENDING);
    expect(eligibility.eligible).toBe(false);
    expect(classes.complete).toBe(false);
    expect(classes.highestAchieved).toBeNull();
    expect(classes.boardConsiderations).toEqual([]);
  });

  it.each(['', 'Fail'])(
    'does not achieve a class when a required pass/fail course is %s',
    (grade) => {
      const { eligibility, classes } = assess({ 'GNCT 11212': grade });
      expect(eligibility.eligible).toBe(false);
      expect(classes.highestAchieved).toBeNull();
      expect(classes.boardConsiderations).toEqual([]);
    }
  );

  it('keeps credit requirements pending when no electives have been taken and compulsory credits are insufficient', () => {
    const unselected = Object.fromEntries(
      honourModules.filter((m) => m.optional).map((m) => [m.code, ''])
    );
    const { eligibility, classes } = assess(unselected);
    expect(criterion(eligibility, 'total-credits').status).toBe(STATUS.PENDING);
    expect(eligibility.eligible).toBe(false);
    expect(classes.highestAchieved).toBeNull();
    expect(classes.complete).toBe(false);
  });

  it('allows Board consideration at four compulsory credits but not at five', () => {
    expect(assess({ 'PMAT 11212': 'C-', 'DELT 11232': 'D+' }).classes.boardConsiderations).toEqual([
      expect.objectContaining({ tier: 'upper', credits: 4 }),
    ]);
    expect(assess({ 'PMAT 11212': 'C-', 'MGTE 41323': 'D+' }).classes.boardConsiderations).toEqual(
      []
    );
  });

  it('offers possible Lower Division consideration only when all other Upper Division requirements are met', () => {
    const grades = Object.fromEntries(
      honourModules.filter((m) => !m.nonGpa).map((m) => [m.code, 'B+'])
    );
    Object.assign(grades, {
      'MGTE 41323': 'C-',
      'INTE 11213': 'A',
      'INTE 11223': 'A',
      'MGTE 11243': 'A',
    });
    const { classes } = assess(grades);
    expect(classes.highestAchieved).toBeNull();
    expect(classes.boardConsiderations).toEqual([
      expect.objectContaining({ tier: 'lower', credits: 3 }),
    ]);
    expect(
      assess({ ...grades, 'INTE 11213': 'B+', 'INTE 11223': 'B+', 'MGTE 11243': 'B+' }).classes
        .boardConsiderations
    ).toEqual([]);
  });

  it('does not waive the named research or internship C requirements for Board consideration', () => {
    expect(assess({ 'GNCT 32216': 'D' }).classes.boardConsiderations).toEqual([]);
    expect(assess({ 'INTE 43216': 'D' }).classes.boardConsiderations).toEqual([]);
  });

  it('does not count low optional grades toward the four-credit compulsory exception', () => {
    const { classes } = assess({ 'INTE 41373': 'D', 'MGTE 41323': 'D' });
    expect(classes.boardConsiderations).toEqual([
      expect.objectContaining({ tier: 'lower', credits: 3 }),
    ]);
    expect(classFor(classes, 'first').blocked).toBe(true);
    expect(assess({ 'INTE 41373': 'D' }).classes.boardConsiderations).toEqual([]);
  });
});
