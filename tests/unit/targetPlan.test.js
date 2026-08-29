import { describe, it, expect } from 'vitest';
import { computeTargetPlan } from '../../src/lib/targetPlan';

// This module is the direct fix for the bug that started the whole audit:
// App.jsx once passed TargetPlanner a set of props that didn't match what it
// destructured, so every value below arrived as `undefined` and the planner
// silently locked into 'impossible-high' for every student, always. These
// tests pin the three branches down so that kind of wiring mismatch fails
// loudly instead of shipping quietly.
describe('computeTargetPlan', () => {
  it('is possible when the required average is between 0 and 4.0', () => {
    const plan = computeTargetPlan({
      totalGpaCredits: 0,
      totalWeightedPoints: 0,
      ungradedGpaCredits: 36,
      curriculumTotalGpaCredits: 36,
      targetGPA: '3.70',
    });

    expect(plan.status).toBe('possible');
    expect(plan.avgGpaNeeded).toBeCloseTo(3.7);
    expect(plan.currentCGPA).toBe(0);
  });

  it('is already-achieved when banked points already clear the target even before crediting the rest', () => {
    // 34 of 36 curriculum credits already graded at a 4.0 clip banks more
    // points than a 3.70 target needs across the whole curriculum, so even
    // a 0.0 on the last 2 credits can't pull the CGPA below the goal.
    const plan = computeTargetPlan({
      totalGpaCredits: 34,
      totalWeightedPoints: 34 * 4.0,
      ungradedGpaCredits: 2,
      curriculumTotalGpaCredits: 36,
      targetGPA: '3.70',
    });

    expect(plan.status).toBe('already-achieved');
    expect(plan.avgGpaNeeded).toBe(0);
  });

  it('is already-achieved when no credits remain and the current CGPA already meets the target', () => {
    const plan = computeTargetPlan({
      totalGpaCredits: 36,
      totalWeightedPoints: 36 * 3.8,
      ungradedGpaCredits: 0,
      curriculumTotalGpaCredits: 36,
      targetGPA: '3.70',
    });

    expect(plan.status).toBe('already-achieved');
  });

  it('is impossible-high when no credits remain and the target was missed', () => {
    const plan = computeTargetPlan({
      totalGpaCredits: 36,
      totalWeightedPoints: 36 * 3.0,
      ungradedGpaCredits: 0,
      curriculumTotalGpaCredits: 36,
      targetGPA: '3.70',
    });

    expect(plan.status).toBe('impossible-high');
  });

  it('is impossible-high when the required average would exceed a 4.0', () => {
    const plan = computeTargetPlan({
      totalGpaCredits: 30,
      totalWeightedPoints: 30 * 2.0,
      ungradedGpaCredits: 6,
      curriculumTotalGpaCredits: 36,
      targetGPA: '3.70',
    });

    expect(plan.status).toBe('impossible-high');
  });

  it('never locks into impossible-high just because credits are ungraded (the original bug)', () => {
    // Fresh student, nothing graded yet, realistic curriculum totals — this
    // is exactly the state the app is in immediately after onboarding, and
    // is what silently showed "IMPOSSIBLE (> 4.00)" under the old prop bug.
    const plan = computeTargetPlan({
      totalGpaCredits: 0,
      totalWeightedPoints: 0,
      ungradedGpaCredits: 34,
      curriculumTotalGpaCredits: 34,
      targetGPA: '3.70',
    });

    expect(plan.status).not.toBe('impossible-high');
    expect(plan.status).toBe('possible');
  });

  it('falls back to a target of 0 for a non-numeric goal input instead of throwing', () => {
    const plan = computeTargetPlan({
      totalGpaCredits: 0,
      totalWeightedPoints: 0,
      ungradedGpaCredits: 10,
      curriculumTotalGpaCredits: 10,
      targetGPA: '',
    });

    expect(plan.numTarget).toBe(0);
    expect(plan.status).toBe('possible');
    expect(plan.avgGpaNeeded).toBe(0);
  });
});
