import React from 'react';
import { Trash2, Download, AlertTriangle } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { STORAGE_KEYS, SPECIALIZATION_LABELS } from '../data/constants';
import { isAtRiskGpa } from '../lib/gpaEngine';

export default function Navbar({
  cgpa,
  hasGradedCredits,
  pathway,
  setPathway,
  specialization,
  setSpecialization,
  gradedModulesCount,
  activeCompulsoryCount,
  totalModulesCount,
  gradedCredits,
  activeCompulsoryCredits,
  totalCreditsCount,
  onResetClick,
  triggerToast,
  showInstallBtn,
  onInstallClick,
  onCgpaClick,
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-canvas border-b border-hairline z-50">
      <div className="max-w-360 h-full mx-auto px-4 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 bg-m-blue-light shrink-0" />
          <div className="h-5 w-1 bg-m-blue-dark shrink-0 -ml-2" />
          <div className="h-5 w-1 bg-m-red shrink-0 -ml-2" />
          <span className="font-bmw-display font-bold text-sm tracking-widest text-white uppercase ml-1 sm:inline hidden">
            KELANIYA IT/MIT <span className="text-muted-text">//</span> GPA DASHBOARD
          </span>
          <span className="font-bmw-display font-bold text-xs tracking-wider text-white uppercase sm:hidden">
            IT/MIT // GPA
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* CGPA display in sticky navbar — doubles as a jump link */}
          <button
            type="button"
            onClick={onCgpaClick}
            title="Scroll to Executive Summary"
            className="px-3 py-1.5 border border-hairline bg-surface-soft font-mono text-xs cursor-pointer hover:border-m-blue-light transition-colors select-none flex items-center"
          >
            <span className="text-muted-text font-bold uppercase text-[9px] mr-2">CGPA:</span>
            {/* At-risk visual and screen-reader indicator */}
            {isAtRiskGpa(cgpa, hasGradedCredits) && (
              <AlertTriangle className="w-3 h-3 text-m-red mr-1 shrink-0" aria-hidden="true" />
            )}
            <span
              className={`font-black ${isAtRiskGpa(cgpa, hasGradedCredits) ? 'text-m-red animate-pulse' : 'text-white'}`}
            >
              <AnimatedCounter value={cgpa} />
            </span>
            {isAtRiskGpa(cgpa, hasGradedCredits) && (
              <span className="sr-only">— below the 2.00 pass threshold</span>
            )}
          </button>

          {/* Desktop Selectors */}
          <div className="hidden md:flex items-center gap-4">
            <div className="border border-hairline bg-surface-soft px-3 py-1.5 font-mono text-xs select-none flex items-center">
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

            {pathway === 'mit' && (
              <div className="border border-hairline bg-surface-soft px-3 py-1.5 font-mono text-xs select-none flex items-center">
                <span className="text-muted-text font-bold uppercase text-[9px] mr-2">
                  SPECIALIZATION:
                </span>
                <select
                  value={specialization}
                  onChange={(e) => {
                    const val = e.target.value;
                    localStorage.setItem(STORAGE_KEYS.SPECIALIZATION, val);
                    setSpecialization(val);
                    triggerToast(
                      `SPECIALIZATION: ${SPECIALIZATION_LABELS[val] ?? val.toUpperCase()}`
                    );
                  }}
                  className={`bg-transparent font-black uppercase text-[10px] sm:text-xs select-none cursor-pointer border-none focus:ring-0 pr-2 font-mono ${specialization === 'undecided' ? 'text-muted-text' : 'text-m-orange'}`}
                  style={{
                    width:
                      specialization === 'bse' || specialization === 'is'
                        ? '58px'
                        : specialization === 'oscm'
                          ? '66px'
                          : '100px',
                  }}
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

          <div className="hidden md:flex text-[10px] sm:text-xs font-mono font-bold tracking-wider text-muted-text flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-right">
            <div>
              <span className="text-white font-black">{gradedModulesCount}</span> /{' '}
              {activeCompulsoryCount} ({totalModulesCount}) MODULES
            </div>
            <span className="hidden sm:inline text-muted-text/30">|</span>
            <div>
              <span className="text-white font-black">{gradedCredits}</span> /{' '}
              {activeCompulsoryCredits} ({totalCreditsCount}) CREDITS
            </div>
          </div>

          {showInstallBtn && (
            <button
              onClick={onInstallClick}
              title="Install application"
              className="p-2 sm:px-4 sm:py-2 border border-hairline hover:border-m-blue-light hover:text-m-blue-light text-muted-text rounded-none transition-colors uppercase font-bmw-display font-bold text-[10px] sm:text-xs tracking-wider flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-m-blue-light" />
              <span className="hidden sm:inline text-white">Install App</span>
            </button>
          )}

          <button
            onClick={onResetClick}
            title="Reset all grades"
            className="p-2 sm:px-4 sm:py-2 border border-hairline hover:border-m-red hover:text-m-red text-muted-text rounded-none transition-colors uppercase font-bmw-display font-bold text-[10px] sm:text-xs tracking-wider flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-m-red" />
            <span className="hidden sm:inline text-white">Reset</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
