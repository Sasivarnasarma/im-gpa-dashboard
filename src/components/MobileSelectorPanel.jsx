import React from 'react';
import { STORAGE_KEYS, SPECIALIZATION_LABELS } from '../data/constants';

export default function MobileSelectorPanel({
  pathway,
  setPathway,
  specialization,
  setSpecialization,
  triggerToast,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 border border-hairline bg-surface-soft md:hidden select-none">
      {/* Degree Pathway Selector */}
      <div className="flex items-center justify-between font-mono text-xs w-full sm:w-auto relative cursor-pointer focus-within:ring-1 focus-within:ring-white">
        <span className="text-muted-text font-bold uppercase text-[9px] mr-2">DEGREE:</span>
        <span
          className={`font-black uppercase text-[10px] sm:text-xs font-mono select-none pointer-events-none ${!pathway || pathway === 'undecided' ? 'text-muted-text' : 'text-m-red'}`}
        >
          {!pathway || pathway === 'undecided' ? 'UNDECIDED' : pathway.toUpperCase()}
        </span>
        <select
          value={pathway || 'undecided'}
          onChange={(e) => {
            const val = e.target.value;
            localStorage.setItem(STORAGE_KEYS.PATHWAY, val);
            setPathway(val === 'undecided' ? 'undecided' : val);
            triggerToast(`DEGREE: ${val.toUpperCase()}`);
          }}
          aria-label="Select Degree Programme"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[10px] sm:text-xs font-mono uppercase bg-canvas text-white"
        >
          <option value="undecided" className="bg-canvas text-muted-text">
            UNDECIDED
          </option>
          <option value="it" className="bg-canvas text-m-red">
            IT
          </option>
          <option value="mit" className="bg-canvas text-m-red">
            MIT
          </option>
        </select>
      </div>

      {/* MIT Specialization Selector */}
      {pathway === 'mit' && (
        <div className="flex items-center justify-between font-mono text-xs w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-hairline pt-3 sm:pt-0 sm:pl-4 relative cursor-pointer focus-within:ring-1 focus-within:ring-white">
          <span className="text-muted-text font-bold uppercase text-[9px] mr-2">
            SPECIALIZATION:
          </span>
          <span
            className={`font-black uppercase text-[10px] sm:text-xs font-mono select-none pointer-events-none ${!specialization || specialization === 'undecided' ? 'text-muted-text' : 'text-m-orange'}`}
          >
            {SPECIALIZATION_LABELS[specialization] ?? specialization?.toUpperCase() ?? 'UNDECIDED'}
          </span>
          <select
            value={specialization}
            onChange={(e) => {
              const val = e.target.value;
              localStorage.setItem(STORAGE_KEYS.SPECIALIZATION, val);
              setSpecialization(val);
              triggerToast(`SPECIALIZATION: ${SPECIALIZATION_LABELS[val] ?? val.toUpperCase()}`);
            }}
            aria-label="Select MIT Specialization"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[10px] sm:text-xs font-mono uppercase bg-canvas text-white"
          >
            <option value="undecided" className="bg-canvas text-muted-text">
              UNDECIDED
            </option>
            <option value="bse" className="bg-canvas text-m-orange">
              BSE
            </option>
            <option value="oscm" className="bg-canvas text-m-orange">
              OSCM
            </option>
            <option value="is" className="bg-canvas text-m-orange">
              IS
            </option>
          </select>
        </div>
      )}
    </div>
  );
}
