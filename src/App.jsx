import React, { Suspense, lazy, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Info, ArrowUp, Heart } from 'lucide-react';

// Core Components
import TargetPlanner from './components/TargetPlanner';

// Newly Extracted Components
import Navbar from './components/Navbar';
import MobileSelectorPanel from './components/MobileSelectorPanel';
import SemesterCard from './components/SemesterCard';
import ExecutiveSummary from './components/ExecutiveSummary';
// Kept eager: these gate the very first render (onboarding overlay), so
// lazy-loading them would flash the unprotected dashboard underneath while
// their chunk fetches. Both are tiny (a few KB) — not what made the bundle big.
import SecurityModal from './components/SecurityModal';
import WelcomeModal from './components/WelcomeModal';
import InstallPromptModal from './components/InstallPromptModal';

// Lazily loaded: only needed once grades exist or a modal is explicitly
// opened by the user, so they don't have to ship in the initial bundle.
// recharts (AnalyticsChart) alone was the bulk of the old 732 KB single chunk.
const AnalyticsChart = lazy(() => import('./components/AnalyticsChart'));
const ResetModal = lazy(() => import('./components/ResetModal'));
const SystemCreatorModal = lazy(() => import('./components/SystemCreatorModal'));

import { modules, gradeMap } from './data/modules';
import { STORAGE_KEYS } from './data/constants';
import {
  getActiveModules,
  computeGpaStats,
  computeTrendData,
  getGradeBorderClass,
} from './lib/gpaEngine';

const sortModules = (moduleList) => {
  return [...moduleList].sort((a, b) => {
    const getWeight = (m) => {
      if (m.optional) return 4;
      if (m.nonGpa) return 3;
      if (!m.pathway || m.pathway === 'both') return 1; // common
      return 2; // specific (it or mit)
    };
    return getWeight(a) - getWeight(b);
  });
};

const getDismissTimestamp = () => Date.now().toString();

const isRunningStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  window.matchMedia('(display-mode: minimal-ui)').matches ||
  window.navigator.standalone === true;

