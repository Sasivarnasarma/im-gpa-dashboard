import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Shared with the CI summary script so the two cannot drift.
const thresholds = JSON.parse(readFileSync('./coverage-thresholds.json', 'utf8'));

// Separate from vite.config.js so the PWA plugin never runs in tests.
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
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './.vitest/coverage',
      // Only what ships: data tables are declarations, not logic.
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/data/**', 'src/**/*.d.ts'],
      thresholds,
    },
  },
});
