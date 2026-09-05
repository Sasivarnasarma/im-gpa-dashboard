import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import MedalIcon from './MedalIcon';
import YearGpaTile from './YearGpaTile';
import { getTierGoalDetails, TIER_BADGE_COLORS } from '../lib/honoursGoal';
import { isAtRiskGpa, getGpaTier, TIER_LABELS } from '../lib/gpaEngine';

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
  awardTier,
}) {
  // awardTier reflects handbook eligibility; gpaTier drives numerical goal progress
  const gpaTier = getGpaTier(cgpa, hasGradedCredits);
  const tier = awardTier ?? gpaTier;
  const goalDetails = getTierGoalDetails(cgpa, gpaTier);
  const atRisk = isAtRiskGpa(cgpa, hasGradedCredits);

  return (
    <div id="executive-summary" className="flex flex-col gap-8">
      <div className="border border-hairline bg-surface-soft p-5 rounded-none flex flex-col gap-4">
        <span className="font-bmw-display font-bold text-[11px] uppercase tracking-widest text-white border-b border-hairline pb-2.5">
          EXECUTIVE SUMMARY
        </span>

        {/* Cumulative GPA & Honours Badge */}
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

        {/* Honours Tier Progress */}
        {hasGradedCredits && (
          <div className="border-t border-hairline pt-3 mt-1 flex flex-col gap-2 font-mono select-none">
            <div className="flex items-center justify-between text-[8px] text-muted-text font-bold uppercase tracking-wider">
              <span>Honours Tier Progress</span>
              <span>
                {goalDetails.hasAchievedMax ? 'MAX TIER' : `${goalDetails.progress.toFixed(0)}%`}
              </span>
            </div>

            <div className="h-1.5 w-full bg-canvas border border-hairline rounded-none overflow-hidden relative">
              <motion.div
                className={`h-full ${atRisk ? 'bg-m-red animate-pulse' : 'bg-m-blue-light'}`}
                initial={{ width: 0 }}
                animate={{ width: `${goalDetails.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            <span className="text-[9px] text-white font-bold leading-normal">
              {goalDetails.description}
            </span>
          </div>
        )}

        {/* Module & Credit Completion Stats */}
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

        {/* Degree Completion Progress Bar */}
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

      {/* Year Breakdown Grid */}
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
