import { useEffect, useState } from 'react';

// Synchronizes React state with localStorage with safe error fallback
export default function useLocalStorage(key, { read, write, fallback = null }) {
  const [value, setValue] = useState(() => {
    try {
      return read(localStorage.getItem(key));
    } catch {
      return fallback;
    }
  });

  // Mirror every state change into storage.
  useEffect(() => {
    const raw = write(value);
    if (raw === null || raw === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, raw);
    }
  }, [key, value, write]);

  return [value, setValue];
}
