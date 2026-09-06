import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileNameModal from '../../src/components/ProfileNameModal';
import WelcomeModal from '../../src/components/WelcomeModal';

describe('ProfileNameModal', () => {
  it('refuses an empty name', async () => {
    const onSubmit = vi.fn();
    render(<ProfileNameModal isOpen onSubmit={onSubmit} />);

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/profile name/i), '   ');
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a trimmed name', async () => {
    const onSubmit = vi.fn();
    render(<ProfileNameModal isOpen onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/profile name/i), '  Amara  {Enter}');

    expect(onSubmit).toHaveBeenCalledWith('Amara');
  });

  it('offers no way out on first run', () => {
    render(<ProfileNameModal isOpen onSubmit={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('can be cancelled when a profile already exists', async () => {
    const onCancel = vi.fn();
    render(<ProfileNameModal isOpen onSubmit={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('starts empty each time it opens', async () => {
    const { rerender } = render(<ProfileNameModal isOpen onSubmit={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/profile name/i), 'Typed');

    rerender(<ProfileNameModal isOpen={false} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    // The field lives in a child that unmounts with the modal, so the reset
    // only happens once the close animation has finished.
    await waitForElementToBeRemoved(() => screen.queryByLabelText(/profile name/i));
    rerender(<ProfileNameModal isOpen onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/profile name/i)).toHaveValue('');
  });
});

describe('WelcomeModal', () => {
  const setup = (step = 1) => {
    const onSelectPathway = vi.fn();
    const onSelectSpecialization = vi.fn();
    const setModalStep = vi.fn();
    render(
      <WelcomeModal
        isOpen
        modalStep={step}
        setModalStep={setModalStep}
        onSelectPathway={onSelectPathway}
        onSelectSpecialization={onSelectSpecialization}
      />
    );
    return { onSelectPathway, onSelectSpecialization, setModalStep };
  };

  it('picks IT straight away, since IT has no specialization step', async () => {
    const { onSelectPathway } = setup();
    await userEvent.click(screen.getByText(/^IT DEGREE$/i).closest('button'));

    expect(onSelectPathway).toHaveBeenCalledWith('it');
  });

  it('sends MIT on to the specialization step instead of finishing', async () => {
    const { onSelectPathway, setModalStep } = setup();
    await userEvent.click(screen.getByText(/^MIT DEGREE$/i).closest('button'));

    expect(setModalStep).toHaveBeenCalledWith(2);
    expect(onSelectPathway).not.toHaveBeenCalled();
  });

  it('offers every MIT specialization on the second step', async () => {
    const { onSelectSpecialization } = setup(2);
    await userEvent.click(screen.getByText(/business systems engineering/i).closest('button'));

    expect(onSelectSpecialization).toHaveBeenCalledWith('bse');
  });
});
