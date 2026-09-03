import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../data/constants';

const isRunningStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  window.matchMedia('(display-mode: minimal-ui)').matches ||
  window.navigator.standalone === true;

const getDismissTimestamp = () => Date.now().toString();

// Owns the native PWA install flow: captures the browser's deferred
// beforeinstallprompt, tracks whether the in-app install prompt is complete
// (installed, dismissed within the last 3 days, or already running
// standalone), and exposes the handlers the install UI wires to.
export default function usePwaInstall(triggerToast) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installPromptCompleted, setInstallPromptCompleted] = useState(() => {
    if (isRunningStandalone()) return true;
    if (localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true') return true;

    const lastDismissed = localStorage.getItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED);
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    if (lastDismissed && parseInt(lastDismissed, 10) > threeDaysAgo) {
      return true;
    }
    return false;
  });

  // Track the native PWA install prompt trigger and appinstalled event.
  // triggerToast is a stable useCallback, so this still only mounts once.
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      setInstallPromptCompleted(true);
      triggerToast('PWA INSTALLED SUCCESSFULLY');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [triggerToast]);

  // InstallPromptModal's primary action — forwards to the native prompt when
  // the browser captured one, otherwise points at the browser's own menu.
  const installFromPrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      triggerToast(`INSTALLATION: ${outcome.toUpperCase()}`);
      if (outcome === 'accepted') {
        localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      }
      setDeferredPrompt(null);
    } else {
      triggerToast('INSTALLING SYSTEM... CHECK BROWSER BAR/MENU');
    }

    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, getDismissTimestamp());
    setInstallPromptCompleted(true);
  };

  // InstallPromptModal's dismiss action — the reminder returns in 3 days.
  const dismissPrompt = () => {
    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, getDismissTimestamp());
    setInstallPromptCompleted(true);
    triggerToast('INSTALL LATER (REMINDER IN 3 DAYS)');
  };

  // Navbar's Install App button — re-opens the in-app prompt on demand.
  const reopenPrompt = () => {
    setInstallPromptCompleted(false);
    triggerToast('INSTALLER RETRIEVED');
  };

  // Reset flow: drop the dismissal, but re-check standalone mode and the
  // installed flag rather than clearing them — a user who resets while
  // already having installed the PWA shouldn't be shown "INSTALL AS APP"
  // again.
  const resetInstallPrompt = () => {
    localStorage.removeItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED);
    setInstallPromptCompleted(
      isRunningStandalone() || localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true'
    );
  };

  return {
    installPromptCompleted,
    installFromPrompt,
    dismissPrompt,
    reopenPrompt,
    resetInstallPrompt,
    showInstallBtn: !isRunningStandalone(),
  };
}
