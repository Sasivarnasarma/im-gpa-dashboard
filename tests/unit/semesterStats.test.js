import { describe, it, expect } from 'vitest';
import { computeSemesterStats, getActiveModules } from '../../src/lib/gpaEngine';
import { modules, gradeMap } from '../../src/data/modules';

const active = getActiveModules(modules, 'it', 'undecided');
const semesterOf = (result, label) => result.find((s) => s.label === label);

describe('computeSemesterStats — each semester on its own', () => {
  it('reports a semester with no grades as empty rather than zero-GPA', () => {
    const result = computeSemesterStats(active, {}, gradeMap);
    expect(semesterOf(result, 'Y1S1').hasGrades).toBe(false);
    expect(semesterOf(result, 'Y1S1').gpa).toBe(0);
  });

  it('averages only within its own semester, ignoring the others', () => {
    const y1s1 = active.filter((m) => m.y === 1 && m.s === 1 && !m.nonGpa && m.cr > 0);
    const y1s2 = active.filter((m) => m.y === 1 && m.s === 2 && !m.nonGpa && m.cr > 0);
    const grades = {};
    y1s1.forEach((m) => (grades[m.code] = 'A+'));
    y1s2.forEach((m) => (grades[m.code] = 'C'));

    const result = computeSemesterStats(active, grades, gradeMap);
    expect(semesterOf(result, 'Y1S1').gpa).toBeCloseTo(gradeMap['A+'], 10);
    expect(semesterOf(result, 'Y1S2').gpa).toBeCloseTo(gradeMap['C'], 10);
  });

  it('counts pass/fail modules as graded without letting them move the GPA', () => {
    const passfail = active.find((m) => m.gradeType === 'passfail');
    const result = computeSemesterStats(active, { [passfail.code]: 'Pass' }, gradeMap);
    const sem = semesterOf(result, `Y${passfail.y}S${passfail.s}`);

    expect(sem.gradedCount).toBe(1);
    expect(sem.hasGrades).toBe(false);
  });

  it('marks semesters the pathway does not offer, so the rail can skip them', () => {
    const undecided = getActiveModules(modules, 'undecided', 'undecided');
    const result = computeSemesterStats(undecided, {}, gradeMap);

    expect(semesterOf(result, 'Y1S1').offered).toBe(true);
    expect(semesterOf(result, 'Y3S1').offered).toBe(false);
  });
});

describe('computeSemesterStats — module counts behind the rail', () => {
  it('counts an optional module toward the target only once it is graded', () => {
    const optional = active.find((m) => m.optional);
    if (!optional) return;

    const before = computeSemesterStats(active, {}, gradeMap);
    const after = computeSemesterStats(active, { [optional.code]: 'B' }, gradeMap);
    const label = `Y${optional.y}S${optional.s}`;

    expect(semesterOf(after, label).compulsoryCount).toBe(
      semesterOf(before, label).compulsoryCount + 1
    );
    expect(semesterOf(after, label).moduleCount).toBe(semesterOf(before, label).moduleCount);
  });

  it('never reports more graded than the semester holds', () => {
    const grades = Object.fromEntries(
      active.map((m) => [m.code, m.gradeType === 'passfail' ? 'Pass' : 'A'])
    );
    computeSemesterStats(active, grades, gradeMap).forEach((sem) => {
      expect(sem.gradedCount).toBeLessThanOrEqual(sem.moduleCount);
      expect(sem.compulsoryCount).toBeLessThanOrEqual(sem.moduleCount);
    });
  });
});