export default function App() {
  const [grades, setGrades] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GRADES);
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      // Corrupted or hand-edited storage value — fall back to a clean slate
      // instead of throwing during initial render and white-screening the app.
      return {};
    }
  });

  const [pathway, setPathway] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.PATHWAY) || null;
  });

  const [specialization, setSpecialization] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SPECIALIZATION) || 'undecided';
  });

  const [modalStep, setModalStep] = useState(1);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [securityAccepted, setSecurityAccepted] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.SECURITY_ACCEPTED) === 'true';
  });

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

  const [showResetModal, setShowResetModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [toast, setToast] = useState(null);

  const triggerToast = (msg) => {
    setToast(msg);
  };

  // Track the native PWA install prompt trigger and appinstalled event
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
  }, []);

  // Disable body scrolling when any overlay/onboarding modal is active
  useEffect(() => {
    const isAnyModalOpen =
      !securityAccepted ||
      (securityAccepted && !installPromptCompleted) ||
      (securityAccepted && installPromptCompleted && !pathway) ||
      showResetModal ||
      showDeveloperModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [securityAccepted, installPromptCompleted, pathway, showResetModal, showDeveloperModal]);

  const handleInstallClick = async () => {
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

  const handleDismissClick = () => {
    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, getDismissTimestamp());
    setInstallPromptCompleted(true);
    triggerToast('INSTALL LATER (REMINDER IN 3 DAYS)');
  };

  // Sync scroll listener for Circular progress arrow indicator
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Write grades to storage when updated
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  }, [grades]);

  // Handle toast timers
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToExecutiveSummary = () => {
    const el = document.getElementById('executive-summary');
    if (el) {
      const yOffset = -80; // height of sticky navbar + offset space
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleGradeChange = (code, val) => {
    setGrades((prev) => {
      const updated = { ...prev };
      if (val === '') {
        delete updated[code];
      } else {
        updated[code] = val;
      }
      return updated;
    });
    triggerToast(`UPDATED: ${code}`);
  };

  // Clear all grades handler (full factory reset)
  const handleClearAll = () => {
    setGrades({});
    localStorage.removeItem(STORAGE_KEYS.GRADES);
    localStorage.removeItem(STORAGE_KEYS.PATHWAY);
    localStorage.removeItem(STORAGE_KEYS.SPECIALIZATION);
    localStorage.removeItem(STORAGE_KEYS.SECURITY_ACCEPTED);
    localStorage.removeItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED);
    setPathway(null);
    setSpecialization('undecided');
    setModalStep(1);
    setSecurityAccepted(false);
    // Re-check standalone mode and installed flag rather than unconditionally clearing it — a
    // user who resets while already having installed the PWA shouldn't be
    // shown "INSTALL AS APP" again.
    setInstallPromptCompleted(
      isRunningStandalone() || localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true'
    );
    triggerToast('DATABASE FULLY RESET');
  };

  // Filter active modules by pathway selection and map MIT specialization options
  const currentPathway = pathway || 'undecided';
  const activeModules = getActiveModules(modules, pathway, specialization);

  const {
    totalWeightedPoints,
    totalGpaCredits,
    totalCurriculumGpaCredits,
    ungradedGpaCredits,
    totalModulesCount,
    gradedModulesCount,
    gradedCredits,
    totalCreditsCount,
    activeCompulsoryCount,
    activeCompulsoryCredits,
    yearStats,
    y1GPA,
    y2GPA,
    y3GPA,
    cgpa,
  } = computeGpaStats(activeModules, grades, gradeMap);

  const trendData = computeTrendData(activeModules, grades, gradeMap);

  return (
    <div className="min-h-screen bg-canvas text-body-text selection:bg-m-blue-light selection:text-white">
      {/* Top Navigation */}
      <Navbar
        cgpa={cgpa}
        pathway={pathway}
        setPathway={setPathway}
        specialization={specialization}
        setSpecialization={setSpecialization}
        gradedModulesCount={gradedModulesCount}
        activeCompulsoryCount={activeCompulsoryCount}
        totalModulesCount={totalModulesCount}
        gradedCredits={gradedCredits}
        activeCompulsoryCredits={activeCompulsoryCredits}
        totalCreditsCount={totalCreditsCount}
        onResetClick={() => setShowResetModal(true)}
        triggerToast={triggerToast}
        showInstallBtn={!isRunningStandalone()}
        onInstallClick={() => {
          setInstallPromptCompleted(false);
          triggerToast('INSTALLER RETRIEVED');
        }}
        onCgpaClick={scrollToExecutiveSummary}
      />

      {/* Main Body Spacer */}
      <div className="pt-24" />

      {/* Content Layout */}
      <main className="max-w-360 mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
        {/* Mobile Selector Panel */}
        <MobileSelectorPanel
          pathway={pathway}
          setPathway={setPathway}
          specialization={specialization}
          setSpecialization={setSpecialization}
          triggerToast={triggerToast}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Metrics & Analytics */}
          <div className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-24">
            {/* Executive Summary */}
            <ExecutiveSummary
              cgpa={cgpa}
              gradedModulesCount={gradedModulesCount}
              activeCompulsoryCount={activeCompulsoryCount}
              totalModulesCount={totalModulesCount}
              gradedCredits={gradedCredits}
              activeCompulsoryCredits={activeCompulsoryCredits}
              totalCreditsCount={totalCreditsCount}
              y1GPA={y1GPA}
              y2GPA={y2GPA}
              y3GPA={y3GPA}
            />

            {/* Target GPA Planner */}
            <TargetPlanner
              totalGpaCredits={totalGpaCredits}
              totalWeightedPoints={totalWeightedPoints}
              ungradedGpaCredits={ungradedGpaCredits}
              curriculumTotalGpaCredits={totalCurriculumGpaCredits}
            />

            {/* Performance Trend Chart */}
            {trendData.length > 0 && (
              <div className="border border-hairline bg-surface-soft p-5 rounded-none">
                <span className="font-bmw-display font-bold text-[11px] uppercase tracking-widest text-white border-b border-hairline pb-2.5 flex items-center justify-between mb-4">
                  PERFORMANCE TREND
                  <TrendingUp className="w-3.5 h-3.5 text-m-blue-light" />
                </span>
                <Suspense fallback={<div className="h-56" />}>
                  <AnalyticsChart data={trendData} />
                </Suspense>
              </div>
            )}
          </div>

          {/* Right Column: Year by Year Curriculums */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {[1, 2, 3].map((year) => {
              const yearModules = activeModules.filter((m) => m.y === year);
              const yearSem1 = sortModules(yearModules.filter((m) => m.s === 1));
              const yearSem2 = sortModules(yearModules.filter((m) => m.s === 2));

              const yearName =
                year === 1 ? 'First Year' : year === 2 ? 'Second Year' : 'Third Year';
              const yGpa = year === 1 ? y1GPA : year === 2 ? y2GPA : y3GPA;
              const yStats = yearStats[year];

              return (
                <div key={year} className="flex flex-col gap-4">
                  {/* Year Header with Stats Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-2 font-bmw-display select-none">
                    <h2 className="font-black text-lg text-white uppercase tracking-tight">
                      {yearName}
                    </h2>

                    {/* GPA & Credits badges */}
                    <div className="flex items-center gap-3 text-[10px] font-mono font-bold tracking-wider text-muted-text flex-nowrap">
                      <div className="px-2.5 py-1 bg-surface-soft border border-hairline uppercase flex items-center gap-1.5 shrink-0">
                        GPA:{' '}
                        <span
                          className={`font-black ${yGpa > 0 && yGpa < 2.0 ? 'text-m-red' : 'text-white'}`}
                        >
                          {yGpa > 0 ? yGpa.toFixed(2) : 'AWAITING'}
                        </span>
                      </div>
                      <div className="px-2.5 py-1 bg-surface-soft border border-hairline uppercase shrink-0">
                        COMPLETED:{' '}
                        <span className="text-white font-black">{yStats.gradedCredits}</span> /{' '}
                        {yStats.totalCredits} CREDITS
                      </div>
                    </div>
                  </div>

                  {/* Curriculums */}
                  {yearModules.length === 0 ? (
                    currentPathway === 'undecided' ? (
                      year === 2 ? (
                        <div className="border border-hairline bg-surface-soft p-8 text-center flex flex-col items-center gap-4 select-none">
                          <Info className="w-8 h-8 text-m-blue-light" />
                          <h3 className="font-bmw-display font-bold text-sm text-white uppercase tracking-wider">
                            DEGREE PROGRAMME NOT SELECTED
                          </h3>
                          <p className="text-[11px] text-muted-text max-w-md leading-relaxed">
                            Please select your B.Sc. (Hons) degree programme to load the
                            corresponding Year 2 and Year 3 course curricula.
                          </p>
                          <div className="flex gap-4 mt-2 justify-center font-mono">
                            <button
                              onClick={() => {
                                localStorage.setItem(STORAGE_KEYS.PATHWAY, 'it');
                                setPathway('it');
                                triggerToast('DEGREE: B.SC. HONS IN IT INITIALIZED');
                              }}
                              className="px-5 py-2.5 border border-hairline hover:border-m-red text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
                            >
                              B.Sc. (Hons) in IT
                            </button>
                            <button
                              onClick={() => {
                                localStorage.setItem(STORAGE_KEYS.PATHWAY, 'mit');
                                setPathway('mit');
                                triggerToast('DEGREE: B.SC. HONS IN MIT INITIALIZED');
                              }}
                              className="px-5 py-2.5 border border-hairline hover:border-m-red text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
                            >
                              B.Sc. (Hons) in MIT
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-hairline bg-surface-soft p-8 text-center flex flex-col items-center gap-3 select-none">
                          <Info className="w-8 h-8 text-m-blue-light" />
                          <h3 className="font-bmw-display font-bold text-sm text-white uppercase tracking-wider">
                            DEGREE PROGRAMME NOT SELECTED
                          </h3>
                          <p className="text-[11px] text-muted-text max-w-sm leading-relaxed">
                            Please select B.Sc. Hons in IT or MIT in the Second Year block to view
                            the Third Year course curriculum.
                          </p>
                        </div>
                      )
                    ) : year === 3 && currentPathway === 'mit' && specialization === 'undecided' ? (
                      <div className="border border-hairline bg-surface-soft p-8 text-center flex flex-col items-center gap-4 select-none">
                        <Info className="w-8 h-8 text-m-blue-light" />
                        <h3 className="font-bmw-display font-bold text-sm text-white uppercase tracking-wider">
                          YEAR 3 SPECIALIZATION NOT DECIDED
                        </h3>
                        <p className="text-[11px] text-muted-text max-w-md leading-relaxed">
                          Please select your B.Sc. (Hons) in MIT Year 3 specialization to load the
                          corresponding compulsory and optional courses.
                        </p>
                        <div className="flex gap-3 mt-2 flex-wrap justify-center font-mono">
                          <button
                            onClick={() => {
                              localStorage.setItem(STORAGE_KEYS.SPECIALIZATION, 'bsc');
                              setSpecialization('bsc');
                              triggerToast('SPECIALIZATION: BSC INITIALIZED');
                            }}
                            className="px-4 py-2 border border-hairline hover:border-m-blue-light text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
                          >
                            Business Systems Consulting (BSC)
                          </button>
                          <button
                            onClick={() => {
                              localStorage.setItem(STORAGE_KEYS.SPECIALIZATION, 'oscm');
                              setSpecialization('oscm');
                              triggerToast('SPECIALIZATION: OSCM INITIALIZED');
                            }}
                            className="px-4 py-2 border border-hairline hover:border-m-orange text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
                          >
                            Operations & Supply Chain (OSCM)
                          </button>
                          <button
                            onClick={() => {
                              localStorage.setItem(STORAGE_KEYS.SPECIALIZATION, 'is');
                              setSpecialization('is');
                              triggerToast('SPECIALIZATION: IS INITIALIZED');
                            }}
                            className="px-4 py-2 border border-hairline hover:border-m-blue-dark text-white text-[10px] font-bold uppercase transition-colors cursor-pointer bg-surface-card"
                          >
                            Information Systems (IS)
                          </button>
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <SemesterCard
                        semLabel="Semester 01"
                        modules={yearSem1}
                        grades={grades}
                        onGradeChange={handleGradeChange}
                        getGradeBorderClass={getGradeBorderClass}
                        bulletColor="bg-m-blue-light"
                      />
                      <SemesterCard
                        semLabel="Semester 02"
                        modules={yearSem2}
                        grades={grades}
                        onGradeChange={handleGradeChange}
                        getGradeBorderClass={getGradeBorderClass}
                        bulletColor="bg-m-red"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-canvas mt-16 select-none">
        <div className="max-w-360 mx-auto px-4 py-10 flex items-center justify-center">
          <button
            onClick={() => setShowDeveloperModal(true)}
            className="group text-[10px] text-muted-text hover:text-white font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none border-none bg-transparent p-0"
          >
            MADE WITH <Heart className="w-3 h-3 animate-heart-color-switch" /> BY{' '}
            <span className="underline font-bold text-white group-hover:font-black group-hover:scale-105 transition-all duration-300">
              SASIVARNASARMA
            </span>
          </button>
        </div>
      </footer>

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 border border-hairline bg-surface-card p-4 shadow-2xl z-120 font-mono text-[10px] flex items-center gap-3 select-none"
          >
            <div className="h-3 w-3 rounded-full bg-m-red shrink-0" />
            <span className="text-white uppercase tracking-wider font-bold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Trigger */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 h-10 w-10 bg-surface-soft rounded-full flex items-center justify-center cursor-pointer transition-transform shadow-2xl z-40 focus:outline-none hover:scale-110"
          >
            <svg className="w-10 h-10 transform -rotate-90 absolute">
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1.5"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke="#0066b1"
                strokeWidth="1.5"
                fill="transparent"
                strokeDasharray="113.1"
                strokeDashoffset={113.1 - (scrollProgress / 100) * 113.1}
              />
            </svg>
            <ArrowUp className="w-3.5 h-3.5 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        {/* Reset Confirmation Dialog */}
        <ResetModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={() => {
            handleClearAll();
            setShowResetModal(false);
          }}
        />

        {/* Developer Profile Modal */}
        <SystemCreatorModal
          isOpen={showDeveloperModal}
          onClose={() => setShowDeveloperModal(false)}
        />
      </Suspense>

      {/* Onboarding Security Modal Overlay */}
      <SecurityModal
        isOpen={!securityAccepted}
        onAccept={() => {
          localStorage.setItem(STORAGE_KEYS.SECURITY_ACCEPTED, 'true');
          setSecurityAccepted(true);
          triggerToast('LOCAL STORAGE PERMISSION ACCEPTED');
        }}
      />

      {/* PWA Install Prompt Modal Overlay */}
      <InstallPromptModal
        isOpen={securityAccepted && !installPromptCompleted}
        onInstall={handleInstallClick}
        onDismiss={handleDismissClick}
      />

      {/* Onboarding Welcome Modal Overlay */}
      <WelcomeModal
        isOpen={securityAccepted && installPromptCompleted && !pathway}
        modalStep={modalStep}
        setModalStep={setModalStep}
        onSelectPathway={(path) => {
          localStorage.setItem(STORAGE_KEYS.PATHWAY, path);
          setPathway(path);
          triggerToast(`DEGREE: B.SC. HONS IN ${path.toUpperCase()} INITIALIZED`);
        }}
        onSelectSpecialization={(spec) => {
          localStorage.setItem(STORAGE_KEYS.PATHWAY, 'mit');
          localStorage.setItem(STORAGE_KEYS.SPECIALIZATION, spec);
          setSpecialization(spec);
          setPathway('mit');
          triggerToast(`MIT DEGREE: ${spec.toUpperCase()} SPECIALIZATION INITIALIZED`);
        }}
      />
    </div>
  );
}
