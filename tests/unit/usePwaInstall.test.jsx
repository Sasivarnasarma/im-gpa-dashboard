import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePwaInstall from '../../src/hooks/usePwaInstall';
import { STORAGE_KEYS } from '../../src/data/constants';

const setStandalone = (matches) => {
  window.matchMedia = (query) => ({
    matches,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
};

beforeEach(() => {
  localStorage.clear();
  setStandalone(false);
});
afterEach(() => vi.restoreAllMocks());

describe('usePwaInstall', () => {
  it('prompts on a fresh browser', () => {
    const { result } = renderHook(() => usePwaInstall(vi.fn()));

    expect(result.current.installPromptCompleted).toBe(false);
    expect(result.current.showInstallBtn).toBe(true);
  });

  it('never prompts when already running as an installed app', () => {
    setStandalone(true);
    const { result } = renderHook(() => usePwaInstall(vi.fn()));

    expect(result.current.installPromptCompleted).toBe(true);
    expect(result.current.showInstallBtn).toBe(false);
  });

  it('never prompts again once installed', () => {
    localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
    const { result } = renderHook(() => usePwaInstall(vi.fn()));

    expect(result.current.installPromptCompleted).toBe(true);
  });

  it('honours the three-day cooldown after a dismissal', () => {
    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, Date.now().toString());
    const { result } = renderHook(() => usePwaInstall(vi.fn()));

    expect(result.current.installPromptCompleted).toBe(true);
  });

  it('asks again once the cooldown has expired', () => {
    const fourDaysAgo = Date.now() - 4 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, fourDaysAgo.toString());
    const { result } = renderHook(() => usePwaInstall(vi.fn()));

    expect(result.current.installPromptCompleted).toBe(false);
  });

  it('records the dismissal so the reminder is timed from it', () => {
    const toast = vi.fn();
    const { result } = renderHook(() => usePwaInstall(toast));
    act(() => result.current.dismissPrompt());

    expect(result.current.installPromptCompleted).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED)).toBeTruthy();
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/3 DAYS/i));
  });

  it('points at the browser menu when no native prompt was captured', async () => {
    const toast = vi.fn();
    const { result } = renderHook(() => usePwaInstall(toast));
    await act(() => result.current.installFromPrompt());

    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/BROWSER BAR\/MENU/i));
    expect(result.current.installPromptCompleted).toBe(true);
  });

  it('forwards to the native prompt when the browser offered one', async () => {
    const toast = vi.fn();
    const prompt = vi.fn();
    const { result } = renderHook(() => usePwaInstall(toast));

    act(() => {
      const event = new Event('beforeinstallprompt');
      event.prompt = prompt;
      event.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });
    await act(() => result.current.installFromPrompt());

    expect(prompt).toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEYS.INSTALLED)).toBe('true');
  });

  it('marks the app installed when the browser says so', () => {
    const toast = vi.fn();
    const { result } = renderHook(() => usePwaInstall(toast));
    act(() => window.dispatchEvent(new Event('appinstalled')));

    expect(localStorage.getItem(STORAGE_KEYS.INSTALLED)).toBe('true');
    expect(result.current.installPromptCompleted).toBe(true);
  });

  it('reopens the prompt on demand from the navbar', () => {
    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, Date.now().toString());
    const { result } = renderHook(() => usePwaInstall(vi.fn()));
    act(() => result.current.reopenPrompt());

    expect(result.current.installPromptCompleted).toBe(false);
  });

  it('keeps installed status through a reset, dropping only the dismissal', () => {
    localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, Date.now().toString());
    const { result } = renderHook(() => usePwaInstall(vi.fn()));
    act(() => result.current.resetInstallPrompt());

    expect(localStorage.getItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED)).toBeNull();
    expect(result.current.installPromptCompleted).toBe(true);
  });
});
