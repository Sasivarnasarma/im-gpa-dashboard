import React from 'react';
import { AlertTriangle } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { isAtRiskGpa } from '../lib/gpaEngine';

// Displays individual academic year's GPA tile
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

export default YearGpaTile;
