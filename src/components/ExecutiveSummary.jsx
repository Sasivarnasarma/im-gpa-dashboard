import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import {
  isAtRiskGpa,
  getGpaTier,
  GPA_TIER,
  TIER_LABELS,
  TIER_SHORT_LABELS,
  FIRST_CLASS_GPA,
  SECOND_UPPER_GPA,
  SECOND_LOWER_GPA,
  MIN_SAFE_GPA,
} from '../lib/gpaEngine';

// One year's GPA tile. Extracted because the three were identical apart from
// the label and value, and the at-risk treatment now has to stay in step
// across all of them.
function YearGpaTile({ label, gpa, hasGrades }) {
  const atRisk = isAtRiskGpa(gpa, hasGrades);

  return (
    <div className="bg-surface-card border border-hairline p-3 text-center">
      <span className="block text-[8px] text-muted-text font-bold uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`font-mono text-base font-bold mt-1 flex items-center justify-center gap-1 ${
          atRisk ? 'text-m-red' : 'text-white'
        }`}
      >
        {atRisk && <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />}
        <AnimatedCounter value={gpa} />
        {atRisk && <span className="sr-only">— below the 2.00 pass threshold</span>}
      </span>
    </div>
  );
}

const MEDAL_FINISH = {
  [GPA_TIER.FIRST]: {
    key: 'gold',
    highlight: '#fff6d5',
    mid: '#e0b93c',
    shade: '#8a6410',
    rim: '#6d4d0a',
    face: '#4a3506',
    glow: 'hover:shadow-[0_0_20px_rgba(224,185,60,0.55)]',
  },
  [GPA_TIER.UPPER]: {
    key: 'silver',
    highlight: '#ffffff',
    mid: '#c3ced9',
    shade: '#6b7a8a',
    rim: '#55636f',
    face: '#2b3743',
    glow: 'hover:shadow-[0_0_20px_rgba(195,206,217,0.5)]',
  },
  [GPA_TIER.LOWER]: {
    key: 'bronze',
    highlight: '#ffd9a8',
    mid: '#b87333',
    shade: '#6b3a12',
    rim: '#52290b',
    face: '#3b1f07',
    glow: 'hover:shadow-[0_0_20px_rgba(184,115,51,0.5)]',
  },
};

function MedalIcon({ tier }) {
  const finish = MEDAL_FINISH[tier];
  // No medal for Awaiting, Pass Standing or Academic Risk — see MEDAL_FINISH.
  if (!finish) return null;

  const { key, highlight, mid, shade, rim, face, glow } = finish;
  const bodyId = `medal-body-${key}`;
  const rimId = `medal-rim-${key}`;
  const sheenId = `medal-sheen-${key}`;
  const ribbonId = `medal-ribbon-${key}`;
  const medalText = TIER_SHORT_LABELS[tier];

  return (
    <div
      className={`medal-shine-container shrink-0 w-12 h-12 rounded-full border border-hairline bg-canvas flex items-center justify-center shadow-lg relative select-none transition-all duration-300 hover:scale-110 hover:rotate-6 ${glow}`}
    >
      <svg
        className="w-10 h-10"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Struck metal, lit from the upper left */}
          <radialGradient id={bodyId} cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor={highlight} />
            <stop offset="42%" stopColor={mid} />
            <stop offset="100%" stopColor={shade} />
          </radialGradient>
          {/* Milled rim: bright where lit, dark where turned away */}
          <linearGradient id={rimId} x1="12%" y1="0%" x2="88%" y2="100%">
            <stop offset="0%" stopColor={highlight} />
            <stop offset="48%" stopColor={shade} />
            <stop offset="100%" stopColor={mid} />
          </linearGradient>
          {/* Soft specular sweep across the face */}
          <linearGradient id={sheenId} x1="0%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {/* Ribbon shading: catches light at the top, falls into shadow
              where it passes behind the medal */}
          <linearGradient id={ribbonId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="45%" stopColor="#000000" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Ribbon — the M tricolour, tapering into the medal */}
        <g>
          <path d="M34 0 L44.67 0 L46.33 44 L39 44 Z" fill="#0066b1" />
          <path d="M44.67 0 L55.33 0 L53.67 44 L46.33 44 Z" fill="#002f6c" />
          <path d="M55.33 0 L66 0 L61 44 L53.67 44 Z" fill="#e22718" />
          <path d="M34 0 L66 0 L61 44 L39 44 Z" fill={`url(#${ribbonId})`} />
        </g>

        {/* Milled outer rim */}
        <circle
          cx="50"
          cy="63"
          r="31"
          fill="none"
          stroke={`url(#${rimId})`}
          strokeWidth="6"
          strokeDasharray="3.6 1.7"
        />

        {/* Medal body */}
        <circle cx="50" cy="63" r="28" fill={`url(#${bodyId})`} stroke={rim} strokeWidth="1.5" />

        {/* Bevel: lit arc on the upper left, shadowed arc opposite */}
        <path
          d="M25 74 A28 28 0 0 1 61 36"
          stroke={highlight}
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M75 52 A28 28 0 0 1 39 90"
          stroke={rim}
          strokeOpacity="0.4"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Engraved inner ring */}
        <circle
          cx="50"
          cy="63"
          r="21.5"
          fill="none"
          stroke={rim}
          strokeOpacity="0.35"
          strokeWidth="0.9"
        />

        {/* Laurel sprigs flanking the mark */}
        <g stroke={face} strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" fill="none">
          <path d="M33 71 Q31 62 37 56" />
          <path d="M33.6 67 L30 65.6 M34.6 63 L31.4 61 M36.4 59.4 L33.6 57" />
          <path d="M67 71 Q69 62 63 56" />
          <path d="M66.4 67 L70 65.6 M65.4 63 L68.6 61 M63.6 59.4 L66.4 57" />
        </g>

        {/* Star */}
        <polygon
          points="50,45 51.9,50.2 57.4,50.4 53.1,53.9 54.6,59.2 50,56.1 45.4,59.2 46.9,53.9 42.6,50.4 48.1,50.2"
          fill={face}
          opacity="0.75"
        />

        {/* Classification mark */}
        <text
          x="50"
          y="76"
          fill={face}
          fontSize="15"
          fontWeight="900"
          fontFamily="monospace"
          letterSpacing="0.5"
          textAnchor="middle"
        >
          {medalText}
        </text>

        {/* Specular sweep, drawn last and clipped to the face */}
        <circle cx="50" cy="63" r="28" fill={`url(#${sheenId})`} />
      </svg>
    </div>
  );
}

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

