import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useAnnouncement from '../../src/hooks/useAnnouncement';
import { ANNOUNCEMENT, STORAGE_KEYS } from '../../src/data/constants';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('announcement dismissal', () => {
  it('shows an unseen announcement, stores its ID only after dismissal, and stays hidden after reload', () => {
    const first = renderHook(() => useAnnouncement());
    expect(first.result.current.shouldShow).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT_DISMISSED)).toBeNull();
    act(() => first.result.current.dismiss());
    expect(first.result.current.shouldShow).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT_DISMISSED)).toBe(String(ANNOUNCEMENT.id));
    first.unmount();
    const reloaded = renderHook(() => useAnnouncement());
    expect(reloaded.result.current.shouldShow).toBe(false);
  });

  it('shows a changed ID but keeps edits to a dismissed announcement hidden', () => {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT_DISMISSED, '1');
    const { result, rerender } = renderHook(
      ({ announcement }) => useAnnouncement(undefined, announcement),
      { initialProps: { announcement: { ...ANNOUNCEMENT, id: '1' } } }
    );
    expect(result.current.shouldShow).toBe(false);
    rerender({ announcement: { ...ANNOUNCEMENT, id: '1', title: 'Edited title' } });
    expect(result.current.shouldShow).toBe(false);
    rerender({ announcement: { ...ANNOUNCEMENT, id: '2' } });
    expect(result.current.shouldShow).toBe(true);
    act(() => result.current.dismiss());
    expect(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT_DISMISSED)).toBe('2');
  });

  it('accepts numeric IDs and shares dismissal across independent profile consumers', () => {
    const one = renderHook(() => useAnnouncement(undefined, { ...ANNOUNCEMENT, id: 42 }));
    act(() => one.result.current.dismiss());
    const another = renderHook(() => useAnnouncement(undefined, { ...ANNOUNCEMENT, id: '42' }));
    expect(another.result.current.shouldShow).toBe(false);
  });

  it('can be disabled and ignores blank announcements', () => {
    for (const patch of [{ id: null }, { id: ' ' }, { title: ' ' }, { message: ' ' }]) {
      const { result, unmount } = renderHook(() =>
        useAnnouncement(undefined, { ...ANNOUNCEMENT, ...patch })
      );
      expect(result.current.shouldShow).toBe(false);
      act(() => result.current.dismiss());
      unmount();
    }
  });

  it('remains usable when storage reads and writes fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useAnnouncement(onError));
    expect(result.current.shouldShow).toBe(true);
    act(() => result.current.dismiss());
    expect(result.current.shouldShow).toBe(false);
    expect(onError).toHaveBeenCalledWith('STORAGE UNAVAILABLE — CHANGES NOT SAVED');
  });
});
