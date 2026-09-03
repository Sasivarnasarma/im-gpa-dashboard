import { useEffect, useState } from 'react';

// localStorage-backed useState. `read` maps the stored string (or null when
// the key is absent) to the in-memory value; `write` maps it back, and when
// it returns null/undefined the key is removed instead — this app's
// convention for cleared state. A `read` that throws (corrupted or
// hand-edited storage) falls back to `fallback` rather than throwing during
// initial render and white-screening the app.
//
// `write` is expected to be a stable (module-level) function so the mirror
// effect below only re-runs when the value actually changes.
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
