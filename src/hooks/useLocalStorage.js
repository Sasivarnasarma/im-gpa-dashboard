import { useEffect, useState } from 'react';

const failureMessage = (error) =>
  error?.name === 'QuotaExceededError' || error?.code === 22
    ? 'DEVICE STORAGE FULL — CHANGES NOT SAVED'
    : 'STORAGE UNAVAILABLE — CHANGES NOT SAVED';

// Mirrors state into localStorage. A rejected write (private browsing, full
// quota) is reported through onError rather than thrown.
export default function useLocalStorage(key, { read, write, fallback = null }, onError) {
  const [value, setValue] = useState(() => {
    try {
      return read(localStorage.getItem(key));
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      const raw = write(value);
      if (raw === null || raw === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, raw);
      }
    } catch (error) {
      onError?.(failureMessage(error));
    }
  }, [key, value, write, onError]);

  return [value, setValue];
}
