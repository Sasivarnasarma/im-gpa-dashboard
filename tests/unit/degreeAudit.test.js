import { describe, it, expect } from 'vitest';
import {
  assessClasses,
  assessEligibility,
  resolveAwardTier,
  STATUS,
} from '../../src/lib/degreeAudit';
import { modules, gradeMap } from '../../src/data/modules';
import { getActiveModules, computeGpaStats, getGpaTier, GPA_TIER } from '../../src/lib/gpaEngine';

const active = getActiveModules(modules, 'it', 'undecided');
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

  it('falls back to the best class still reachable once First is blocked', () => {
    const grades = transcript('A+', { [gpaModules[0].code]: 'D' });
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
  it('demotes First Class to Second Upper when a course sits below C', () => {
    const grades = transcript('A+', { [gpaModules[0].code]: 'D' });
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
