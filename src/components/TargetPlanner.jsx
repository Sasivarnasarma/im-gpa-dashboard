import React, { useState } from 'react';
import AnimatedCounter from './AnimatedCounter';
import { computeTargetPlan } from '../lib/targetPlan';

export default function TargetPlanner({
  totalGpaCredits,
  totalWeightedPoints,
  ungradedGpaCredits,
  curriculumTotalGpaCredits,
}) {
  const [targetGPA, setTargetGPA] = useState('3.70');

  const { currentCGPA, numTarget, avgGpaNeeded, status } = computeTargetPlan({
    totalGpaCredits,
    totalWeightedPoints,
    ungradedGpaCredits,
    curriculumTotalGpaCredits,
    targetGPA,
  });

  return (
    <div className="border border-hairline bg-carbon-gray p-5 rounded-none flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-hairline pb-2.5">
        <span className="font-bmw-display font-bold text-[11px] uppercase tracking-widest text-white">
          TARGET GPA PLANNER
        </span>
        <div className="flex items-center gap-2">
          <label className="font-mono text-[9px] text-muted-text uppercase">GOAL:</label>
          <input
            type="number"
            step="0.05"
            min="0.00"
            max="4.00"
            value={targetGPA}
            onChange={(e) => setTargetGPA(e.target.value)}
            className="w-16 h-8 bg-canvas text-on-dark text-center font-mono text-xs border border-hairline focus:border-white focus:outline-none rounded-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-soft p-3 border border-hairline">
          <span className="block text-[8px] text-muted-text font-bold uppercase tracking-widest">
            UNGRADED CREDITS
          </span>
          <span className="font-mono text-xs font-bold text-white mt-1 block">
            {ungradedGpaCredits} Credits
          </span>
        </div>
        <div className="bg-surface-soft p-3 border border-hairline">
          <span className="block text-[8px] text-muted-text font-bold uppercase tracking-widest">
            CURRENT TOTAL GPA
          </span>
          <span className="font-mono text-xs font-bold text-white mt-1 block">
            <AnimatedCounter value={currentCGPA} />
          </span>
        </div>
      </div>

      <div className="bg-surface-soft p-4 border border-hairline flex flex-col justify-center text-center">
        <span className="text-[8px] text-muted-text font-bold uppercase tracking-widest block mb-1">
          REQUIRED AVERAGE IN REMAINING MODULES
        </span>
        {status === 'impossible-high' ? (
          <span className="font-bmw-display font-bold text-base text-m-red tracking-tight uppercase">
            IMPOSSIBLE (&gt; 4.00)
          </span>
        ) : status === 'already-achieved' ? (
          <span className="font-bmw-display font-bold text-base text-m-blue-light tracking-tight uppercase">
            ACHIEVED (0.00 REQ.)
          </span>
        ) : (
          <span className="font-mono font-bold text-2xl text-on-dark block">
            <AnimatedCounter value={avgGpaNeeded} />
          </span>
        )}
      </div>

      <p className="text-[10px] text-muted-text leading-relaxed">
        {status === 'impossible-high'
          ? `Achieving ${numTarget.toFixed(2)} requires an average grade above A+ (4.00) on your remaining ${ungradedGpaCredits} GPA credits.`
          : status === 'already-achieved'
            ? `Your current performance already meets or exceeds your goal of ${numTarget.toFixed(2)}.`
            : `To secure a CGPA of ${numTarget.toFixed(2)}, you must average at least ${avgGpaNeeded.toFixed(2)} across your remaining ${ungradedGpaCredits} ungraded GPA credits.`}
      </p>
    </div>
  );
}
