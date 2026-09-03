import ReactGA from 'react-ga4';
import Clarity from '@microsoft/clarity';

let isGaInitialized = false;
let isClarityInitialized = false;

// Initializes GA4 and Microsoft Clarity in production when respective IDs are configured
export function initAnalytics(options = {}) {
  if (typeof window === 'undefined') return { ga: false, clarity: false };

  const isProd = options.force || import.meta.env.PROD;
  const gaId = options.gaId ?? import.meta.env.VITE_GA_MEASUREMENT_ID;
  const clarityId =
    options.clarityId ?? options.projectId ?? import.meta.env.VITE_CLARITY_PROJECT_ID;

  if (isProd && gaId && (!isGaInitialized || options.force)) {
    try {
      ReactGA.initialize(gaId);
      ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
      isGaInitialized = true;
    } catch {
      // Fail silently without interrupting user experience
    }
  }

  if (isProd && clarityId && (!isClarityInitialized || options.force)) {
    try {
      Clarity.init(clarityId);
      isClarityInitialized = true;
    } catch {
      // Fail silently without interrupting user experience
    }
  }

  return { ga: isGaInitialized, clarity: isClarityInitialized };
}

// Resets state (used in test isolation)
export function _resetAnalyticsState() {
  isGaInitialized = false;
  isClarityInitialized = false;
}

// Sets custom dimensions and session tags across analytics providers
export function tagPathway(pathway, specialization) {
  if (typeof window === 'undefined') return;

  try {
    if (isClarityInitialized) {
      if (pathway) Clarity.setTag('pathway', pathway);
      if (specialization) Clarity.setTag('specialization', specialization);
    }

    if (isGaInitialized) {
      ReactGA.set({
        pathway: pathway || 'undecided',
        specialization: specialization || 'undecided',
      });
    }
  } catch {
    // Fail silently without interrupting user experience
  }
}

// Dispatches interaction events to both GA4 and Microsoft Clarity
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;

  try {
    if (isClarityInitialized) {
      Clarity.event(eventName);
    }

    if (isGaInitialized) {
      ReactGA.event(eventName, params);
    }
  } catch {
    // Fail silently without interrupting user experience
  }
}
