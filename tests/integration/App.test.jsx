import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import { STORAGE_KEYS } from '../../src/data/constants';

// Mock AnalyticsChart since jsdom lacks ResizeObserver layout measurement
vi.mock('../../src/components/AnalyticsChart', () => ({
  default: () => <div data-testid="analytics-chart-stub" />,
}));

// Seeds a device past onboarding, so these tests start on the dashboard.
function skipOnboarding({ pathway = 'it', grades = {} } = {}) {
  localStorage.setItem(STORAGE_KEYS.SECURITY_ACCEPTED, 'true');
  localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, Date.now().toString());
  localStorage.setItem(
    STORAGE_KEYS.PROFILES,
    JSON.stringify({
      version: 1,
      activeId: 'p_test',
      profiles: [
        {
          id: 'p_test',
          name: 'Test Student',
          pathway,
          specialization: 'undecided',
          grades,
          targetGpa: '3.70',
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    })
  );
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
    const { modules } = await import('../../src/data/modules');
    const year1GpaModules = modules.filter((m) => m.y === 1 && !m.nonGpa);
    const grades = Object.fromEntries(year1GpaModules.map((m) => [m.code, 'A+']));
    skipOnboarding({ pathway: 'undecided', grades });

    render(<App />);

    expect(await screen.findByText(/ACHIEVED \(0\.00 REQ\.\)/i)).toBeInTheDocument();
  });
});

describe('App — profiles on the dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('names the profile whose grades are on screen', async () => {
    skipOnboarding();
    render(<App />);

    await screen.findByText(/TARGET GPA PLANNER/i);
    expect(screen.getAllByText('Test Student').length).toBeGreaterThan(0);
  });

  it('opens the profile menu from the navbar', async () => {
    skipOnboarding();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByTitle('Profiles'));

    expect(await screen.findByRole('dialog', { name: /profiles/i })).toBeInTheDocument();
  });

  it('adds a second profile and switches the dashboard to it', async () => {
    skipOnboarding({ grades: { 'INTE 11213': 'A+' } });
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByTitle('Profiles'));
    await userEvent.click(screen.getByRole('button', { name: /add profile/i }));
    await userEvent.type(await screen.findByLabelText(/profile name/i), 'Second{Enter}');

    const container = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES));
    expect(container.profiles).toHaveLength(2);
    expect(container.profiles.find((p) => p.id === container.activeId).name).toBe('Second');
    // The new profile starts clean — the first profile's grade must not follow it.
    expect(container.profiles.find((p) => p.id === container.activeId).grades).toEqual({});
  });

  it('records a grade against the profile in use', async () => {
    skipOnboarding();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    const select = screen.getByLabelText(/Grade for INTE 11213/i);
    await userEvent.selectOptions(select, 'A');

    const container = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES));
    expect(container.profiles[0].grades['INTE 11213']).toBe('A');
  });

  it('confirms before wiping the device, and wipes when confirmed', async () => {
    skipOnboarding();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByTitle('Profiles'));
    await userEvent.click(screen.getByRole('button', { name: /delete everything/i }));
    expect(await screen.findByText(/CONFIRM DATABASE RESET/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /proceed reset/i }));

    const container = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES));
    expect(container.profiles).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEYS.SECURITY_ACCEPTED)).toBeNull();
  });

  it('jumps to a semester from the rail', async () => {
    skipOnboarding();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    const rail = screen.getByRole('navigation', { name: /semesters/i });
    expect(within(rail).getByText('Y1S1')).toBeInTheDocument();

    // jsdom has no layout, so assert the anchor exists rather than the scroll.
    await userEvent.click(within(rail).getByText('Y1S2').closest('button'));
    expect(document.getElementById('sem-1-2')).toBeInTheDocument();
  });
});

