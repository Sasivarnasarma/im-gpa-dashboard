import { describe, it, expect } from 'vitest';
import {
  getActiveModules,
  computeGpaStats,
  computeSemesterStats,
  computeTrendData,
  getGpaTier,
  isAtRiskGpa,
  GPA_TIER,
  sortModules,
} from '../../src/lib/gpaEngine';
import { modules, gradeMap } from '../../src/data/modules';

describe('sortModules', () => {
  it('orders compulsory modules by credits, then optional modules, with flexible courses last', () => {
    const rows = [
      { code: 'flexible', cr: 3, optional: true, flexibleSemester: true },
      { code: 'optional', cr: 6, optional: true },
      { code: 'other', cr: 1 },
      { code: 'three', cr: 3 },
      { code: 'research', cr: 6 },
      { code: 'another-three', cr: 3 },
    ];
    expect(sortModules(rows).map((m) => m.code)).toEqual([
      'research',
      'three',
      'another-three',
      'other',
      'optional',
      'flexible',
    ]);
    expect(rows[0].code).toBe('flexible');
  });
});

// Self-contained curriculum test fixture covering all module variations
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
    expect(labels).toEqual(['Y2S2', 'Y3S1', 'Y3S2', 'Y4S1', 'Y4S2']);
    expect(trend[0].gpa).toBe(4.0);
    // Rolling average after both: (4.0*3 + 2.0*3) / 6 = 3.0, then flat.
    expect(trend[1].gpa).toBe(3.0);
    expect(trend[2].gpa).toBe(3.0);
  });
});

describe('getGpaTier', () => {
  it('reports AWAITING only when nothing has been graded', () => {
    expect(getGpaTier(0, false)).toBe(GPA_TIER.AWAITING);
  });

  it('treats a graded 0.00 as academic risk, not as missing data', () => {
    expect(getGpaTier(0, true)).toBe(GPA_TIER.RISK);
    expect(isAtRiskGpa(0, true)).toBe(true);
    expect(isAtRiskGpa(0, false)).toBe(false);
  });

  it('places each GPA in the handbook tier for its value', () => {
    expect(getGpaTier(4.0, true)).toBe(GPA_TIER.FIRST);
    expect(getGpaTier(3.7, true)).toBe(GPA_TIER.FIRST);
    expect(getGpaTier(3.69, true)).toBe(GPA_TIER.UPPER);
    expect(getGpaTier(3.3, true)).toBe(GPA_TIER.UPPER);
    expect(getGpaTier(3.29, true)).toBe(GPA_TIER.LOWER);
    expect(getGpaTier(3.0, true)).toBe(GPA_TIER.LOWER);
    expect(getGpaTier(2.99, true)).toBe(GPA_TIER.PASS);
    expect(getGpaTier(2.0, true)).toBe(GPA_TIER.PASS);
    expect(getGpaTier(1.99, true)).toBe(GPA_TIER.RISK);
  });

  it('treats each classification boundary as inclusive of its own tier', () => {
    expect(isAtRiskGpa(2.0, true)).toBe(false);
    expect(getGpaTier(3.7, true)).toBe(GPA_TIER.FIRST);
  });
});

describe('getGpaTier — floating point boundaries', () => {
  it('classifies a GPA that lands exactly on a threshold into the higher tier', () => {
    const cgpa = (3.3 * 3 + 3.3 * 3) / 6;
    expect(cgpa).toBeLessThan(3.3); // the hazard this guards against
    expect(getGpaTier(cgpa, true)).toBe(GPA_TIER.UPPER);
  });

  it('classifies every threshold reached by repeated accumulation', () => {
    const viaAccumulation = (grade) => (grade * 3 + grade * 3) / 6;
    expect(getGpaTier(viaAccumulation(3.7), true)).toBe(GPA_TIER.FIRST);
    expect(getGpaTier(viaAccumulation(3.3), true)).toBe(GPA_TIER.UPPER);
    expect(getGpaTier(viaAccumulation(3.0), true)).toBe(GPA_TIER.LOWER);
    expect(getGpaTier(viaAccumulation(2.0), true)).toBe(GPA_TIER.PASS);
  });

  it('does not promote a GPA that is genuinely below a threshold', () => {
    // Tolerance absorbs float noise only — it must not lift a real shortfall.
    expect(getGpaTier(3.29, true)).toBe(GPA_TIER.LOWER);
    expect(getGpaTier(3.2999, true)).toBe(GPA_TIER.LOWER);
    expect(getGpaTier(1.999, true)).toBe(GPA_TIER.RISK);
  });
});

