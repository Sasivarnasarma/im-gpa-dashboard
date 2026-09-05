import { useState } from 'react';
import { STORAGE_KEYS } from '../data/constants';
import useLocalStorage from './useLocalStorage';
import * as store from '../lib/profiles';

const PROFILES_STORAGE = {
  read: store.parseContainer,
  write: JSON.stringify,
  fallback: store.EMPTY_CONTAINER,
};

export default function useProfiles(onStorageError) {
  const [container, setContainer] = useLocalStorage(
    STORAGE_KEYS.PROFILES,
    PROFILES_STORAGE,
    onStorageError
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const activeProfile = store.getActiveProfile(container);

  return {
    profiles: container.profiles,
    activeProfile,
    activeId: container.activeId,
    needsProfile: activeProfile === null,

    menuOpen,
    openMenu: () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),

    addProfile: (name) => setContainer((c) => store.addProfile(c, name)),
    switchProfile: (id) => setContainer((c) => store.switchProfile(c, id)),
    renameProfile: (id, name) => setContainer((c) => store.renameProfile(c, id, name)),
    duplicateProfile: (id, name) => setContainer((c) => store.duplicateProfile(c, id, name)),
    removeProfile: (id) => setContainer((c) => store.removeProfile(c, id)),

    updateActive: (patch) => setContainer((c) => store.updateActive(c, patch)),

    resetAll: () => setContainer(store.EMPTY_CONTAINER),
  };
}
