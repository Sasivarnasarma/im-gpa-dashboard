import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Deliberately separate from vite.config.js: the PWA plugin there does
// build-time asset generation that tests have no business triggering.
// Kept minimal — just enough to render JSX in jsdom.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{js,jsx}'],
    setupFiles: ['./tests/setup.js'],
    // Safety net: a real hang (e.g. a jsdom-incompatible component spinning
    // in a resize/animation loop) should fail fast, not burn minutes.
    testTimeout: 10000,
  },
});
