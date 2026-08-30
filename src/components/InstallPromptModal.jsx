import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MStripeDivider from './MStripeDivider';

export default function InstallPromptModal({ isOpen, onInstall, onDismiss }) {
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="border border-hairline bg-surface-soft p-6 sm:p-8 rounded-none max-w-md w-full flex flex-col gap-6 relative text-center"
          >
            {/* M Stripe top border */}
            <MStripeDivider />

            <div className="text-center mt-2">
              <h2 className="text-xl sm:text-2xl font-black font-bmw-display text-white tracking-tighter uppercase leading-none">
                INSTALL AS APP
              </h2>
              <div className="w-16 h-0.5 bg-hairline mx-auto mt-4" />
            </div>

            <p className="text-xs text-muted-text leading-relaxed font-light">
              ADD THIS GPA CALCULATOR TO YOUR PHONE OR LAPTOP TO USE IT JUST LIKE A REGULAR APP! IT
              WILL LOAD FASTER, WORK OFFLINE, AND LAUNCH DIRECTLY FROM YOUR HOME SCREEN.
            </p>

            <div className="flex flex-col gap-3 mt-2 w-full">
              {/* Install Button */}
              <button
                onClick={onInstall}
                className="w-full py-3 bg-m-blue-light hover:bg-m-blue-dark text-white text-xs font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors cursor-pointer shadow-lg shadow-m-blue-light/10"
              >
                INSTALL NOW
              </button>

              {/* Dismiss Button */}
              <button
                onClick={onDismiss}
                className="w-full py-3 bg-surface-card border border-hairline hover:border-white text-white text-xs font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors cursor-pointer"
              >
                USE IN BROWSER (NOT NOW)
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
