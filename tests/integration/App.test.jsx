import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/App';
import { STORAGE_KEYS } from '../../src/data/constants';

// recharts' ResponsiveContainer measures the container via ResizeObserver
// and polls for a nonzero size — jsdom never reports one, so it spins
// indefinitely instead of erroring. Stub the chart out; the trend line's own
// math is already covered by computeTrendData's unit tests.
vi.mock('../../src/components/AnalyticsChart', () => ({
  default: () => <div data-testid="analytics-chart-stub" />,
}));

// Unit tests on gpaEngine/targetPlan verify the math in isolation, but the
// original bug wasn't in the math — it was in App.jsx passing TargetPlanner
// props under names it never destructured. That kind of mismatch only shows
// up by actually rendering the two together, so this test does that: it
// skips past onboarding via localStorage (no modal clicking, which is where
// this suite would otherwise fight animation/lazy-load timing) and asserts
// on what a real student sees on first load, before entering a single grade.
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
    // This is the direct regression test for the original bug: with the
    // props mismatched, this exact screen — no grades entered yet, fresh
    // onboarding — showed "IMPOSSIBLE (> 4.00)" unconditionally.
    skipOnboarding();
    render(<App />);

    await screen.findByText(/TARGET GPA PLANNER/i);
    expect(screen.queryByText(/IMPOSSIBLE/i)).not.toBeInTheDocument();
    expect(screen.getByText(/UNGRADED CREDITS/i)).toBeInTheDocument();
    // Year 1 is always loaded regardless of pathway, and none of it is
    // graded yet, so there must be a nonzero ungraded-credit figure feeding
    // the planner.
    expect(screen.getByText(/^\d+ Credits$/)).toBeInTheDocument();
  });

  it('shows "achieved" once every GPA-eligible credit is graded above the goal', async () => {
    // Pathway 'undecided' keeps the active curriculum to Year 1 only (see
    // getActiveModules), so grading every Year 1 GPA-eligible module here
    // actually brings ungraded credits to zero — exercising TargetPlanner's
    // "no credits left" branch end-to-end, not just the pure function.
    skipOnboarding({ pathway: 'undecided' });
    const { modules } = await import('../../src/data/modules');
    const year1GpaModules = modules.filter((m) => m.y === 1 && !m.nonGpa);
    const grades = Object.fromEntries(year1GpaModules.map((m) => [m.code, 'A+']));
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));

    render(<App />);

    expect(await screen.findByText(/FAILED DEVIATION TEST/i)).toBeInTheDocument();
  });
});
