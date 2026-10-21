import { ANNOUNCEMENT, STORAGE_KEYS } from '../data/constants';
import useLocalStorage from './useLocalStorage';

const ANNOUNCEMENT_STORAGE = {
  read: (raw) => raw,
  write: (value) => value,
  fallback: null,
};

// Dismissal belongs to this browser, shared by every profile on the device.
export default function useAnnouncement(onStorageError, announcement = ANNOUNCEMENT) {
  const [dismissedId, setDismissedId] = useLocalStorage(
    STORAGE_KEYS.ANNOUNCEMENT_DISMISSED,
    ANNOUNCEMENT_STORAGE,
    onStorageError
  );
  const id = announcement.id == null ? '' : String(announcement.id).trim();
  const shouldShow = Boolean(
    id && announcement.title.trim() && announcement.message.trim() && dismissedId !== id
  );

  return {
    announcement,
    shouldShow,
    dismiss: () => {
      if (id) setDismissedId(id);
    },
  };
}
