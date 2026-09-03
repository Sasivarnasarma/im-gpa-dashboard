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

// Owns the three-step onboarding sequence — security policy → PWA install
// prompt → degree & specialization selection — plus the pathway and
// specialization preferences it produces. Those preferences stay
// user-editable afterwards, so the raw setters are exposed for the navbar,
// the mobile selector panel and the Year 3 empty state.
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

  // WelcomeModal's internal step (1 = degree, 2 = MIT specialization).
  const [modalStep, setModalStep] = useState(1);

  const acceptSecurity = () => {
    setSecurityAccepted(true);
    triggerToast('LOCAL STORAGE PERMISSION ACCEPTED');
  };

  // WelcomeModal and the Year 2 empty state both route through here.
  const selectPathway = (path) => {
    setPathway(path);
    triggerToast(`DEGREE: B.SC. HONS IN ${path.toUpperCase()} INITIALIZED`);
  };

  // WelcomeModal's specialization selection — implies the MIT pathway.
  const selectSpecialization = (spec) => {
    setSpecialization(spec);
    setPathway('mit');
    triggerToast(
      `MIT DEGREE: ${SPECIALIZATION_LABELS[spec] ?? spec.toUpperCase()} SPECIALIZATION INITIALIZED`
    );
  };

  // The Year 3 empty state's shortcut: the pathway is already MIT there, so
  // it only sets the specialization.
  const selectSpecializationDirect = (spec) => {
    setSpecialization(spec);
    triggerToast(
      `SPECIALIZATION: ${SPECIALIZATION_LABELS[spec] ?? spec.toUpperCase()} INITIALIZED`
    );
  };

  // Reset flow (ResetModal confirm): drop every onboarding decision so the
  // overlays reappear in sequence from step 1.
  const resetOnboarding = () => {
    setPathway(null);
    setSpecialization('undecided');
    setModalStep(1);
    setSecurityAccepted(false);
  };

  // Which overlay is up. The steps gate each other in sequence, with the
  // install prompt sitting between security and welcome.
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
