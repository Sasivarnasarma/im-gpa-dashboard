// How far the GPA sits between its class and the next one up.
import {
  GPA_TIER,
  FIRST_CLASS_GPA,
  SECOND_UPPER_GPA,
  SECOND_LOWER_GPA,
  MIN_SAFE_GPA,
} from './gpaEngine';

const TIER_BOUNDS = {
  [GPA_TIER.RISK]: { from: 0, next: MIN_SAFE_GPA, nextLabel: 'clear academic probation' },
  [GPA_TIER.PASS]: {
    from: MIN_SAFE_GPA,
    next: SECOND_LOWER_GPA,
    nextLabel: 'Second Class Lower',
  },
  [GPA_TIER.LOWER]: {
    from: SECOND_LOWER_GPA,
    next: SECOND_UPPER_GPA,
    nextLabel: 'Second Class Upper',
  },
  [GPA_TIER.UPPER]: {
    from: SECOND_UPPER_GPA,
    next: FIRST_CLASS_GPA,
    nextLabel: 'First Class Honours',
  },
  [GPA_TIER.FIRST]: { from: FIRST_CLASS_GPA, next: null, nextLabel: null },
};

export const getTierGoalDetails = (gpa, tier) => {
  if (tier === GPA_TIER.AWAITING) {
    return {
      progress: 0,
      hasAchievedMax: false,
      description: 'Awaiting grade information to compute academic tier progress.',
    };
  }

  const { from, next, nextLabel } = TIER_BOUNDS[tier];

  if (next === null) {
    return {
      progress: 100,
      hasAchievedMax: true,
      description: 'First Class achieved! Outstanding academic standing.',
    };
  }

  const needed = next - gpa;
  const progress = ((gpa - from) / (next - from)) * 100;
  return {
    progress: Math.min(100, Math.max(0, progress)),
    hasAchievedMax: false,
    description: `Need ${needed.toFixed(2)} more GPA points to ${
      tier === GPA_TIER.RISK ? nextLabel : `reach ${nextLabel}`
    } (${next.toFixed(2)}).`,
  };
};

// Badge styling mapped by academic tier
export const TIER_BADGE_COLORS = {
  [GPA_TIER.AWAITING]: 'border-hairline text-muted-text/60',
  [GPA_TIER.FIRST]: 'border-tier-first/50 text-tier-first',
  [GPA_TIER.UPPER]: 'border-tier-upper/50 text-tier-upper',
  [GPA_TIER.LOWER]: 'border-tier-lower/50 text-tier-lower',
  [GPA_TIER.PASS]: 'border-tier-pass/50 text-tier-pass',
  [GPA_TIER.RISK]: 'border-tier-risk/50 text-tier-risk',
};
