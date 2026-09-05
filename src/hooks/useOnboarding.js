import { useState } from 'react';
import { STORAGE_KEYS, SPECIALIZATION_LABELS } from '../data/constants';
import useLocalStorage from './useLocalStorage';

const SECURITY_STORAGE = {
  read: (raw) => raw === 'true',
  write: (value) => (value ? 'true' : null),
  fallback: false,
};

export default function useOnboarding({
  triggerToast,
  installPromptCompleted,
  activeProfile,
  needsProfile,
  updateActive,
}) {
  const [securityAccepted, setSecurityAccepted] = useLocalStorage(
    STORAGE_KEYS.SECURITY_ACCEPTED,
    SECURITY_STORAGE,
    triggerToast
  );

  const [modalStep, setModalStep] = useState(1);

  const pathway = activeProfile?.pathway ?? null;
  const specialization = activeProfile?.specialization ?? 'undecided';

  const setPathway = (value) => updateActive({ pathway: value });
  const setSpecialization = (value) => updateActive({ specialization: value });

  const acceptSecurity = () => {
    setSecurityAccepted(true);
    triggerToast('LOCAL STORAGE PERMISSION ACCEPTED');
  };

  const selectPathway = (path) => {
    setPathway(path);
    triggerToast(`DEGREE: B.SC. HONS IN ${path.toUpperCase()} INITIALIZED`);
  };

  const selectSpecialization = (spec) => {
    updateActive({ specialization: spec, pathway: 'mit' });
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

  const resetOnboarding = () => {
    setModalStep(1);
    setSecurityAccepted(false);
  };

  const showSecurityModal = !securityAccepted;
  const showInstallPrompt = securityAccepted && !installPromptCompleted;
  const showNameModal = securityAccepted && installPromptCompleted && needsProfile;
  const showWelcomeModal = securityAccepted && installPromptCompleted && !needsProfile && !pathway;
  const isOnboardingActive =
    showSecurityModal || showNameModal || showInstallPrompt || showWelcomeModal;

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
    showNameModal,
    showInstallPrompt,
    showWelcomeModal,
    isOnboardingActive,
  };
}
