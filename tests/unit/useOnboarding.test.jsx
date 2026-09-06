import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useOnboarding from '../../src/hooks/useOnboarding';
import { STORAGE_KEYS } from '../../src/data/constants';

const setup = (overrides = {}) => {
  const updateActive = vi.fn();
  const triggerToast = vi.fn();
  const props = {
    triggerToast,
    installPromptCompleted: true,
    activeProfile: { pathway: 'it', specialization: 'undecided' },
    needsProfile: false,
    updateActive,
    ...overrides,
  };
  return { ...renderHook(() => useOnboarding(props)), updateActive, triggerToast };
};

beforeEach(() => localStorage.clear());

describe('useOnboarding — the order of the gates', () => {
  it('asks for the storage policy before anything else', () => {
    const { result } = setup({ activeProfile: null, needsProfile: true });

    expect(result.current.showSecurityModal).toBe(true);
    expect(result.current.showInstallPrompt).toBe(false);
    expect(result.current.showNameModal).toBe(false);
    expect(result.current.isOnboardingActive).toBe(true);
  });

  it('offers the install prompt once the policy is accepted', () => {
    localStorage.setItem(STORAGE_KEYS.SECURITY_ACCEPTED, 'true');
    const { result } = setup({ installPromptCompleted: false, needsProfile: true });

    expect(result.current.showInstallPrompt).toBe(true);
    expect(result.current.showNameModal).toBe(false);
  });

  it('asks for a name after the install prompt, before the degree', () => {
    localStorage.setItem(STORAGE_KEYS.SECURITY_ACCEPTED, 'true');
    const { result } = setup({ activeProfile: null, needsProfile: true });

    expect(result.current.showNameModal).toBe(true);
    expect(result.current.showWelcomeModal).toBe(false);
  });

  it('asks for the degree once a profile exists without one', () => {
    localStorage.setItem(STORAGE_KEYS.SECURITY_ACCEPTED, 'true');
    const { result } = setup({ activeProfile: { pathway: null, specialization: 'undecided' } });

    expect(result.current.showWelcomeModal).toBe(true);
  });

  it('shows nothing once every step is done', () => {
    localStorage.setItem(STORAGE_KEYS.SECURITY_ACCEPTED, 'true');
    const { result } = setup();

    expect(result.current.isOnboardingActive).toBe(false);
  });
});

describe('useOnboarding — the choices it writes', () => {
  it('accepting the policy persists to the device, not the profile', () => {
    const { result, updateActive, triggerToast } = setup();
    act(() => result.current.acceptSecurity());

    expect(localStorage.getItem(STORAGE_KEYS.SECURITY_ACCEPTED)).toBe('true');
    expect(updateActive).not.toHaveBeenCalled();
    expect(triggerToast).toHaveBeenCalled();
  });

  it('writes the pathway onto the active profile', () => {
    const { result, updateActive } = setup();
    act(() => result.current.selectPathway('mit'));

    expect(updateActive).toHaveBeenCalledWith({ pathway: 'mit' });
  });

  it('sets pathway and specialization together, so MIT is never half-chosen', () => {
    const { result, updateActive } = setup();
    act(() => result.current.selectSpecialization('bse'));

    expect(updateActive).toHaveBeenCalledWith({ specialization: 'bse', pathway: 'mit' });
  });

  it('changes specialization on its own once the degree is set', () => {
    const { result, updateActive } = setup();
    act(() => result.current.selectSpecializationDirect('oscm'));

    expect(updateActive).toHaveBeenCalledWith({ specialization: 'oscm' });
  });

  it('reads pathway from the active profile, falling back before one exists', () => {
    const { result } = setup({ activeProfile: null, needsProfile: true });

    expect(result.current.pathway).toBeNull();
    expect(result.current.specialization).toBe('undecided');
  });

  it('rewinds to the storage policy on reset', () => {
    localStorage.setItem(STORAGE_KEYS.SECURITY_ACCEPTED, 'true');
    const { result } = setup();
    act(() => result.current.setModalStep(2));
    act(() => result.current.resetOnboarding());

    expect(result.current.showSecurityModal).toBe(true);
    expect(result.current.modalStep).toBe(1);
  });
});
