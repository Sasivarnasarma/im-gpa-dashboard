import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useDialog from '../hooks/useDialog';

export default function WelcomeModal({
  isOpen,
  modalStep,
  setModalStep,
  onSelectPathway,
  onSelectSpecialization,
}) {
  // No onClose: a degree has to be chosen before the dashboard means anything.
  const { ref: dialogRef, props: dialogProps } = useDialog({
    isOpen,
    labelledBy: 'welcome-modal-heading',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-100 flex items-center justify-center p-4 select-none"
        >
          <motion.div
            ref={dialogRef}
            {...dialogProps}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="border border-hairline bg-surface-soft p-6 sm:p-8 rounded-none max-w-xl w-full flex flex-col gap-6 relative"
          >
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="h-full flex-1 bg-m-blue-light" />
              <div className="h-full flex-1 bg-m-blue-dark" />
              <div className="h-full flex-1 bg-m-red" />
            </div>

            {modalStep === 1 ? (
              <>
                {/* Step 1: Degree Selection */}
                <div className="text-center mt-2">
                  <h2
                    id="welcome-modal-heading"
                    className="text-xl sm:text-2xl font-black font-bmw-display text-white tracking-tighter uppercase leading-none"
                  >
                    SELECT DEGREE PROGRAMME
                  </h2>
                  <div className="w-16 h-0.5 bg-hairline mx-auto mt-4" />
                </div>

                <p className="text-xs text-muted-text leading-relaxed text-center font-light">
                  PLEASE CHOOSE YOUR DEGREE PROGRAMME. THIS TAILORS YOUR COURSE CURRICULUM, AND CAN
                  BE TOGGLED IN THE TOP NAVIGATION BAR AT ANY TIME.
                </p>

                {/* Degree Options */}
                <div className="flex flex-col gap-4 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => onSelectPathway('it')}
                      className="group border border-hairline hover:border-m-red bg-surface-card p-5 text-left rounded-none transition-colors flex flex-col gap-2.5 cursor-pointer font-sans"
                    >
                      <span className="font-bmw-display font-bold text-xs uppercase text-white group-hover:text-m-red transition-colors">
                        IT DEGREE
                      </span>
                      <span className="text-[10px] text-muted-text leading-normal font-light">
                        B.Sc. (Hons) in Information Technology
                      </span>
                      <span className="font-mono text-[9px] text-m-red uppercase tracking-wider mt-1.5 font-bold group-hover:underline">
                        INITIALIZE CURRICULUM &rarr;
                      </span>
                    </button>

                    <button
                      onClick={() => setModalStep(2)}
                      className="group border border-hairline hover:border-m-red bg-surface-card p-5 text-left rounded-none transition-colors flex flex-col gap-2.5 cursor-pointer font-sans"
                    >
                      <span className="font-bmw-display font-bold text-xs uppercase text-white group-hover:text-m-red transition-colors">
                        MIT DEGREE
                      </span>
                      <span className="text-[10px] text-muted-text leading-normal font-light">
                        B.Sc. (Hons) in Management and Information Technology
                      </span>
                      <span className="font-mono text-[9px] text-m-red uppercase tracking-wider mt-1.5 font-bold group-hover:underline">
                        CHOOSE SPECIALIZATION &rarr;
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectPathway('undecided')}
                    className="group border border-dashed border-hairline hover:border-white bg-surface-soft p-4 text-center rounded-none transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer font-sans"
                  >
                    <span className="font-bmw-display font-bold text-xs uppercase text-white group-hover:text-m-blue-light transition-colors">
                      NOT DECIDED YET
                    </span>
                    <span className="text-[9px] text-muted-text font-light">
                      Loads only Year 1 common subjects (you can choose your degree later).
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Step 2: MIT Specialization */}
                <div className="text-center mt-2">
                  <span className="text-[9px] text-m-orange font-bold uppercase tracking-[0.2em] block mb-2 font-bmw-display">
                    B.SC. HONS IN MIT SPECIALIZATION
                  </span>
                  <h2
                    id="welcome-modal-heading"
                    className="text-xl sm:text-2xl font-black font-bmw-display text-white tracking-tighter uppercase leading-none"
                  >
                    SELECT YEAR 3 PATHWAY
                  </h2>
                  <div className="w-16 h-0.5 bg-hairline mx-auto mt-4" />
                </div>

                <p className="text-xs text-muted-text leading-relaxed text-center font-light">
                  CHOOSE YOUR MIT DEGREE YEAR 3 SPECIALIZATION PATHWAY. THIS CONFIGURES COMPULSORY
                  AND OPTIONAL CURRICULUM GROUPS.
                </p>

                {/* Specialization Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <button
                    onClick={() => onSelectSpecialization('bse')}
                    className="group border border-hairline hover:border-m-orange bg-surface-card p-4 text-left rounded-none transition-colors flex flex-col gap-2 cursor-pointer font-sans"
                  >
                    <span className="font-bmw-display font-bold text-xs uppercase text-white group-hover:text-m-orange transition-colors">
                      BSE
                    </span>
                    <span className="text-[9px] text-muted-text leading-relaxed font-light">
                      Business Systems Engineering
                    </span>
                  </button>

                  <button
                    onClick={() => onSelectSpecialization('oscm')}
                    className="group border border-hairline hover:border-m-orange bg-surface-card p-4 text-left rounded-none transition-colors flex flex-col gap-2 cursor-pointer font-sans"
                  >
                    <span className="font-bmw-display font-bold text-xs uppercase text-white group-hover:text-m-orange transition-colors">
                      OSCM
                    </span>
                    <span className="text-[9px] text-muted-text leading-relaxed font-light">
                      Operations & Supply Chain
                    </span>
                  </button>

                  <button
                    onClick={() => onSelectSpecialization('is')}
                    className="group border border-hairline hover:border-m-orange bg-surface-card p-4 text-left rounded-none transition-colors flex flex-col gap-2 cursor-pointer font-sans"
                  >
                    <span className="font-bmw-display font-bold text-xs uppercase text-white group-hover:text-m-orange transition-colors">
                      IS
                    </span>
                    <span className="text-[9px] text-muted-text leading-relaxed font-light">
                      Information Systems
                    </span>
                  </button>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <button
                    onClick={() => onSelectSpecialization('undecided')}
                    className="group border border-dashed border-hairline hover:border-white bg-surface-soft p-3.5 text-center rounded-none transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer font-sans"
                  >
                    <span className="font-bmw-display font-bold text-xs uppercase text-white group-hover:text-m-orange transition-colors">
                      NOT DECIDED YET
                    </span>
                    <span className="text-[9px] text-muted-text font-light">
                      Select this if you are in Year 1 or 2, or haven't decided your stream yet.
                    </span>
                  </button>

                  <button
                    onClick={() => setModalStep(1)}
                    className="mt-2 text-center text-[9px] font-mono font-bold text-muted-text hover:text-m-orange uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    &larr; BACK TO DEGREE SELECTION
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
