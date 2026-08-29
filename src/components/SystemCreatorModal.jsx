import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import MStripeDivider from './MStripeDivider';

export default function SystemCreatorModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-110 flex items-center justify-center p-4 select-none cursor-pointer"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface-card border border-hairline w-full max-w-md rounded-none overflow-hidden shadow-2xl relative cursor-default"
          >
            {/* M Stripe top border */}
            <MStripeDivider />

            <div className="p-6 flex flex-col items-center text-center">
              <h3 className="font-bmw-display font-bold text-sm text-white uppercase tracking-widest mb-1.5">
                SYSTEM CREATOR
              </h3>
              <span className="text-[10px] text-m-blue-light font-mono uppercase tracking-wider font-bold block mb-4">
                SASIVARNASARMA
              </span>

              <p className="text-xs text-muted-text leading-relaxed mb-6 font-light">
                ENGINEERED WITH METICULOUS PRECISION TO EMULATE THE HIGH-PERFORMANCE INTENSITY OF
                M-DIVISION TELEMETRY COCKPITS. CONNECT ON PROFESSIONAL PLATFORMS:
              </p>

              <div className="flex flex-col gap-3.5 mb-6 w-full">
                {/* GitHub URL */}
                <a
                  href="https://github.com/Sasivarnasarma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3.5 border border-hairline hover:border-m-blue-light bg-surface-soft transition-colors cursor-pointer w-full"
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
                    <div className="flex flex-col font-sans text-left">
                      <span className="text-[10px] font-bmw-display font-bold text-white uppercase tracking-wider">
                        GITHUB
                      </span>
                      <span className="text-[9px] text-muted-text font-mono">
                        github.com/Sasivarnasarma
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-text group-hover:text-white transition-colors" />
                </a>

                {/* LinkedIn URL */}
                <a
                  href="https://linkedin.com/in/Sasivarnasarma"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3.5 border border-hairline hover:border-m-blue-light bg-surface-soft transition-colors cursor-pointer w-full"
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
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect width="4" height="12" x="2" y="9" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                    <div className="flex flex-col font-sans text-left">
                      <span className="text-[10px] font-bmw-display font-bold text-white uppercase tracking-wider">
                        LINKEDIN
                      </span>
                      <span className="text-[9px] text-muted-text font-mono">
                        linkedin.com/in/Sasivarnasarma
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-text group-hover:text-white transition-colors" />
                </a>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-surface-soft border border-hairline hover:border-white text-white text-xs font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors focus:outline-none"
              >
                CLOSE PROFILE
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
