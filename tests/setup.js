import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia — App.jsx calls it unconditionally
// (isRunningStandalone) on every mount to detect installed-PWA mode.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  });
}

// jsdom doesn't implement ResizeObserver — recharts' ResponsiveContainer
// needs it whenever the Performance Trend chart mounts.
if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
