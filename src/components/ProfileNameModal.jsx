import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import MStripeDivider from './MStripeDivider';

function NameField({ onSubmit, onCancel }) {
  const [name, setName] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="profile-name" className="sr-only">
        Profile name
      </label>
      <input
        id="profile-name"
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={24}
        autoComplete="off"
        placeholder="Your name"
        className="w-full h-11 bg-canvas text-white text-center font-mono text-sm border border-hairline focus:border-m-blue-light rounded-none px-3"
      />

      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full py-3 bg-m-red hover:bg-m-red/80 disabled:bg-surface-card disabled:text-muted-text disabled:cursor-not-allowed text-white text-xs font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors border border-m-red disabled:border-hairline cursor-pointer"
      >
        CONTINUE &rarr;
      </button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2.5 bg-surface-card border border-hairline hover:border-white text-muted-text hover:text-white text-[10px] font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors cursor-pointer"
        >
          CANCEL
        </button>
      )}
    </form>
  );
}

export default function ProfileNameModal({ isOpen, onSubmit, onCancel }) {
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
            <MStripeDivider />

            <div className="mt-2 flex flex-col items-center">
              <UserPlus className="w-7 h-7 text-m-blue-light mb-3" aria-hidden="true" />
              <h2 className="text-xl font-black font-bmw-display text-white tracking-tighter uppercase leading-none">
                NAME YOUR PROFILE
              </h2>
              <div className="w-16 h-0.5 bg-hairline mx-auto mt-4" />
            </div>

            <p className="text-xs text-muted-text leading-relaxed font-light">
              THIS LABELS YOUR PROFILE. EVERY GRADE AND SETTING YOU ENTER IS STORED UNDER IT, AND
              YOU CAN CHANGE PROFILES LATER FROM THE NAVIGATION BAR.
            </p>

            <NameField onSubmit={onSubmit} onCancel={onCancel} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
