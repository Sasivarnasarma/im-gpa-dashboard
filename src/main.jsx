import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { MotionConfig } from 'framer-motion';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Register caching Service Worker for offline PWA capabilities
registerSW({ immediate: true });

// Surface curriculum data problems the moment they're introduced while
// editing modules.js, rather than waiting for a test run. Dev-only — the
// import.meta.env.DEV guard lets this whole block tree-shake out of the
// production bundle.
if (import.meta.env.DEV) {
  const [{ validateModules }, { modules, gradeMap }] = await Promise.all([
    import('./lib/validateModules.js'),
    import('./data/modules.js'),
  ]);
  const problems = validateModules(modules, gradeMap);
  if (problems.length > 0) {
    console.error(
      `[curriculum] ${problems.length} problem(s) in data/modules.js:\n` +
        problems.map((p) => `  • ${p}`).join('\n')
    );
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Framer Motion animates in JS, so the prefers-reduced-motion block in
        index.css cannot reach it. reducedMotion="user" makes every motion
        component in the tree honor the OS setting instead. */}
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MotionConfig>
  </StrictMode>
);
