import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DegreeAudit from '../../src/components/DegreeAudit';
import TargetPlanner from '../../src/components/TargetPlanner';
import ScrollTopButton from '../../src/components/ScrollTopButton';
import SystemCreatorModal from '../../src/components/SystemCreatorModal';
import { assessClasses, assessEligibility } from '../../src/lib/degreeAudit';
import { computeGpaStats, getActiveModules } from '../../src/lib/gpaEngine';
import { modules, gradeMap } from '../../src/data/modules';

const active = getActiveModules(modules, 'it', 'undecided');
const auditFor = (grades) => {
  const stats = computeGpaStats(active, grades, gradeMap);
  return {
    eligibility: assessEligibility(active, grades, gradeMap, stats.cgpa),
    classes: assessClasses(active, grades, gradeMap, stats.cgpa),
  };
};

describe('DegreeAudit', () => {
  it('stays collapsed until asked, showing only the headline', () => {
    const { eligibility, classes } = auditFor({});
    render(<DegreeAudit eligibility={eligibility} classes={classes} />);

    expect(screen.getByRole('button', { name: /degree audit/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText(/eligibility for the degree/i)).not.toBeInTheDocument();
  });

  it('lists the eligibility criteria once expanded', async () => {
    const { eligibility, classes } = auditFor({});
    render(<DegreeAudit eligibility={eligibility} classes={classes} />);
    await userEvent.click(screen.getByRole('button', { name: /degree audit/i }));

    expect(screen.getByText(/eligibility for the degree/i)).toBeInTheDocument();
    expect(screen.getByText(/honours classification/i)).toBeInTheDocument();
    expect(screen.getByText(/not tracked/i)).toBeInTheDocument();
  });

  it('collapses again on a second press', async () => {
    const { eligibility, classes } = auditFor({});
    render(<DegreeAudit eligibility={eligibility} classes={classes} />);
    const toggle = screen.getByRole('button', { name: /degree audit/i });

    await userEvent.click(toggle);
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('counts unmet criteria in the header when something has failed', async () => {
    const failing = Object.fromEntries(active.filter((m) => !m.nonGpa).map((m) => [m.code, 'E']));
    const { eligibility, classes } = auditFor(failing);
    render(<DegreeAudit eligibility={eligibility} classes={classes} />);

    expect(screen.getByText(/unmet/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /degree audit/i }));
    expect(screen.getByText(/no honours class remains reachable/i)).toBeInTheDocument();
  });

  it('names the courses blocking a class it has ruled out', async () => {
    const gpaModules = active.filter((m) => !m.nonGpa && m.cr > 0);
    const grades = Object.fromEntries(gpaModules.map((m) => [m.code, 'A+']));
    grades[gpaModules[0].code] = 'D';

    const { eligibility, classes } = auditFor(grades);
    render(<DegreeAudit eligibility={eligibility} classes={classes} />);
    await userEvent.click(screen.getByRole('button', { name: /degree audit/i }));

    expect(screen.getByText(/ruled out/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(gpaModules[0].code))).toBeInTheDocument();
  });
});

describe('TargetPlanner', () => {
  const setup = () =>
    render(
      <TargetPlanner
        totalGpaCredits={30}
        totalWeightedPoints={90}
        ungradedGpaCredits={60}
        curriculumTotalGpaCredits={90}
      />
    );

  it('starts at the First Class goal', () => {
    setup();
    expect(screen.getByRole('spinbutton')).toHaveValue(3.7);
  });

  it('recomputes the required average when the goal changes', async () => {
    setup();
    const goal = screen.getByRole('spinbutton');

    await userEvent.clear(goal);
    await userEvent.type(goal, '2.00');

    expect(goal).toHaveValue(2);
    expect(screen.getByText(/ungraded credits/i)).toBeInTheDocument();
  });

  it('says so when a goal is out of reach', async () => {
    setup();
    const goal = screen.getByRole('spinbutton');

    await userEvent.clear(goal);
    await userEvent.type(goal, '4.00');

    expect(screen.getByText(/impossible/i)).toBeInTheDocument();
  });
});

describe('ScrollTopButton', () => {
  it('stays hidden until the page has scrolled', () => {
    render(<ScrollTopButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('appears once past the threshold and scrolls back up', async () => {
    render(<ScrollTopButton />);

    Object.defineProperty(window, 'scrollY', { value: 900, writable: true });
    Object.defineProperty(document.body, 'scrollHeight', { value: 3000, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    const button = await screen.findByRole('button');
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;
    await userEvent.click(button);

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });
});

describe('SystemCreatorModal', () => {
  it('credits the author and closes on request', async () => {
    const onClose = vi.fn();
    render(<SystemCreatorModal isOpen onClose={onClose} />);

    expect(screen.getByText(/system creator/i)).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('ignores a click inside the panel, so only the backdrop dismisses it', async () => {
    const onClose = vi.fn();
    render(<SystemCreatorModal isOpen onClose={onClose} />);
    await userEvent.click(screen.getByText(/system creator/i));

    expect(onClose).not.toHaveBeenCalled();
  });
});
