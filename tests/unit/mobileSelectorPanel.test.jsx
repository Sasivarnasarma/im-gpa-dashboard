import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileSelectorPanel from '../../src/components/MobileSelectorPanel';

// The navbar's profile button is icon-only at this width.
const setup = (props = {}) => {
  const onProfileClick = vi.fn();
  render(
    <MobileSelectorPanel
      pathway="it"
      setPathway={() => {}}
      specialization="undecided"
      setSpecialization={() => {}}
      profileName="Amara"
      onProfileClick={onProfileClick}
      triggerToast={() => {}}
      {...props}
    />
  );
  return { onProfileClick };
};

describe('MobileSelectorPanel — profile row', () => {
  it('names the profile whose grades are on screen', () => {
    setup();
    expect(screen.getByText('Amara')).toBeInTheDocument();
  });

  it('opens the profile menu when the name is tapped', async () => {
    const { onProfileClick } = setup();
    await userEvent.click(screen.getByText('Amara'));

    expect(onProfileClick).toHaveBeenCalledTimes(1);
  });

  it('falls back to a label rather than an empty row before a profile exists', () => {
    setup({ profileName: undefined });
    expect(screen.getByText('PROFILE')).toBeInTheDocument();
  });

  it('still renders the degree selector alongside it', () => {
    setup();
    expect(screen.getByLabelText(/Select Degree Programme/i)).toHaveValue('it');
  });
});
