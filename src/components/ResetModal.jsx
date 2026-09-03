import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import MStripeDivider from './MStripeDivider';

export default function ResetModal({ isOpen, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface-card border border-hairline w-full max-w-md rounded-none overflow-hidden shadow-2xl relative"
          >
            <MStripeDivider />

            <div className="p-6">
              <h3 className="font-bmw-display font-bold text-sm text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-m-red" />
                CONFIRM DATABASE RESET
              </h3>

              <p className="text-xs text-muted-text leading-relaxed mb-6 font-light">
                PROCEEDING WILL IRREVERSIBLY ERASE ALL LOCALLY STORED GRADES FROM YOUR DEVICE. THIS
                ACTION CANNOT BE UNDONE.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-hairline hover:border-white text-xs font-bmw-display font-bold uppercase tracking-widest text-muted-text hover:text-white rounded-none transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 bg-m-red hover:bg-m-red/80 text-white text-xs font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors border border-m-red cursor-pointer"
                >
                  PROCEED RESET
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
