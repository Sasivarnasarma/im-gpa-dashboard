import React, { useState } from 'react';
import { Check, X, Circle, ChevronDown, ShieldAlert } from 'lucide-react';
import { STATUS } from '../lib/degreeAudit';

const STATUS_STYLE = {
  [STATUS.MET]: { icon: Check, color: 'text-tier-pass', ring: 'border-tier-pass/40', label: 'Met' },
  [STATUS.PENDING]: {
    icon: Circle,
    color: 'text-muted-text',
    ring: 'border-hairline',
    label: 'Pending',
  },
  [STATUS.FAILED]: {
    icon: X,
    color: 'text-tier-risk',
    ring: 'border-tier-risk/40',
    label: 'Not met',
  },
};

function formatValue(criterion) {
  if (criterion.current === null || criterion.current === undefined) return null;
  if (criterion.isGpa) return `${criterion.current.toFixed(2)} / ${criterion.target.toFixed(2)}`;
  if (typeof criterion.current === 'number' && criterion.target !== undefined) {
    return `${criterion.current} / ${Math.ceil(criterion.target)}`;
  }
  return String(criterion.current);
}

function CriterionRow({ criterion }) {
  const style = STATUS_STYLE[criterion.status];
  const Icon = style.icon;
  const value = formatValue(criterion);

  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span
        className={`mt-0.5 shrink-0 h-4 w-4 rounded-full border flex items-center justify-center ${style.ring} ${style.color}`}
      >
        <Icon className="w-2.5 h-2.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] leading-snug text-body-text">
          {criterion.label}
          <span className="sr-only"> — {style.label}</span>
        </span>
        {criterion.detail && (
          <span className={`block text-[10px] font-mono mt-0.5 ${style.color}`}>
            {criterion.detail}
          </span>
        )}
        {criterion.offenders?.length > 0 && (
          <span className="block text-[10px] font-mono text-muted-text mt-1 leading-relaxed">
            {criterion.offenders.map((o) => (
              <span key={o.code} className="block">
                {o.code} — {o.grade}
              </span>
            ))}
          </span>
        )}
      </span>
      {value && (
        <span className={`shrink-0 font-mono text-[10px] tabular-nums ${style.color}`}>
          {value}
        </span>
      )}
    </li>
  );
}

// Degree eligibility and honours classification, checked against every
// handbook criterion rather than the GPA threshold alone. Collapsed by
// default: it matters most near the end of a degree, and a student in Year 1
// does not need a wall of pending requirements.
export default function DegreeAudit({ eligibility, classes }) {
  const [open, setOpen] = useState(false);

  const blockedClasses = classes.classes.filter((c) => c.blocked);
  const reachable = classes.highestReachable;
  const failedCount = eligibility.failed.length;

  return (
    <div className="border border-hairline bg-surface-soft rounded-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-5 cursor-pointer text-left"
      >
        <span className="font-bmw-display font-bold text-[11px] uppercase tracking-widest text-white">
          Degree Audit
        </span>
        <span className="flex items-center gap-2.5">
          {failedCount > 0 ? (
            <span className="flex items-center gap-1.5 text-tier-risk font-mono text-[10px] font-bold uppercase">
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              {failedCount} unmet
            </span>
          ) : (
            <span className="font-mono text-[10px] text-muted-text uppercase">
              {reachable ? reachable.label : 'No class reachable'}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-text transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-5 border-t border-hairline pt-4">
          {/* Eligibility */}
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-widest text-muted-text mb-2">
              Eligibility for the degree
            </span>
            <ul className="divide-y divide-hairline/50">
              {eligibility.criteria.map((c) => (
                <CriterionRow key={c.id} criterion={c} />
              ))}
            </ul>
            <p className="text-[10px] text-muted-text mt-2 leading-relaxed">
              Not tracked: {eligibility.untrackable.toLowerCase()} — this app holds no enrolment
              dates.
            </p>
          </div>

          {/* Classification */}
          <div className="border-t border-hairline border-dashed pt-4">
            <span className="block font-mono text-[9px] uppercase tracking-widest text-muted-text mb-2">
              Honours classification
            </span>

            {reachable ? (
              <p className="text-[11px] text-body-text mb-3 leading-relaxed">
                Highest class still open to you:{' '}
                <span className="text-white font-bold">{reachable.label}</span>
                {classes.complete ? '' : ' — based on the grades entered so far.'}
              </p>
            ) : (
              <p className="text-[11px] text-tier-risk mb-3 leading-relaxed">
                No honours class remains reachable with these grades.
              </p>
            )}

            {blockedClasses.length > 0 && (
              <div className="flex flex-col gap-3">
                {blockedClasses.map((c) => (
                  <div key={c.tier}>
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-tier-risk mb-1">
                      {c.label} — ruled out
                    </span>
                    <ul>
                      {c.blockers.map((b) => (
                        <CriterionRow key={b.id} criterion={b} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
