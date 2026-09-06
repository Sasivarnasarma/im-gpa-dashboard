import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileMenu from '../../src/components/ProfileMenu';

const PROFILES = [
  { id: 'p_a', name: 'Amara', pathway: 'it', grades: { 'INTE 11213': 'A' } },
  { id: 'p_b', name: 'Kasun', pathway: 'mit', grades: {} },
];

const setup = (props = {}) => {
  const handlers = {
    onClose: vi.fn(),
    onSwitch: vi.fn(),
    onAdd: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onResetAll: vi.fn(),
  };
  render(<ProfileMenu isOpen profiles={PROFILES} activeId="p_a" {...handlers} {...props} />);
  return handlers;
};

const rowFor = (name) => screen.getByText(name).closest('li');

describe('ProfileMenu', () => {
  it('lists every profile with its degree and graded count', () => {
    setup();

    expect(screen.getByText('Amara')).toBeInTheDocument();
    expect(within(rowFor('Amara')).getByText(/1 graded/)).toBeInTheDocument();
    expect(within(rowFor('Kasun')).getByText(/0 graded/)).toBeInTheDocument();
  });

  it('marks which profile is in use', () => {
    setup();
    expect(within(rowFor('Amara')).getByText(/in use/i)).toBeInTheDocument();
    expect(within(rowFor('Kasun')).queryByText(/in use/i)).not.toBeInTheDocument();
  });

  it('switches to another profile and closes', async () => {
    const { onSwitch, onClose } = setup();
    await userEvent.click(screen.getByText('Kasun'));

    expect(onSwitch).toHaveBeenCalledWith('p_b');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes without switching when the profile in use is tapped', async () => {
    const { onSwitch, onClose } = setup();
    await userEvent.click(screen.getByText('Amara'));

    expect(onSwitch).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('renames through an inline field', async () => {
    const { onRename } = setup();
    await userEvent.click(screen.getByRole('button', { name: /rename amara/i }));

    const field = screen.getByRole('textbox', { name: /rename amara/i });
    await userEvent.clear(field);
    await userEvent.type(field, 'Amara P.');
    await userEvent.click(screen.getByRole('button', { name: /save name/i }));

    expect(onRename).toHaveBeenCalledWith('p_a', 'Amara P.');
  });

  it('does not rename when the name is unchanged', async () => {
    const { onRename } = setup();
    await userEvent.click(screen.getByRole('button', { name: /rename amara/i }));
    await userEvent.click(screen.getByRole('button', { name: /save name/i }));

    expect(onRename).not.toHaveBeenCalled();
  });

  it('abandons a rename on Escape', async () => {
    const { onRename } = setup();
    await userEvent.click(screen.getByRole('button', { name: /rename amara/i }));
    await userEvent.type(screen.getByRole('textbox', { name: /rename amara/i }), 'Zed{Escape}');

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: /rename amara/i })).not.toBeInTheDocument();
  });

  it('abandons a rename through the cancel button too', async () => {
    const { onRename } = setup();
    await userEvent.click(screen.getByRole('button', { name: /rename amara/i }));
    await userEvent.type(screen.getByRole('textbox', { name: /rename amara/i }), 'Zed');
    await userEvent.click(screen.getByRole('button', { name: /cancel rename/i }));

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Amara')).toBeInTheDocument();
  });

  it('confirms before deleting, and keeps the profile if declined', async () => {
    const { onDelete } = setup();
    await userEvent.click(screen.getByRole('button', { name: /delete kasun/i }));

    expect(screen.getByText(/and their grades\?/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^keep$/i }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText('Kasun')).toBeInTheDocument();
  });

  it('deletes once confirmed', async () => {
    const { onDelete } = setup();
    await userEvent.click(screen.getByRole('button', { name: /delete kasun/i }));
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(onDelete).toHaveBeenCalledWith('p_b');
  });

  it('warns that deleting the only profile returns to first run', async () => {
    setup({ profiles: [PROFILES[0]] });
    await userEvent.click(screen.getByRole('button', { name: /delete amara/i }));

    expect(screen.getByText(/only profile/i)).toBeInTheDocument();
  });

  it('offers adding a profile and the full reset', async () => {
    const { onAdd, onResetAll } = setup();
    await userEvent.click(screen.getByRole('button', { name: /add profile/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete everything/i }));

    expect(onAdd).toHaveBeenCalled();
    expect(onResetAll).toHaveBeenCalled();
  });

  it('closes on the backdrop and on the close button', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: /^close$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing while closed', () => {
    const handlers = {
      onClose: vi.fn(),
      onSwitch: vi.fn(),
      onAdd: vi.fn(),
      onRename: vi.fn(),
      onDelete: vi.fn(),
      onResetAll: vi.fn(),
    };
    render(<ProfileMenu isOpen={false} profiles={PROFILES} activeId="p_a" {...handlers} />);

    expect(screen.queryByText('Amara')).not.toBeInTheDocument();
  });
});
