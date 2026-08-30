import React from 'react';
import { STORAGE_KEYS } from '../data/constants';

export default function MobileSelectorPanel({
  pathway,
  setPathway,
  specialization,
  setSpecialization,
  triggerToast,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 border border-hairline bg-surface-soft md:hidden select-none">
      {/* Degree Selector */}
      <div className="flex items-center justify-between font-mono text-xs w-full sm:w-auto">
        <span className="text-muted-text font-bold uppercase text-[9px] mr-2">DEGREE:</span>
        <select
          value={pathway || 'undecided'}
          onChange={(e) => {
            const val = e.target.value;
            localStorage.setItem(STORAGE_KEYS.PATHWAY, val);
            setPathway(val === 'undecided' ? 'undecided' : val);
            triggerToast(`DEGREE: ${val.toUpperCase()}`);
          }}
          className={`bg-transparent font-black uppercase text-[10px] sm:text-xs select-none cursor-pointer border-none focus:ring-0 pr-2 font-mono ${pathway === 'undecided' ? 'text-muted-text' : 'text-m-red'}`}
          style={{ width: pathway === 'mit' ? '58px' : pathway === 'it' ? '50px' : '100px' }}
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

      {/* Specialization Selector (Only visible for MIT) */}
      {pathway === 'mit' && (
        <div className="flex items-center justify-between font-mono text-xs w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-hairline pt-3 sm:pt-0 sm:pl-4">
          <span className="text-muted-text font-bold uppercase text-[9px] mr-2">
            SPECIALIZATION:
          </span>
          <select
            value={specialization}
            onChange={(e) => {
              const val = e.target.value;
              localStorage.setItem(STORAGE_KEYS.SPECIALIZATION, val);
              setSpecialization(val);
              triggerToast(`SPECIALIZATION: ${val.toUpperCase()}`);
            }}
            className={`bg-transparent font-black uppercase text-[10px] sm:text-xs select-none cursor-pointer border-none focus:ring-0 pr-2 font-mono ${specialization === 'undecided' ? 'text-muted-text' : 'text-m-orange'}`}
            style={{
              width:
                specialization === 'bsc' || specialization === 'is'
                  ? '58px'
                  : specialization === 'oscm'
                    ? '66px'
                    : '100px',
            }}
          >
            <option value="undecided" className="bg-canvas text-muted-text">
              UNDECIDED
            </option>
            <option value="bsc" className="bg-canvas text-m-orange">
              BSC
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
