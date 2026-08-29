import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

const getHonoursClass = (gpa) => {
  if (gpa <= 0) return { label: 'AWAITING DATA', color: 'border-hairline text-muted-text/60' };
  if (gpa >= 3.7)
    return { label: 'FIRST CLASS HONOURS', color: 'border-m-blue-light/50 text-m-blue-light' };
  if (gpa >= 3.3)
    return { label: 'SECOND CLASS UPPER', color: 'border-m-blue-dark/50 text-m-blue-dark' };
  if (gpa >= 3.0) return { label: 'SECOND CLASS LOWER', color: 'border-m-orange/50 text-m-orange' };
  if (gpa >= 2.0) return { label: 'PASS STANDING', color: 'border-hairline text-white/80' };
  return { label: 'UNDERSTANDING EXPECTATIONS', color: 'border-m-red/50 text-m-red' };
};

export default function ExecutiveSummary({
  cgpa,
  gradedModulesCount,
  activeCompulsoryCount,
  totalModulesCount,
  gradedCredits,
  activeCompulsoryCredits,
  totalCreditsCount,
  y1GPA,
  y2GPA,
  y3GPA,
}) {
  const honors = getHonoursClass(cgpa);

  return (
    <div id="executive-summary" className="flex flex-col gap-8">
      {/* Executive Summary */}
      <div className="border border-hairline bg-surface-soft p-5 rounded-none flex flex-col gap-4">
        <span className="font-bmw-display font-bold text-[11px] uppercase tracking-widest text-white border-b border-hairline pb-2.5">
          EXECUTIVE SUMMARY
        </span>

        <div className="flex items-center justify-between">
          <div>
            <span className="block text-[8px] text-muted-text font-bold uppercase tracking-wider">
              CUMULATIVE GPA
            </span>
            <span
              className={`font-mono text-3xl font-black mt-1 block ${cgpa > 0 && cgpa < 2.0 ? 'text-m-red animate-pulse' : 'text-white'}`}
            >
              <AnimatedCounter value={cgpa} />
            </span>
          </div>

          <div className={`border border-dashed px-3 py-1.5 ${honors.color} select-none`}>
            <span className="font-bmw-display font-bold text-[9px] uppercase tracking-wider block">
              {honors.label}
            </span>
          </div>
        </div>

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
          <div className="bg-surface-card border border-hairline p-3 text-center">
            <span className="block text-[8px] text-muted-text font-bold uppercase tracking-wider">
              YEAR 1
            </span>
            <span
              className={`font-mono text-base font-bold mt-1 block ${y1GPA > 0 && y1GPA < 2.0 ? 'text-m-red' : 'text-white'}`}
            >
              <AnimatedCounter value={y1GPA} />
            </span>
          </div>
          <div className="bg-surface-card border border-hairline p-3 text-center">
            <span className="block text-[8px] text-muted-text font-bold uppercase tracking-wider">
              YEAR 2
            </span>
            <span
              className={`font-mono text-base font-bold mt-1 block ${y2GPA > 0 && y2GPA < 2.0 ? 'text-m-red' : 'text-white'}`}
            >
              <AnimatedCounter value={y2GPA} />
            </span>
          </div>
          <div className="bg-surface-card border border-hairline p-3 text-center">
            <span className="block text-[8px] text-muted-text font-bold uppercase tracking-wider">
              YEAR 3
            </span>
            <span
              className={`font-mono text-base font-bold mt-1 block ${y3GPA > 0 && y3GPA < 2.0 ? 'text-m-red' : 'text-white'}`}
            >
              <AnimatedCounter value={y3GPA} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
