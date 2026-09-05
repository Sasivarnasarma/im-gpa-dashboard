import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetModal from '../../src/components/ResetModal';
import SecurityModal from '../../src/components/SecurityModal';

// One closable dialog and one mandatory one.
describe('modal dialogs — semantics and keyboard behaviour', () => {
  it('announces itself as a dialog named by its own heading', () => {
    render(<ResetModal isOpen onClose={() => {}} onConfirm={() => {}} />);
    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName(/CONFIRM DATABASE RESET/i);
  });

  it('moves focus into the dialog when it opens', async () => {
    render(<ResetModal isOpen onClose={() => {}} onConfirm={() => {}} />);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toContainElement(document.activeElement);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(<ResetModal isOpen onClose={onClose} onConfirm={() => {}} />);
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('holds Tab inside the dialog instead of letting it reach the page behind', async () => {
    render(
      <>
        <button type="button">behind the modal</button>
        <ResetModal isOpen onClose={() => {}} onConfirm={() => {}} />
      </>
    );
    const dialog = screen.getByRole('dialog');

    // Cycle past the last control; focus must wrap, not escape.
    for (let i = 0; i < 6; i += 1) {
      await userEvent.tab();
      expect(dialog).toContainElement(document.activeElement);
    }
    expect(screen.getByText('behind the modal')).not.toHaveFocus();
  });

  it('refuses to close a step that has no way out', async () => {
    // The storage policy passes no onClose, so Escape must do nothing.
    render(<SecurityModal isOpen onAccept={() => {}} />);
    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('returns focus to whatever opened it', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            open
          </button>
          <ResetModal isOpen={open} onClose={() => setOpen(false)} onConfirm={() => {}} />
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByText('open');

    await userEvent.click(opener);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');

    expect(opener).toHaveFocus();
  });
});
