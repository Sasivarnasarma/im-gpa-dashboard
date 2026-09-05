import { describe, it, expect } from 'vitest';
import { getTierGoalDetails, TIER_BADGE_COLORS } from '../../src/lib/honoursGoal';
import {
  GPA_TIER,
  FIRST_CLASS_GPA,
  SECOND_UPPER_GPA,
  SECOND_LOWER_GPA,
  MIN_SAFE_GPA,
} from '../../src/lib/gpaEngine';

describe('getTierGoalDetails — distance to the next class', () => {
  it('reports no progress and no target before any grade exists', () => {
    const goal = getTierGoalDetails(0, GPA_TIER.AWAITING);

    expect(goal.progress).toBe(0);
    expect(goal.hasAchievedMax).toBe(false);
    expect(goal.description).toMatch(/awaiting/i);
  });

  it('caps out at First Class, where there is nothing above to reach for', () => {
    const goal = getTierGoalDetails(3.95, GPA_TIER.FIRST);

    expect(goal.progress).toBe(100);
    expect(goal.hasAchievedMax).toBe(true);
  });

  it('measures progress across the band, not across the whole scale', () => {
    // Halfway between Second Lower (3.00) and Second Upper (3.30).
    const midpoint = SECOND_LOWER_GPA + (SECOND_UPPER_GPA - SECOND_LOWER_GPA) / 2;
    const goal = getTierGoalDetails(midpoint, GPA_TIER.LOWER);

    expect(goal.progress).toBeCloseTo(50, 5);
    expect(goal.description).toContain('Second Class Upper');
  });

  it('states the exact gap left to the next threshold', () => {
    const goal = getTierGoalDetails(3.5, GPA_TIER.UPPER);

    expect(goal.description).toContain((FIRST_CLASS_GPA - 3.5).toFixed(2));
    expect(goal.description).toContain('First Class Honours');
  });

  it('phrases the at-risk band as clearing probation, not reaching a class', () => {
    const goal = getTierGoalDetails(1.5, GPA_TIER.RISK);

    expect(goal.description).toMatch(/clear academic probation/);
    expect(goal.description).not.toMatch(/reach clear/);
    expect(goal.progress).toBeCloseTo((1.5 / MIN_SAFE_GPA) * 100, 5);
  });

  it('never reports progress outside 0–100, whatever the GPA', () => {
    expect(getTierGoalDetails(0, GPA_TIER.PASS).progress).toBe(0);
    expect(getTierGoalDetails(4, GPA_TIER.PASS).progress).toBe(100);
  });

  it('gives every tier a badge colour, so none renders unstyled', () => {
    Object.values(GPA_TIER).forEach((tier) => {
      expect(TIER_BADGE_COLORS[tier]).toBeTruthy();
    });
  });
});