const yearFour = (pathway = 'it', spec = 'undecided', placements) =>
  getActiveModules(modules, pathway, spec, placements).filter((m) => m.y === 4);
const codes = (rows) => rows.map((m) => m.code);

describe('fourth-year curriculum and GPA', () => {
  it('has the 13 IT modules and exactly the five compulsory modules from Table 2', () => {
    const rows = yearFour();
    expect(rows).toHaveLength(13);
    expect(codes(rows.filter((m) => !m.optional))).toEqual([
      'INTE 43216',
      'MGTE 41313',
      'MGTE 41323',
      'INTE 41393',
      'MGTE 42303',
    ]);
    expect(rows.reduce((sum, m) => sum + m.cr, 0)).toBe(42);
    expect(rows.filter((m) => !m.optional).reduce((sum, m) => sum + m.cr, 0)).toBe(18);
  });

  it.each([
    ['bse', ['MGTE 43216', 'MGTE 41313', 'MGTE 41323', 'MGTE 41333', 'MGTE 42213']],
    ['oscm', ['MGTE 43216', 'MGTE 41313', 'MGTE 41323', 'MGTE 41343', 'MGTE 42323']],
    ['is', ['INTE 43216', 'MGTE 41313', 'MGTE 41323', 'INTE 41283', 'MGTE 41303']],
  ])(
    'classifies MIT %s compulsory modules and excludes the other research project',
    (spec, required) => {
      const rows = yearFour('mit', spec);
      expect(rows).toHaveLength(20);
      expect(codes(rows.filter((m) => !m.optional)).sort()).toEqual([...required].sort());
      expect(rows.filter((m) => !m.optional).reduce((sum, m) => sum + m.cr, 0)).toBe(18);
      expect(rows.filter((m) => m.spansSemesters)).toHaveLength(1);
      expect(rows.filter((m) => m.flexibleSemester).map((m) => m.code)).toEqual([
        'MGTE 44273',
        'INTE 44303',
      ]);
    }
  );

  it('waits for a pathway and MIT specialization, without hiding IT research', () => {
    expect(yearFour('undecided')).toEqual([]);
    expect(yearFour('mit')).toEqual([]);
    expect(codes(yearFour())).toContain('INTE 43216');
  });

  it('counts research credits once and includes fourth-year grades in annual and cumulative GPA', () => {
    const active = getActiveModules(modules, 'it', 'undecided');
    const grades = { 'INTE 43216': 'A', 'INTE 42343': 'C', 'INTE 11213': 'B' };
    const stats = computeGpaStats(active, grades, gradeMap);
    expect(stats.totalGpaCredits).toBe(12);
    expect(stats.totalWeightedPoints).toBe(39);
    expect(stats.y4GPA).toBeCloseTo(30 / 9);
    expect(stats.cgpa).toBeCloseTo(39 / 12);
    const semesters = computeSemesterStats(active, grades, gradeMap);
    expect(semesters).toHaveLength(8);
    expect(semesters.find((s) => s.label === 'Y4S1').gpa).toBe(4);
    expect(semesters.find((s) => s.label === 'Y4S2').gpa).toBe(2);
    expect(computeTrendData(active, grades, gradeMap).at(-1)).toEqual({ name: 'Y4S2', gpa: 3.25 });
  });

  it('places only flexible modules and leaves source data and fixed-semester modules unchanged', () => {
    const rows = yearFour('mit', 'is', { 'MGTE 44273': 2, 'INTE 44303': 7, 'MGTE 41323': 2 });
    expect(rows.find((m) => m.code === 'MGTE 44273').s).toBe(2);
    expect(rows.find((m) => m.code === 'INTE 44303').s).toBe(2);
    expect(rows.find((m) => m.code === 'MGTE 41323').s).toBe(1);
    expect(modules.find((m) => m.code === 'MGTE 44273').s).toBe(1);
  });
});
