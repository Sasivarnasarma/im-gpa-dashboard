import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Heart } from 'lucide-react';

import TargetPlanner from './components/TargetPlanner';
import Navbar from './components/Navbar';
import MobileSelectorPanel from './components/MobileSelectorPanel';
import YearSection from './components/YearSection';
import ExecutiveSummary from './components/ExecutiveSummary';
import ScrollTopButton from './components/ScrollTopButton';
import DegreeAudit from './components/DegreeAudit';
import GradingScale from './components/GradingScale';
import ProfileMenu from './components/ProfileMenu';
// Eagerly loaded to prevent flash during onboarding
import SecurityModal from './components/SecurityModal';
import WelcomeModal from './components/WelcomeModal';
import InstallPromptModal from './components/InstallPromptModal';
import ProfileNameModal from './components/ProfileNameModal';

// Lazily loaded components for smaller initial bundle
const AnalyticsChart = lazy(() => import('./components/AnalyticsChart'));
const ResetModal = lazy(() => import('./components/ResetModal'));
const SystemCreatorModal = lazy(() => import('./components/SystemCreatorModal'));

import useOnboarding from './hooks/useOnboarding';
import usePwaInstall from './hooks/usePwaInstall';
import useGpaComputation from './hooks/useGpaComputation';
import useProfiles from './hooks/useProfiles';

import { tagPathway, trackEvent } from './lib/insights';

