import { useCallback, useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dialog semantics for an overlay: focus trapped inside while open, Escape to
// leave, focus restored on close. Omit onClose for a step with no way out.
export default function useDialog({ isOpen, onClose, labelledBy }) {
  const ref = useRef(null);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape' && onClose) {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...(ref.current?.querySelectorAll(FOCUSABLE) ?? [])].filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;
    const node = ref.current;
    // Fall back to the panel when nothing inside is focusable.
    const target = node?.querySelector(FOCUSABLE) ?? node;
    target?.focus?.();

    return () => {
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return {
    ref,
    props: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': labelledBy,
      tabIndex: -1,
      onKeyDown: handleKeyDown,
    },
  };
}
