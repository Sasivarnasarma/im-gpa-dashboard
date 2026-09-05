import React from 'react';
import { Info } from 'lucide-react';
import { GRADING_SCALE } from '../data/constants';

export default function GradingScale() {
  return (
    <section
      aria-labelledby="grading-scale-heading"
      className="border border-hairline bg-surface-card p-5 sm:p-6 rounded-none select-none"
    >
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-hairline">
        <Info className="w-4 h-4 text-m-blue-light shrink-0" aria-hidden="true" />
        <h2
          id="grading-scale-heading"
          className="font-bmw-display font-bold text-xs uppercase tracking-wider text-white"
        >
          University of Kelaniya Grading Scale
        </h2>
      </div>

      {/* 12 Grade Cards: 6 columns on desktop, 3 on tablet, 2 on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-3.5">
        {GRADING_SCALE.map((item) => (
          <div
            key={item.grade}
            className={`border ${item.border} ${item.bg} p-3 sm:p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 rounded-none`}
          >
            <span
              className={`text-sm sm:text-base font-black font-bmw-display tracking-wider ${item.color} leading-none mb-1`}
            >
              {item.grade}
            </span>
            <span className="text-[10px] font-mono text-muted-text mb-1 tracking-tight">
              {item.marks}
            </span>
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              {item.gpv}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
