import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useProfiles from '../../src/hooks/useProfiles';
import { STORAGE_KEYS } from '../../src/data/constants';

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES));

beforeEach(() => localStorage.clear());

describe('useProfiles', () => {
  it('starts with no profile, so the app knows to ask for a name', () => {
    const { result } = renderHook(() => useProfiles());

    expect(result.current.needsProfile).toBe(true);
    expect(result.current.profiles).toHaveLength(0);
    expect(result.current.activeProfile).toBeNull();
  });

  it('adds a profile and puts it in use', async () => {
    const { result } = renderHook(() => useProfiles());
    act(() => result.current.addProfile('Amara'));

    expect(result.current.activeProfile.name).toBe('Amara');
    expect(result.current.needsProfile).toBe(false);
    await waitFor(() => expect(stored().profiles).toHaveLength(1));
  });

  it('writes grades to the active profile only', () => {
    const { result } = renderHook(() => useProfiles());
    act(() => result.current.addProfile('Amara'));
    const amara = result.current.activeId;
    act(() => result.current.updateActive({ grades: { 'INTE 11213': 'A' } }));
    act(() => result.current.addProfile('Kasun'));
    act(() => result.current.updateActive({ grades: { 'INTE 11213': 'C' } }));

    const byId = Object.fromEntries(result.current.profiles.map((p) => [p.id, p]));
    expect(byId[amara].grades).toEqual({ 'INTE 11213': 'A' });
    expect(result.current.activeProfile.grades).toEqual({ 'INTE 11213': 'C' });
  });

  it('switches, renames and removes', () => {
    const { result } = renderHook(() => useProfiles());
    act(() => result.current.addProfile('Amara'));
    const amara = result.current.activeId;
    act(() => result.current.addProfile('Kasun'));
    const kasun = result.current.activeId;

    act(() => result.current.switchProfile(amara));
    expect(result.current.activeProfile.name).toBe('Amara');

    act(() => result.current.renameProfile(amara, 'Amara P.'));
    expect(result.current.activeProfile.name).toBe('Amara P.');

    act(() => result.current.removeProfile(kasun));
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.activeId).toBe(amara);
  });

  it('returns to first-run when the last profile is removed', () => {
    const { result } = renderHook(() => useProfiles());
    act(() => result.current.addProfile('Solo'));
    act(() => result.current.removeProfile(result.current.activeId));

    expect(result.current.needsProfile).toBe(true);
  });

  it('clears everything on reset', async () => {
    const { result } = renderHook(() => useProfiles());
    act(() => result.current.addProfile('Amara'));
    act(() => result.current.resetAll());

    expect(result.current.profiles).toHaveLength(0);
    await waitFor(() => expect(stored().profiles).toHaveLength(0));
  });

  it('tracks whether the profile menu is open', () => {
    const { result } = renderHook(() => useProfiles());

    expect(result.current.menuOpen).toBe(false);
    act(() => result.current.openMenu());
    expect(result.current.menuOpen).toBe(true);
    act(() => result.current.closeMenu());
    expect(result.current.menuOpen).toBe(false);
  });

  it('reloads the profiles already on the device', () => {
    localStorage.setItem(
      STORAGE_KEYS.PROFILES,
      JSON.stringify({ version: 1, activeId: 'p_x', profiles: [{ id: 'p_x', name: 'Saved' }] })
    );
    const { result } = renderHook(() => useProfiles());

    expect(result.current.activeProfile.name).toBe('Saved');
  });

  it('reports a storage failure to its caller rather than throwing', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const onError = vi.fn();
    const { result } = renderHook(() => useProfiles(onError));
    act(() => result.current.addProfile('Amara'));

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/STORAGE/)));
    vi.restoreAllMocks();
  });
});
