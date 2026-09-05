import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import MStripeDivider from './MStripeDivider';
import useDialog from '../hooks/useDialog';

function ProfileRow({ profile, isActive, isOnlyProfile, onSwitch, onRename, onDelete }) {
  const [mode, setMode] = useState('idle');
  const [draft, setDraft] = useState(profile.name);

  const startRename = () => {
    setDraft(profile.name);
    setMode('rename');
  };

  const commitRename = (event) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (trimmed && trimmed !== profile.name) onRename(profile.id, trimmed);
    setMode('idle');
  };

  if (mode === 'rename') {
    return (
      <li>
        <form
          onSubmit={commitRename}
          className="flex items-center gap-2 border border-m-blue-light bg-surface-soft px-3 py-2"
        >
          <label htmlFor={`rename-${profile.id}`} className="sr-only">
            Rename {profile.name}
          </label>
          <input
            id={`rename-${profile.id}`}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setMode('idle')}
            maxLength={24}
            className="flex-1 min-w-0 bg-canvas text-white font-mono text-xs border border-hairline focus:border-white rounded-none px-2 h-8"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            title="Save name"
            className="p-1.5 border border-hairline hover:border-tier-pass text-tier-pass disabled:text-muted-text disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Save name</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('idle')}
            title="Cancel"
            className="p-1.5 border border-hairline hover:border-white text-muted-text hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Cancel rename</span>
          </button>
        </form>
      </li>
    );
  }

  if (mode === 'confirm') {
    return (
      <li>
        <div className="flex items-center gap-2 border border-tier-risk bg-surface-soft px-3 py-2.5">
          <span className="flex-1 min-w-0 text-[11px] text-body-text leading-snug">
            Delete <span className="text-white font-bold">{profile.name}</span> and their grades?
            {isOnlyProfile && (
              <span className="block text-[10px] text-muted-text mt-0.5">
                This is your only profile — you will be asked for a name again.
              </span>
            )}
          </span>
          <button
            onClick={() => onDelete(profile.id)}
            className="px-2.5 py-1.5 border border-tier-risk text-tier-risk hover:bg-m-red/10 text-[10px] font-bmw-display font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            Delete
          </button>
          <button
            onClick={() => setMode('idle')}
            className="px-2.5 py-1.5 border border-hairline text-muted-text hover:text-white hover:border-white text-[10px] font-bmw-display font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            Keep
          </button>
        </div>
      </li>
    );
  }

  const graded = Object.keys(profile.grades ?? {}).length;

  return (
    <li>
      <div
        className={`flex items-stretch border transition-colors ${
          isActive ? 'border-m-blue-light' : 'border-hairline'
        }`}
      >
        <button
          onClick={onSwitch}
          aria-current={isActive ? 'true' : undefined}
          className="flex-1 min-w-0 flex items-center justify-between gap-3 px-4 py-3 bg-surface-soft text-left hover:bg-surface-card transition-colors cursor-pointer"
        >
          <span className="min-w-0">
            <span className="block text-xs font-bold text-white truncate">{profile.name}</span>
            <span className="block text-[9px] text-muted-text font-mono mt-0.5 uppercase">
              {profile.pathway && profile.pathway !== 'undecided'
                ? profile.pathway.toUpperCase()
                : 'NO DEGREE SET'}{' '}
              · {graded} graded
            </span>
          </span>
          {isActive && (
            <span className="flex items-center gap-1.5 text-m-blue-light font-mono text-[9px] font-bold uppercase shrink-0">
              <Check className="w-3 h-3" aria-hidden="true" />
              In use
            </span>
          )}
        </button>

        <button
          onClick={startRename}
          title={`Rename ${profile.name}`}
          className="px-2.5 bg-surface-soft border-l border-hairline text-muted-text hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="sr-only">Rename {profile.name}</span>
        </button>
        <button
          onClick={() => setMode('confirm')}
          title={`Delete ${profile.name}`}
          className="px-2.5 bg-surface-soft border-l border-hairline text-muted-text hover:text-tier-risk transition-colors cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="sr-only">Delete {profile.name}</span>
        </button>
      </div>
    </li>
  );
}

export default function ProfileMenu({
  isOpen,
  onClose,
  profiles,
  activeId,
  onSwitch,
  onAdd,
  onRename,
  onDelete,
  onResetAll,
}) {
  const { ref: dialogRef, props: dialogProps } = useDialog({
    isOpen,
    onClose,
    labelledBy: 'profile-menu-heading',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-110 flex items-center justify-center p-4 select-none cursor-pointer"
        >
          <motion.div
            ref={dialogRef}
            {...dialogProps}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface-card border border-hairline w-full max-w-md rounded-none overflow-hidden shadow-2xl relative cursor-default"
          >
            <MStripeDivider />

            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="profile-menu-heading"
                    className="font-bmw-display font-bold text-sm text-white uppercase tracking-widest"
                  >
                    PROFILES
                  </h3>
                  <p className="text-[10px] text-muted-text font-mono mt-1">
                    {profiles.length} saved
                  </p>
                </div>
                <button
                  onClick={onClose}
                  title="Close"
                  className="p-1.5 border border-hairline hover:border-white text-muted-text hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              <ul className="flex flex-col gap-2">
                {profiles.map((profile) => (
                  <ProfileRow
                    key={profile.id}
                    profile={profile}
                    isActive={profile.id === activeId}
                    isOnlyProfile={profiles.length === 1}
                    onSwitch={() => {
                      if (profile.id !== activeId) onSwitch(profile.id);
                      onClose();
                    }}
                    onRename={onRename}
                    onDelete={onDelete}
                  />
                ))}
              </ul>

              <button
                onClick={onAdd}
                className="w-full py-2.5 border border-hairline hover:border-m-blue-light text-white text-[10px] font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-m-blue-light" aria-hidden="true" />
                Add profile
              </button>

              <div className="border-t border-hairline border-dashed pt-4">
                <button
                  onClick={onResetAll}
                  className="w-full py-2.5 border border-m-red/50 hover:border-m-red hover:bg-m-red/10 text-tier-risk text-[10px] font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Delete everything
                </button>
                <p className="text-[10px] text-muted-text mt-2 leading-relaxed text-center">
                  Removes every profile and all their grades from this device.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
