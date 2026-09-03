import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Heart } from 'lucide-react';

// Core Components
import TargetPlanner from './components/TargetPlanner';

// Newly Extracted Components
import Navbar from './components/Navbar';
import MobileSelectorPanel from './components/MobileSelectorPanel';
import YearSection from './components/YearSection';
import ExecutiveSummary from './components/ExecutiveSummary';
import ScrollTopButton from './components/ScrollTopButton';
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

// Extracted state machines: localStorage persistence, the onboarding
// sequence, the PWA install flow, and the GPA computation pipeline.
import useLocalStorage from './hooks/useLocalStorage';
import useOnboarding from './hooks/useOnboarding';
import usePwaInstall from './hooks/usePwaInstall';
import useGpaComputation from './hooks/useGpaComputation';

import { STORAGE_KEYS } from './data/constants';

export default function App() {
  // Toast — the global feedback channel the extracted hooks report through.
  // Stable identity so the hooks can list it as an effect dependency without
  // re-subscribing on every render.
  const [toast, setToast] = useState(null);
  const triggerToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  const [grades, setGrades] = useLocalStorage(STORAGE_KEYS.GRADES, {
    read: (raw) => (raw ? JSON.parse(raw) : {}),
    write: JSON.stringify,
    fallback: {},
  });

  // App as pure orchestrator: the extracted state machines are consumed as
  // objects (onboarding.*, pwa.*, stats.*) so every prop names where its
  // value comes from.
  const pwa = usePwaInstall(triggerToast);
  const onboarding = useOnboarding(triggerToast, pwa.installPromptCompleted);

  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  // Handle toast timers
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Disable body scrolling when any overlay/onboarding modal is active
  useEffect(() => {
    if (onboarding.isOnboardingActive || showResetModal || showDeveloperModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [onboarding.isOnboardingActive, showResetModal, showDeveloperModal]);

  // Programmatic scrolling ignores the CSS scroll-behavior override, so the
  // reduced-motion preference has to be consulted here directly.
  const scrollBehavior = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  const scrollToExecutiveSummary = () => {
    const el = document.getElementById('executive-summary');
    if (el) {
      const yOffset = -80; // height of sticky navbar + offset space
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: scrollBehavior() });
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
    onboarding.resetOnboarding();
    pwa.resetInstallPrompt();
    triggerToast('DATABASE FULLY RESET');
  };

  const { currentPathway, stats, trendData, years } = useGpaComputation(
    grades,
    onboarding.pathway,
    onboarding.specialization
  );

  return (
    <div className="min-h-screen bg-canvas text-body-text selection:bg-m-blue-light selection:text-white">
      {/* Top Navigation */}
      <Navbar
        cgpa={stats.cgpa}
        hasGradedCredits={stats.totalGpaCredits > 0}
        pathway={onboarding.pathway}
        setPathway={onboarding.setPathway}
        specialization={onboarding.specialization}
        setSpecialization={onboarding.setSpecialization}
        gradedModulesCount={stats.gradedModulesCount}
        activeCompulsoryCount={stats.activeCompulsoryCount}
        totalModulesCount={stats.totalModulesCount}
        gradedCredits={stats.gradedCredits}
        activeCompulsoryCredits={stats.activeCompulsoryCredits}
        totalCreditsCount={stats.totalCreditsCount}
        onResetClick={() => setShowResetModal(true)}
        triggerToast={triggerToast}
        showInstallBtn={pwa.showInstallBtn}
        onInstallClick={pwa.reopenPrompt}
        onCgpaClick={scrollToExecutiveSummary}
      />

      {/* Main Body Spacer */}
      <div className="pt-24" />

      {/* Content Layout */}
      <main className="max-w-360 mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
        {/* Mobile Selector Panel */}
        <MobileSelectorPanel
          pathway={onboarding.pathway}
          setPathway={onboarding.setPathway}
          specialization={onboarding.specialization}
          setSpecialization={onboarding.setSpecialization}
          triggerToast={triggerToast}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Metrics & Analytics */}
          <div className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-24">
            {/* Executive Summary */}
            <ExecutiveSummary
              cgpa={stats.cgpa}
              hasGradedCredits={stats.totalGpaCredits > 0}
              gradedModulesCount={stats.gradedModulesCount}
              activeCompulsoryCount={stats.activeCompulsoryCount}
              totalModulesCount={stats.totalModulesCount}
              gradedCredits={stats.gradedCredits}
              activeCompulsoryCredits={stats.activeCompulsoryCredits}
              totalCreditsCount={stats.totalCreditsCount}
              years={years.map((y) => ({
                label: `YEAR ${y.year}`,
                gpa: y.gpa,
                hasGrades: y.hasGrades,
              }))}
            />

            {/* Target GPA Planner */}
            <TargetPlanner
              totalGpaCredits={stats.totalGpaCredits}
              totalWeightedPoints={stats.totalWeightedPoints}
              ungradedGpaCredits={stats.ungradedGpaCredits}
              curriculumTotalGpaCredits={stats.totalCurriculumGpaCredits}
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
            {years.map((year) => (
              <YearSection
                key={year.year}
                year={year}
                grades={grades}
                onGradeChange={handleGradeChange}
                currentPathway={currentPathway}
                specialization={onboarding.specialization}
                onSelectPathway={onboarding.selectPathway}
                onSelectSpecialization={onboarding.selectSpecializationDirect}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-canvas mt-16 select-none">
        <div className="max-w-360 mx-auto px-4 py-10 flex items-center justify-center">
          <button
            onClick={() => setShowDeveloperModal(true)}
            className="group text-[10px] text-muted-text hover:text-white font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none bg-transparent p-0"
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
      <ScrollTopButton />

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
      <SecurityModal isOpen={onboarding.showSecurityModal} onAccept={onboarding.acceptSecurity} />

      {/* PWA Install Prompt Modal Overlay */}
      <InstallPromptModal
        isOpen={onboarding.showInstallPrompt}
        onInstall={pwa.installFromPrompt}
        onDismiss={pwa.dismissPrompt}
      />

      {/* Onboarding Welcome Modal Overlay */}
      <WelcomeModal
        isOpen={onboarding.showWelcomeModal}
        modalStep={onboarding.modalStep}
        setModalStep={onboarding.setModalStep}
        onSelectPathway={onboarding.selectPathway}
        onSelectSpecialization={onboarding.selectSpecialization}
      />
    </div>
  );
}
