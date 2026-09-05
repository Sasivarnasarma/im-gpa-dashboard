import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import useDialog from '../hooks/useDialog';

export default function SecurityModal({ isOpen, onAccept }) {
  // No onClose: accepting the policy is the only way past this step.
  const { ref: dialogRef, props: dialogProps } = useDialog({
    isOpen,
    labelledBy: 'security-modal-heading',
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
            className="border border-hairline bg-surface-soft p-6 sm:p-8 rounded-none max-w-md w-full flex flex-col gap-6 relative text-center"
          >
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="h-full flex-1 bg-m-blue-light" />
              <div className="h-full flex-1 bg-m-blue-dark" />
              <div className="h-full flex-1 bg-m-red" />
            </div>

            <div className="mt-2 flex flex-col items-center">
              <span className="text-[10px] text-m-red font-mono uppercase tracking-[0.2em] font-bold block mb-1">
                🔒 SECURE LOCAL TELEMETRY
              </span>
              <h2
                id="security-modal-heading"
                className="text-xl font-black font-bmw-display text-white tracking-tighter uppercase leading-none mt-2"
              >
                DATA STORAGE POLICY
              </h2>
              <div className="w-16 h-0.5 bg-hairline mx-auto mt-4" />
            </div>

            <p className="text-xs text-muted-text leading-relaxed font-light">
              ALL GRADES AND CONFIGURATIONS ARE STORED EXCLUSIVELY ON YOUR LOCAL DEVICE. WE DO NOT
              COLLECT, TRANSMIT, OR STORE YOUR ACADEMIC RECORDS ON ANY REMOTE SERVERS.
            </p>

            {/* Action Links & Buttons */}
            <div className="flex flex-col gap-3">
              <a
                href="https://github.com/Sasivarnasarma/im-gpa-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 border border-hairline hover:border-m-blue-light bg-surface-card transition-colors cursor-pointer w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-4 h-4 text-white group-hover:text-m-blue-light transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                  <div className="flex flex-col font-sans">
                    <span className="text-[10px] font-bmw-display font-bold text-white uppercase tracking-wider">
                      VERIFY ON GITHUB
                    </span>
                    <span className="text-[9px] text-muted-text font-mono">
                      Sasivarnasarma/im-gpa-dashboard
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-text group-hover:text-white transition-colors" />
              </a>

              <button
                onClick={onAccept}
                className="w-full py-3 bg-m-red hover:bg-m-red/80 text-white text-xs font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors border border-m-red flex items-center justify-center gap-1.5 cursor-pointer"
              >
                PROCEED TO SETUP &rarr;
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
