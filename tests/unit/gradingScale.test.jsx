import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GradingScale from '../../src/components/GradingScale';
import { GRADING_SCALE } from '../../src/data/constants';

describe('GradingScale Component', () => {
  it('renders all 12 university grade tiers', () => {
    render(<GradingScale />);

    expect(
      screen.getByRole('heading', { name: /University of Kelaniya Grading Scale/i })
    ).toBeInTheDocument();

    // Verify all 12 grades are listed in data and rendered
    expect(GRADING_SCALE).toHaveLength(12);

    for (const item of GRADING_SCALE) {
      expect(screen.getByText(item.grade)).toBeInTheDocument();
      expect(screen.getByText(item.marks)).toBeInTheDocument();
    }
  });

  it('contains expected GPV mappings matching university guidelines', () => {
    const ap = GRADING_SCALE.find((g) => g.grade === 'A+');
    const a = GRADING_SCALE.find((g) => g.grade === 'A');
    const am = GRADING_SCALE.find((g) => g.grade === 'A-');
    const c = GRADING_SCALE.find((g) => g.grade === 'C');
    const e = GRADING_SCALE.find((g) => g.grade === 'E');

    expect(ap?.gpv).toBe('4.0');
    expect(a?.gpv).toBe('4.0');
    expect(am?.gpv).toBe('3.7');
    expect(c?.gpv).toBe('2.0');
    expect(e?.gpv).toBe('0.0');
  });
});
