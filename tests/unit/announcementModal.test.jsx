import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AnnouncementModal from '../../src/components/AnnouncementModal';

const announcement = {
  id: 'test',
  title: 'A custom title',
  message: 'First line\nSecond line',
  buttonText: 'Understood',
};

describe('announcement modal', () => {
  it('uses the configured title, message, and button with accessible dialog semantics', async () => {
    const dismiss = vi.fn();
    render(<AnnouncementModal isOpen announcement={announcement} onDismiss={dismiss} />);
    expect(screen.getByRole('dialog', { name: announcement.title })).toHaveAttribute(
      'aria-describedby',
      'announcement-message'
    );
    expect(document.getElementById('announcement-message').textContent).toBe(announcement.message);
    const button = screen.getByRole('button', { name: announcement.buttonText });
    expect(button).toHaveFocus();
    await userEvent.click(button);
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('dismisses with Escape and restores focus on closing', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const dismiss = vi.fn();
    const { rerender, unmount } = render(
      <AnnouncementModal isOpen announcement={announcement} onDismiss={dismiss} />
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(dismiss).toHaveBeenCalledOnce();
    rerender(<AnnouncementModal isOpen={false} announcement={announcement} onDismiss={dismiss} />);
    expect(trigger).toHaveFocus();
    unmount();
    trigger.remove();
  });

  it('renders custom messages as text and provides a default for an empty button label', () => {
    render(
      <AnnouncementModal
        isOpen
        announcement={{ ...announcement, message: '<script>unsafe()</script>', buttonText: ' ' }}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('<script>unsafe()</script>')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AnnouncementModal isOpen={false} announcement={announcement} onDismiss={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a configured URL button in a new tab without dismissing the announcement', () => {
    const dismiss = vi.fn();
    render(
      <AnnouncementModal
        isOpen
        announcement={{
          ...announcement,
          link: { url: ' https://gpa.sasivarnasarma.me/features ', text: ' Learn more ' },
        }}
        onDismiss={dismiss}
      />
    );
    const link = screen.getByRole('link', { name: 'Learn more' });
    expect(link).toHaveAttribute('href', 'https://gpa.sasivarnasarma.me/features');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    fireEvent.click(link);
    expect(dismiss).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: announcement.buttonText })).toBeInTheDocument();
  });

  it.each([
    undefined,
    null,
    { url: '', text: '' },
    { url: 'https://example.com', text: ' ' },
    { url: ' ', text: 'Read more' },
    { url: 'not a URL', text: 'Read more' },
    { url: 'https://', text: 'Read more' },
    { url: 'javascript:alert(1)', text: 'Read more' },
    { url: 'data:text/html,example', text: 'Read more' },
  ])('hides absent, incomplete, or invalid URL buttons (%j)', (link) => {
    render(
      <AnnouncementModal isOpen announcement={{ ...announcement, link }} onDismiss={vi.fn()} />
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
