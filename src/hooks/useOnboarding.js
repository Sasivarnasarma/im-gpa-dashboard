import { useState } from 'react';
import { STORAGE_KEYS, SPECIALIZATION_LABELS } from '../data/constants';
import useLocalStorage from './useLocalStorage';

// Storage adapters live at module scope so useLocalStorage's mirror effect
// receives a stable `write` reference.
const SECURITY_STORAGE = {
  read: (raw) => raw === 'true',
  write: (value) => (value ? 'true' : null),
  fallback: false,
};

const PATHWAY_STORAGE = {
  read: (raw) => raw || null,
  write: (value) => value,
  fallback: null,
};

const SPECIALIZATION_STORAGE = {
  read: (raw) => raw || 'undecided',
  write: (value) => value,
  fallback: 'undecided',
};

// Manages the onboarding sequence (security, PWA install, and degree pathway)
export default function useOnboarding(triggerToast, installPromptCompleted) {
  const [securityAccepted, setSecurityAccepted] = useLocalStorage(
    STORAGE_KEYS.SECURITY_ACCEPTED,
    SECURITY_STORAGE
  );

  const [pathway, setPathway] = useLocalStorage(STORAGE_KEYS.PATHWAY, PATHWAY_STORAGE);

  const [specialization, setSpecialization] = useLocalStorage(
    STORAGE_KEYS.SPECIALIZATION,
    SPECIALIZATION_STORAGE
  );

  const [modalStep, setModalStep] = useState(1);

  const acceptSecurity = () => {
    setSecurityAccepted(true);
    triggerToast('LOCAL STORAGE PERMISSION ACCEPTED');
  };

  const selectPathway = (path) => {
    setPathway(path);
    triggerToast(`DEGREE: B.SC. HONS IN ${path.toUpperCase()} INITIALIZED`);
  };

  const selectSpecialization = (spec) => {
    setSpecialization(spec);
    setPathway('mit');
    triggerToast(
      `MIT DEGREE: ${SPECIALIZATION_LABELS[spec] ?? spec.toUpperCase()} SPECIALIZATION INITIALIZED`
    );
  };

  const selectSpecializationDirect = (spec) => {
    setSpecialization(spec);
    triggerToast(
      `SPECIALIZATION: ${SPECIALIZATION_LABELS[spec] ?? spec.toUpperCase()} INITIALIZED`
    );
  };

  // Reset onboarding state back to step 1
  const resetOnboarding = () => {
    setPathway(null);
    setSpecialization('undecided');
    setModalStep(1);
    setSecurityAccepted(false);
  };

  // Sequence gating for onboarding modals
  const showSecurityModal = !securityAccepted;
  const showInstallPrompt = securityAccepted && !installPromptCompleted;
  const showWelcomeModal = securityAccepted && installPromptCompleted && !pathway;
  const isOnboardingActive = showSecurityModal || showInstallPrompt || showWelcomeModal;

  return {
    pathway,
    specialization,
    setPathway,
    setSpecialization,
    modalStep,
    setModalStep,
    acceptSecurity,
    selectPathway,
    selectSpecialization,
    selectSpecializationDirect,
    resetOnboarding,
    showSecurityModal,
    showInstallPrompt,
    showWelcomeModal,
    isOnboardingActive,
  };
}