export default function App() {
  const [toast, setToast] = useState(null);
  const triggerToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  const profiles = useProfiles(triggerToast);
  const pwa = usePwaInstall(triggerToast);
  const onboarding = useOnboarding({
    triggerToast,
    installPromptCompleted: pwa.installPromptCompleted,
    activeProfile: profiles.activeProfile,
    needsProfile: profiles.needsProfile,
    updateActive: profiles.updateActive,
  });

  const grades = profiles.activeProfile?.grades ?? {};

  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Lock body scroll when overlays are active
  useEffect(() => {
    if (
      onboarding.isOnboardingActive ||
      showResetModal ||
      showDeveloperModal ||
      profiles.menuOpen ||
      addingProfile
    ) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [
    onboarding.isOnboardingActive,
    showResetModal,
    showDeveloperModal,
    profiles.menuOpen,
    addingProfile,
  ]);

  // Sync academic pathway tags with Clarity session analytics
  useEffect(() => {
    if (onboarding.pathway) {
      tagPathway(onboarding.pathway, onboarding.specialization);
    }
  }, [onboarding.pathway, onboarding.specialization]);

  // Respects user motion preference for programmatic scrolling
  const scrollBehavior = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  const scrollToExecutiveSummary = () => {
    const el = document.getElementById('executive-summary');
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: scrollBehavior() });
    }
  };

  const handleGradeChange = (code, val) => {
    const updated = { ...grades };
    if (val === '') {
      delete updated[code];
    } else {
      updated[code] = val;
    }
    profiles.updateActive({ grades: updated });
    triggerToast(`UPDATED: ${code}`);
    trackEvent('grade_updated');
  };

  const handleNameSubmit = (name) => {
    profiles.addProfile(name);
    setAddingProfile(false);
    triggerToast(`PROFILE: ${name.toUpperCase()} CREATED`);
    trackEvent('profile_created');
  };

  const handleSwitchProfile = (id) => {
    const next = profiles.profiles.find((p) => p.id === id);
    profiles.switchProfile(id);
    if (next) triggerToast(`PROFILE: ${next.name.toUpperCase()}`);
    trackEvent('profile_switched');
  };

  const handleRenameProfile = (id, name) => {
    profiles.renameProfile(id, name);
    triggerToast(`PROFILE RENAMED: ${name.toUpperCase()}`);
    trackEvent('profile_renamed');
  };

  const handleDeleteProfile = (id) => {
    const gone = profiles.profiles.find((p) => p.id === id);
    const wasLast = profiles.profiles.length === 1;
    profiles.removeProfile(id);
    if (wasLast) profiles.closeMenu();
    if (gone) triggerToast(`PROFILE DELETED: ${gone.name.toUpperCase()}`);
    trackEvent('profile_deleted');
  };

  const handleClearAll = () => {
    profiles.resetAll();
    profiles.closeMenu();
    onboarding.resetOnboarding();
    pwa.resetInstallPrompt();
    triggerToast('ALL PROFILES DELETED');
    trackEvent('database_reset');
  };

  const { currentPathway, stats, trendData, years, eligibility, classes, awardTier } =
    useGpaComputation(grades, onboarding.pathway, onboarding.specialization);

  return (
    <div className="min-h-screen bg-canvas text-body-text selection:bg-m-blue-light selection:text-white">
      {/* Navigation */}
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
        onProfileClick={profiles.openMenu}
        profileName={profiles.activeProfile?.name}
        triggerToast={triggerToast}
        showInstallBtn={pwa.showInstallBtn}
        onInstallClick={pwa.reopenPrompt}
        onCgpaClick={scrollToExecutiveSummary}
      />

      <div className="pt-24" />

      {/* Main Content Layout */}
      <main className="max-w-360 mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
        {/* Mobile Pathway Selector */}
        <MobileSelectorPanel
          pathway={onboarding.pathway}
          setPathway={onboarding.setPathway}
          specialization={onboarding.specialization}
          setSpecialization={onboarding.setSpecialization}
          profileName={profiles.activeProfile?.name}
          onProfileClick={profiles.openMenu}
          triggerToast={triggerToast}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Analytics & Planning Sidebar */}
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
              awardTier={awardTier}
            />

            {/* Degree Audit */}
            <DegreeAudit eligibility={eligibility} classes={classes} />

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

          {/* Curriculum Years */}
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

        {/* University Grading Scale Reference */}
        <div className="mt-12">
          <GradingScale />
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

      {/* Live region: the animated toast below is aria-hidden */}
      <div role="status" aria-live="polite" className="sr-only">
        {toast}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            aria-hidden="true"
            className="fixed bottom-20 right-6 border border-hairline bg-surface-card p-4 shadow-2xl z-120 font-mono text-[10px] flex items-center gap-3 select-none"
          >
            <div className="h-3 w-3 rounded-full bg-m-red shrink-0" />
            <span className="text-white uppercase tracking-wider font-bold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll To Top */}
      <ScrollTopButton />

      {/* Modals & Overlays */}
      <Suspense fallback={null}>
        <ResetModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          onConfirm={() => {
            handleClearAll();
            setShowResetModal(false);
          }}
        />

        <SystemCreatorModal
          isOpen={showDeveloperModal}
          onClose={() => setShowDeveloperModal(false)}
        />
      </Suspense>

      <SecurityModal isOpen={onboarding.showSecurityModal} onAccept={onboarding.acceptSecurity} />

      {/* Profile switcher and name prompt */}
      <ProfileMenu
        isOpen={profiles.menuOpen}
        onClose={profiles.closeMenu}
        profiles={profiles.profiles}
        activeId={profiles.activeId}
        onSwitch={handleSwitchProfile}
        onAdd={() => {
          profiles.closeMenu();
          setAddingProfile(true);
        }}
        onRename={handleRenameProfile}
        onDelete={handleDeleteProfile}
        onResetAll={() => setShowResetModal(true)}
      />

      <ProfileNameModal
        isOpen={onboarding.showNameModal || addingProfile}
        onSubmit={handleNameSubmit}
        onCancel={addingProfile ? () => setAddingProfile(false) : undefined}
      />

      <InstallPromptModal
        isOpen={onboarding.showInstallPrompt}
        onInstall={pwa.installFromPrompt}
        onDismiss={pwa.dismissPrompt}
      />

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
