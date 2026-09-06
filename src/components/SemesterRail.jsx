import React from 'react';
import { Lock } from 'lucide-react';
import { getGpaTier, GPA_TIER } from '../lib/gpaEngine';

const TIER_TEXT = {
  [GPA_TIER.FIRST]: 'text-tier-first',
  [GPA_TIER.UPPER]: 'text-tier-upper',
  [GPA_TIER.LOWER]: 'text-tier-lower',
  [GPA_TIER.PASS]: 'text-tier-pass',
  [GPA_TIER.RISK]: 'text-tier-risk',
  [GPA_TIER.AWAITING]: 'text-muted-text',
};

// Each semester's own GPA, and a jump to it. Semesters whose curriculum has
// not loaded yet keep their tile and point at the degree selection instead, so
// the rail is the same shape whatever stage the student is at.
export default function SemesterRail({ semesters, onJump }) {
  return (
    <nav
      aria-label="Semesters"
      className="border border-hairline bg-surface-soft rounded-none p-4 flex flex-col gap-3"
    >
      <span className="font-bmw-display font-bold text-[11px] uppercase tracking-widest text-white">
        Semester GPA
      </span>

      <ul className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {semesters.map((sem) => (
          <li key={sem.label}>
            <button
              type="button"
              onClick={() => onJump(sem.y, sem.s)}
              title={sem.offered ? `Go to ${sem.label}` : 'Select a degree programme'}
              className={`w-full h-full border bg-canvas px-3 py-2.5 text-left transition-colors cursor-pointer flex flex-col gap-1 ${
                sem.offered
                  ? 'border-hairline hover:border-m-blue-light'
                  : 'border-hairline/50 hover:border-hairline'
              }`}
            >
              <span
                className={`font-mono text-[10px] uppercase tracking-wider ${
                  sem.offered ? 'text-muted-text' : 'text-muted-text/60'
                }`}
              >
                {sem.label}
              </span>

              {sem.offered ? (
                <>
                  <span
                    className={`font-mono text-lg font-black tabular-nums leading-none ${
                      sem.hasGrades ? TIER_TEXT[getGpaTier(sem.gpa, true)] : 'text-muted-text/50'
                    }`}
                  >
                    {sem.hasGrades ? sem.gpa.toFixed(2) : '--'}
                  </span>
                  <span className="font-mono text-[10px] text-muted-text">
                    <span className="text-white font-bold">{sem.gradedCount}</span> /{' '}
                    {sem.compulsoryCount}
                    {sem.compulsoryCount !== sem.moduleCount && (
                      <span className="text-muted-text/70"> ({sem.moduleCount})</span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-lg font-black leading-none text-muted-text/40">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[10px] text-muted-text/70 leading-tight">
                    Select degree
                  </span>
                </>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