describe('App — managing profiles from the menu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const seedTwo = () => {
    localStorage.setItem(STORAGE_KEYS.SECURITY_ACCEPTED, 'true');
    localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, Date.now().toString());
    localStorage.setItem(
      STORAGE_KEYS.PROFILES,
      JSON.stringify({
        version: 1,
        activeId: 'p_a',
        profiles: [
          {
            id: 'p_a',
            name: 'Amara',
            pathway: 'it',
            specialization: 'undecided',
            grades: { 'INTE 11213': 'A+' },
            targetGpa: '3.70',
            createdAt: 0,
            updatedAt: 0,
          },
          {
            id: 'p_b',
            name: 'Kasun',
            pathway: 'it',
            specialization: 'undecided',
            grades: { 'INTE 11213': 'C' },
            targetGpa: '3.70',
            createdAt: 0,
            updatedAt: 0,
          },
        ],
      })
    );
  };

  const container = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES));

  it('switches the dashboard to another profile', async () => {
    seedTwo();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByTitle('Profiles'));
    await userEvent.click(await screen.findByText('Kasun'));

    await waitFor(() => expect(container().activeId).toBe('p_b'));
    expect(screen.getByLabelText(/Grade for INTE 11213/i)).toHaveValue('C');
  });

  it('renames a profile without touching its grades', async () => {
    seedTwo();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByTitle('Profiles'));
    await userEvent.click(await screen.findByRole('button', { name: /rename amara/i }));
    const field = screen.getByRole('textbox', { name: /rename amara/i });
    await userEvent.clear(field);
    await userEvent.type(field, 'Amara P.{Enter}');

    await waitFor(() => {
      const amara = container().profiles.find((p) => p.id === 'p_a');
      expect(amara.name).toBe('Amara P.');
      expect(amara.grades).toEqual({ 'INTE 11213': 'A+' });
    });
  });

  it('deletes a profile and leaves the other intact', async () => {
    seedTwo();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByTitle('Profiles'));
    await userEvent.click(await screen.findByRole('button', { name: /delete kasun/i }));
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(container().profiles).toHaveLength(1));
    expect(container().profiles[0].name).toBe('Amara');
    expect(container().activeId).toBe('p_a');
  });

  it('announces what it did, for anyone not watching the screen', async () => {
    seedTwo();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByTitle('Profiles'));
    await userEvent.click(await screen.findByRole('button', { name: /delete kasun/i }));
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/PROFILE DELETED: KASUN/i);
  });
});

describe('App — the remaining dashboard controls', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears its own toast after a few seconds', async () => {
    // Real timers on purpose: faking them here leaves Framer Motion's frame
    // loop stalled, and every later exit animation in this file stops running.
    skipOnboarding();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.selectOptions(screen.getByLabelText(/Grade for INTE 11213/i), 'A');
    expect(await screen.findByRole('status')).toHaveTextContent(/UPDATED/i);

    await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement(), {
      timeout: 6000,
    });
  }, 15000);

  it('scrolls to the top from the CGPA box', async () => {
    skipOnboarding();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;
    await userEvent.click(screen.getByTitle(/scroll to top/i));

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });

  it('opens and closes the creator credits from the footer', async () => {
    skipOnboarding();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByRole('button', { name: /sasivarnasarma/i }));
    expect(await screen.findByText(/system creator/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /close profile/i }));
    await waitForElementToBeRemoved(() => screen.queryByText(/system creator/i), {
      timeout: 4000,
    });
  });

  it('backs out of the reset confirmation without wiping anything', async () => {
    skipOnboarding();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByTitle('Profiles'));
    await userEvent.click(screen.getByRole('button', { name: /delete everything/i }));
    await userEvent.click(await screen.findByRole('button', { name: /cancel/i }));

    await waitFor(
      () => expect(screen.queryByText(/CONFIRM DATABASE RESET/i)).not.toBeInTheDocument(),
      { timeout: 4000 }
    );
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES)).profiles).toHaveLength(1);
  });

  it('cancels adding a profile, leaving the one in use alone', async () => {
    skipOnboarding();
    render(<App />);
    await screen.findByText(/TARGET GPA PLANNER/i);

    await userEvent.click(screen.getByTitle('Profiles'));
    await userEvent.click(screen.getByRole('button', { name: /add profile/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^cancel$/i }));

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES)).profiles).toHaveLength(1)
    );
  });
});
