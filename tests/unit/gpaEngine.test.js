import { describe, it, expect } from 'vitest';
import { getActiveModules, computeGpaStats, computeTrendData } from '../../src/lib/gpaEngine';
import { gradeMap } from '../../src/data/modules';

// A small, self-contained fixture that exercises every branch the real
// curriculum does (common, pathway-specific, nonGpa, optional, Year 3
// specialization-gated) without depending on the real 47-entry data file —
// so these tests don't churn every time the curriculum content changes.
const fixture = [
  { code: 'Y1-COMMON', name: 'Year 1 Common', y: 1, s: 1, cr: 3 },
  { code: 'Y1-NONGPA', name: 'Year 1 Non-GPA', y: 1, s: 1, cr: 0, nonGpa: true },
  { code: 'Y2-BOTH', name: 'Year 2 Both', y: 2, s: 1, cr: 3, pathway: 'both' },
  { code: 'Y2-IT', name: 'Year 2 IT Only', y: 2, s: 1, cr: 3, pathway: 'it' },
  { code: 'Y2-MIT', name: 'Year 2 MIT Only', y: 2, s: 2, cr: 3, pathway: 'mit' },
  {
    code: 'Y3-MIT-BSE-COMPULSORY',
    name: 'Year 3 MIT, compulsory for BSE',
    y: 3,
    s: 1,
    cr: 3,
    pathway: 'mit',
    specCompulsory: ['bse'],
    specOptional: ['oscm'],
  },
  {
    code: 'Y3-OPTIONAL',
    name: 'Year 3 optional elective',
    y: 3,
    s: 1,
    cr: 2,
    optional: true,
    pathway: 'both',
  },
];

describe('getActiveModules', () => {
  it('shows only Year 1 modules when pathway is undecided', () => {
    const active = getActiveModules(fixture, null, 'undecided');
    expect(active.map((m) => m.code)).toEqual(['Y1-COMMON', 'Y1-NONGPA']);
  });

  it('includes common + IT-specific modules, excludes MIT-specific, for the IT pathway', () => {
    const active = getActiveModules(fixture, 'it', 'undecided');
    const codes = active.map((m) => m.code);
    expect(codes).toContain('Y2-BOTH');
    expect(codes).toContain('Y2-IT');
    expect(codes).not.toContain('Y2-MIT');
  });

  it('hides Year 3 entirely for MIT pathway until a specialization is chosen', () => {
    const active = getActiveModules(fixture, 'mit', 'undecided');
    expect(active.some((m) => m.y === 3)).toBe(false);
  });

  it('marks a Year 3 MIT module compulsory only for the specialization it lists', () => {
    const forBse = getActiveModules(fixture, 'mit', 'bse');
    const bseModule = forBse.find((m) => m.code === 'Y3-MIT-BSE-COMPULSORY');
    expect(bseModule.optional).toBe(false);

    const forOscm = getActiveModules(fixture, 'mit', 'oscm');
    const oscmModule = forOscm.find((m) => m.code === 'Y3-MIT-BSE-COMPULSORY');
    expect(oscmModule.optional).toBe(true);
  });
});

describe('computeGpaStats', () => {
  it('reports zero CGPA and full ungraded credits when nothing is graded', () => {
    const active = getActiveModules(fixture, null, 'undecided');
    const stats = computeGpaStats(active, {}, gradeMap);

    expect(stats.cgpa).toBe(0);
    expect(stats.totalGpaCredits).toBe(0);
    // Y1-COMMON (3 credits, GPA-eligible) is ungraded; Y1-NONGPA is excluded
    // from GPA credits entirely because it's flagged nonGpa.
    expect(stats.ungradedGpaCredits).toBe(3);
    expect(stats.gradedModulesCount).toBe(0);
  });

  it('computes a weighted CGPA once a grade is entered', () => {
    const active = getActiveModules(fixture, null, 'undecided');
    const stats = computeGpaStats(active, { 'Y1-COMMON': 'A+' }, gradeMap);

    expect(stats.totalGpaCredits).toBe(3);
    expect(stats.totalWeightedPoints).toBe(4.0 * 3);
    expect(stats.cgpa).toBe(4.0);
    expect(stats.ungradedGpaCredits).toBe(0);
    expect(stats.gradedModulesCount).toBe(1);
  });

  it('excludes nonGpa modules from GPA credits even when graded', () => {
    // Y1-NONGPA has cr: 0 in the fixture, so this also guards against a
    // regression where nonGpa credits leak into totalGpaCredits.
    const active = getActiveModules(fixture, null, 'undecided');
    const stats = computeGpaStats(active, { 'Y1-NONGPA': 'Pass' }, gradeMap);
    expect(stats.totalGpaCredits).toBe(0);
    expect(stats.cgpa).toBe(0);
  });

  it('only counts an optional module toward the compulsory-credit total once graded', () => {
    const active = getActiveModules(fixture, 'it', 'undecided');
    const ungraded = computeGpaStats(active, {}, gradeMap);
    const graded = computeGpaStats(active, { 'Y3-OPTIONAL': 'B+' }, gradeMap);

    // Y3-OPTIONAL (2 credits) shouldn't inflate activeCompulsoryCredits until
    // it's actually graded — that's what lets the navbar's "X / Y credits"
    // denominator grow only as electives get picked up.
    expect(ungraded.activeCompulsoryCredits).toBe(graded.activeCompulsoryCredits - 2);
    expect(graded.gradedCredits).toBe(ungraded.gradedCredits + 2);
  });

  it('splits per-year GPA independently of the cumulative figure', () => {
    const active = getActiveModules(fixture, 'mit', 'oscm');
    const stats = computeGpaStats(
      active,
      { 'Y2-MIT': 'C', 'Y3-MIT-BSE-COMPULSORY': 'A+' },
      gradeMap
    );

    expect(stats.yearStats[2].credits).toBe(3);
    expect(stats.y2GPA).toBeCloseTo(2.0);
    expect(stats.y3GPA).toBeCloseTo(4.0);
    // Cumulative blends both years: (2.0*3 + 4.0*3) / 6 = 3.0
    expect(stats.cgpa).toBeCloseTo(3.0);
  });
});

describe('computeTrendData', () => {
  it('produces no points until at least one semester has a graded credit', () => {
    const active = getActiveModules(fixture, null, 'undecided');
    expect(computeTrendData(active, {}, gradeMap)).toEqual([]);
  });

  it('carries the cumulative GPA forward once grading starts', () => {
    const active = getActiveModules(fixture, 'mit', 'oscm');
    const trend = computeTrendData(
      active,
      { 'Y2-MIT': 'A+', 'Y3-MIT-BSE-COMPULSORY': 'C' },
      gradeMap
    );

    // Y2-MIT is Y2S2, Y3-MIT-BSE-COMPULSORY is Y3S1 — a semester with no
    // graded modules in between (Y2S1) should not appear at all. Y3S2 has no
    // modules in this fixture either, but once grading has started the
    // cumulative line carries flat through every remaining semester.
    const labels = trend.map((p) => p.name);
    expect(labels).toEqual(['Y2S2', 'Y3S1', 'Y3S2']);
    expect(trend[0].gpa).toBe(4.0);
    // Rolling average after both: (4.0*3 + 2.0*3) / 6 = 3.0, then flat.
    expect(trend[1].gpa).toBe(3.0);
    expect(trend[2].gpa).toBe(3.0);
  });
});
