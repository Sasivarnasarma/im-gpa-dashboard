import React from 'react';
import { GRADE_OPTIONS, PASSFAIL_OPTIONS } from '../data/modules';

export default function SemesterCard({
  semLabel,
  modules,
  grades,
  onGradeChange,
  getGradeBorderClass,
  bulletColor,
}) {
  return (
    <div className="border border-hairline bg-surface-card rounded-none overflow-hidden h-full flex flex-col justify-between">
      <div>
        <div className="bg-surface-soft border-b border-hairline px-4 py-3 flex items-center justify-between">
          <span className="font-bmw-display font-bold text-xs uppercase tracking-wider text-white">
            {semLabel}
          </span>
          <span className={`h-2 w-2 rounded-full ${bulletColor}`} />
        </div>

        {/* Modules list */}
        <div className="divide-y divide-hairline">
          {modules.map((mod) => (
            <div key={mod.code} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] font-bold text-m-blue-light uppercase tracking-wider">
                    {mod.code}
                  </span>
                  {mod.optional && (
                    <span className="text-[8px] bg-surface-elevated text-muted-text border border-hairline px-1 rounded-none uppercase font-bold">
                      OPT
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto whitespace-nowrap md:whitespace-normal scrollbar-none mt-1">
                  <span className="inline-block md:block text-xs font-semibold text-white leading-tight">
                    {mod.name}
                  </span>
                </div>
                <span className="text-[9px] text-muted-text mt-0.5 block font-mono">
                  {mod.cr === 0 ? 'NON-CREDIT' : `${mod.cr} CREDITS`}
                  {mod.nonGpa && ' • NON-GPA'}
                </span>
              </div>

              {/* Grade Selector */}
              <select
                value={grades[mod.code] || ''}
                onChange={(e) => onGradeChange(mod.code, e.target.value)}
                className={`h-9 w-20 bg-canvas text-center font-mono text-xs border rounded-none focus:outline-none focus:border-white cursor-pointer px-1 py-0 ${getGradeBorderClass(grades[mod.code])}`}
              >
                <option value="">--</option>
                {(mod.gradeType === 'passfail' ? PASSFAIL_OPTIONS : GRADE_OPTIONS).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
