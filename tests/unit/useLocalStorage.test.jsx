import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useLocalStorage from '../../src/hooks/useLocalStorage';

const asJson = { read: (raw) => (raw ? JSON.parse(raw) : null), write: JSON.stringify };

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('useLocalStorage — a failed write must not take the app down', () => {
  it('mirrors state into storage on the happy path', async () => {
    const { result } = renderHook(() => useLocalStorage('k', asJson));
    act(() => result.current[1]({ a: 1 }));

    await waitFor(() => expect(localStorage.getItem('k')).toBe('{"a":1}'));
  });

  it('survives a rejected write and reports it instead of throwing', async () => {
    // Safari in private browsing rejects setItem outright.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const onError = vi.fn();

    const { result } = renderHook(() => useLocalStorage('k', asJson, onError));
    act(() => result.current[1]({ a: 1 }));

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError.mock.calls.at(-1)[0]).toMatch(/STORAGE UNAVAILABLE/);
    // The value stays on screen even though the disk refused it.
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it('names a full device separately, since the fix differs', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const onError = vi.fn();

    const { result } = renderHook(() => useLocalStorage('k', asJson, onError));
    act(() => result.current[1]({ a: 1 }));

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError.mock.calls.at(-1)[0]).toMatch(/STORAGE FULL/);
  });

  it('falls back rather than throwing when stored JSON is corrupt', () => {
    localStorage.setItem('k', '{ not json');
    const { result } = renderHook(() =>
      useLocalStorage('k', { ...asJson, fallback: { safe: true } })
    );

    expect(result.current[0]).toEqual({ safe: true });
  });

  it('works without an error handler at all', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('nope');
    });
    const { result } = renderHook(() => useLocalStorage('k', asJson));

    expect(() => act(() => result.current[1]({ a: 1 }))).not.toThrow();
  });
});
