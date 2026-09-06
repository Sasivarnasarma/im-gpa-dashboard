import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SemesterRail from '../../src/components/SemesterRail';
import { computeSemesterStats, getActiveModules } from '../../src/lib/gpaEngine';
import { modules, gradeMap } from '../../src/data/modules';

const active = getActiveModules(modules, 'it', 'undecided');

describe('SemesterRail', () => {
  it('shows each offered semester with its own GPA', () => {
    const y1s1 = active.filter((m) => m.y === 1 && m.s === 1 && !m.nonGpa && m.cr > 0);
    const grades = Object.fromEntries(y1s1.map((m) => [m.code, 'A']));
    const semesters = computeSemesterStats(active, grades, gradeMap);

    render(<SemesterRail semesters={semesters} onJump={() => {}} />);
    const rail = screen.getByRole('navigation', { name: /semesters/i });

    expect(within(rail).getByText('Y1S1')).toBeInTheDocument();
    expect(within(rail).getByText('4.00')).toBeInTheDocument();
  });

  it('keeps a tile for semesters with no curriculum yet, pointing at the degree step', () => {
    const semesters = computeSemesterStats(
      getActiveModules(modules, 'undecided', 'undecided'),
      {},
      gradeMap
    );
    render(<SemesterRail semesters={semesters} onJump={() => {}} />);

    expect(screen.getByText('Y3S1')).toBeInTheDocument();
    expect(screen.getAllByText(/select degree/i).length).toBeGreaterThan(0);
  });

  it('still lets a locked tile jump, so the selection is one tap away', async () => {
    const onJump = vi.fn();
    const semesters = computeSemesterStats(
      getActiveModules(modules, 'undecided', 'undecided'),
      {},
      gradeMap
    );
    render(<SemesterRail semesters={semesters} onJump={onJump} />);
    await userEvent.click(screen.getByText('Y2S1').closest('button'));

    expect(onJump).toHaveBeenCalledWith(2, 1);
  });

  it('counts graded against compulsory, with the full module count in brackets', () => {
    const y1s1 = active.filter((m) => m.y === 1 && m.s === 1);
    const graded = y1s1.filter((m) => !m.optional).slice(0, 2);
    const grades = Object.fromEntries(graded.map((m) => [m.code, 'B']));
    const semesters = computeSemesterStats(active, grades, gradeMap);
    const sem = semesters.find((s) => s.label === 'Y1S1');

    render(<SemesterRail semesters={semesters} onJump={() => {}} />);
    const tile = screen.getByText('Y1S1').closest('button');

    expect(sem.gradedCount).toBe(2);
    expect(within(tile).getByText('2')).toBeInTheDocument();
    expect(tile).toHaveTextContent(
      sem.compulsoryCount === sem.moduleCount
        ? `2 / ${sem.compulsoryCount}`
        : `2 / ${sem.compulsoryCount} (${sem.moduleCount})`
    );
  });

  it('drops the bracket when every module in the semester is compulsory', () => {
    // The total adds nothing once it equals the target, and the year header
    // already omits it in that case.
    const semesters = computeSemesterStats(active, {}, gradeMap);
    render(<SemesterRail semesters={semesters} onJump={() => {}} />);

    semesters
      .filter((sem) => sem.offered && sem.compulsoryCount === sem.moduleCount)
      .forEach((sem) => {
        const tile = screen.getByText(sem.label).closest('button');
        expect(tile).not.toHaveTextContent(`(${sem.moduleCount})`);
      });
  });

  it('jumps to the semester it names', async () => {
    const onJump = vi.fn();
    render(<SemesterRail semesters={computeSemesterStats(active, {}, gradeMap)} onJump={onJump} />);
    await userEvent.click(screen.getByText('Y1S2').closest('button'));

    expect(onJump).toHaveBeenCalledWith(1, 2);
  });
});