const getTierGoalDetails = (gpa, tier) => {
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

// Badge colouring per tier. The wording itself comes from TIER_LABELS, so the
// badge, the medal and the progress copy can never disagree.
const TIER_BADGE_COLORS = {
  [GPA_TIER.AWAITING]: 'border-hairline text-muted-text/60',
  [GPA_TIER.FIRST]: 'border-tier-first/50 text-tier-first',
  [GPA_TIER.UPPER]: 'border-tier-upper/50 text-tier-upper',
  [GPA_TIER.LOWER]: 'border-tier-lower/50 text-tier-lower',
  [GPA_TIER.PASS]: 'border-tier-pass/50 text-tier-pass',
  [GPA_TIER.RISK]: 'border-tier-risk/50 text-tier-risk',
};

export default function ExecutiveSummary({
  cgpa,
  hasGradedCredits,
  gradedModulesCount,
  activeCompulsoryCount,
  totalModulesCount,
  gradedCredits,
  activeCompulsoryCredits,
  totalCreditsCount,
  years,
}) {
  const tier = getGpaTier(cgpa, hasGradedCredits);
  const goalDetails = getTierGoalDetails(cgpa, tier);
  const atRisk = isAtRiskGpa(cgpa, hasGradedCredits);

  return (
    <div id="executive-summary" className="flex flex-col gap-8">
      {/* Executive Summary */}
      <div className="border border-hairline bg-surface-soft p-5 rounded-none flex flex-col gap-4">
        <span className="font-bmw-display font-bold text-[11px] uppercase tracking-widest text-white border-b border-hairline pb-2.5">
          EXECUTIVE SUMMARY
        </span>

        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-[8px] text-muted-text font-bold uppercase tracking-wider">
              CUMULATIVE GPA
            </span>
            <span
              className={`font-mono text-3xl font-black mt-1 flex items-center gap-1.5 ${
                atRisk ? 'text-m-red animate-pulse' : 'text-white'
              }`}
            >
              {atRisk && <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />}
              <AnimatedCounter value={cgpa} />
              {atRisk && <span className="sr-only">— below the 2.00 pass threshold</span>}
            </span>
          </div>

          <div className="flex items-center gap-3 select-none">
            <MedalIcon tier={tier} />
            <div className={`border border-dashed px-3 py-1.5 ${TIER_BADGE_COLORS[tier]}`}>
              <span className="font-bmw-display font-bold text-[9px] uppercase tracking-wider block">
                {TIER_LABELS[tier]}
              </span>
            </div>
          </div>
        </div>

        {/* Tier Progress Bar & Status details */}
        {hasGradedCredits && (
          <div className="border-t border-hairline pt-3 mt-1 flex flex-col gap-2 font-mono select-none">
            <div className="flex items-center justify-between text-[8px] text-muted-text font-bold uppercase tracking-wider">
              <span>Honours Tier Progress</span>
              <span>
                {goalDetails.hasAchievedMax ? 'MAX TIER' : `${goalDetails.progress.toFixed(0)}%`}
              </span>
            </div>

            {/* Progress track */}
            <div className="h-1.5 w-full bg-canvas border border-hairline rounded-none overflow-hidden relative">
              <motion.div
                className={`h-full ${atRisk ? 'bg-m-red animate-pulse' : 'bg-m-blue-light'}`}
                initial={{ width: 0 }}
                animate={{ width: `${goalDetails.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* Status description */}
            <span className="text-[9px] text-white font-bold leading-normal">
              {goalDetails.description}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-hairline border-dashed">
          <div>
            <span className="block text-[8px] text-muted-text font-bold uppercase tracking-wider">
              MODULES COMPLETED
            </span>
            <span className="font-mono text-xs font-bold text-white mt-0.5 block">
              {gradedModulesCount} / {activeCompulsoryCount} ({totalModulesCount})
            </span>
          </div>
          <div>
            <span className="block text-[8px] text-muted-text font-bold uppercase tracking-wider">
              CREDITS COMPLETED
            </span>
            <span className="font-mono text-xs font-bold text-white mt-0.5 block">
              {gradedCredits} / {activeCompulsoryCredits} ({totalCreditsCount})
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-3 border-t border-hairline border-dashed">
          <span className="block text-[8px] text-muted-text font-bold uppercase tracking-wider mb-1.5">
            DEGREE COMPLETION PROGRESS
          </span>
          <div className="h-1.5 bg-surface-card w-full border border-hairline select-none">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${activeCompulsoryCredits > 0 ? (gradedCredits / activeCompulsoryCredits) * 100 : 0}%`,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-m-blue-light"
            />
          </div>
        </div>
      </div>

      {/* Year Breakdown specs */}
      <div className="border border-hairline bg-surface-soft p-5 rounded-none flex flex-col gap-3">
        <span className="font-bmw-display font-bold text-[11px] uppercase tracking-widest text-white border-b border-hairline pb-2.5">
          YEAR BREAKDOWN
        </span>
        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => (
            <YearGpaTile
              key={year.label}
              label={year.label}
              gpa={year.gpa}
              hasGrades={year.hasGrades}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
