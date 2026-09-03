import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';
import { STORAGE_KEYS } from '../../src/data/constants';

// Mock AnalyticsChart since jsdom lacks ResizeObserver layout measurement
vi.mock('../../src/components/AnalyticsChart', () => ({
  default: () => <div data-testid="analytics-chart-stub" />,
}));

// Validates end-to-end integration between App state and TargetPlanner.
// Skips onboarding overlays via localStorage to focus on initial dashboard rendering.
function skipOnboarding({ pathway = 'it' } = {}) {
  localStorage.setItem(STORAGE_KEYS.SECURITY_ACCEPTED, 'true');
  localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, Date.now().toString());
  localStorage.setItem(STORAGE_KEYS.PATHWAY, pathway);
}

describe('App — Target GPA Planner wiring', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('never shows the onboarding overlays once security, install, and pathway are already set', async () => {
    skipOnboarding();
    render(<App />);

    expect(screen.queryByText(/DATA STORAGE POLICY/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/INSTALL AS APP/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SELECT DEGREE PROGRAMME/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/TARGET GPA PLANNER/i)).toBeInTheDocument();
  });

  it('renders a real required-average figure on first load, not a permanent "impossible"', async () => {
    // Ensures fresh dashboard load computes and renders required average properly.
    skipOnboarding();
    render(<App />);

    await screen.findByText(/TARGET GPA PLANNER/i);
    expect(screen.queryByText(/IMPOSSIBLE/i)).not.toBeInTheDocument();
    expect(screen.getByText(/UNGRADED CREDITS/i)).toBeInTheDocument();
    // Fresh curriculum starts with ungraded credits
    expect(screen.getByText(/^\d+ Credits$/)).toBeInTheDocument();
  });

  it('shows "achieved" once every GPA-eligible credit is graded above the goal', async () => {
    // Grade all active modules to verify 0.00 required average state
    skipOnboarding({ pathway: 'undecided' });
    const { modules } = await import('../../src/data/modules');
    const year1GpaModules = modules.filter((m) => m.y === 1 && !m.nonGpa);
    const grades = Object.fromEntries(year1GpaModules.map((m) => [m.code, 'A+']));
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));

    render(<App />);

    expect(await screen.findByText(/ACHIEVED \(0\.00 REQ\.\)/i)).toBeInTheDocument();
  });
});
