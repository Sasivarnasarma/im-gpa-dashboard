import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../src/components/ErrorBoundary';

const Boom = () => {
  throw new Error('render exploded');
};

afterEach(() => vi.restoreAllMocks());

describe('ErrorBoundary', () => {
  it('renders its children while nothing goes wrong', () => {
    render(
      <ErrorBoundary>
        <p>dashboard</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('shows a recoverable screen instead of a blank page when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    // The reassurance that matters: a crash does not mean lost grades.
    expect(screen.getByText(/saved grades are\s+untouched/i)).toBeInTheDocument();
  });

  it('offers a reload as the way out', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    await userEvent.click(screen.getByRole('button', { name: /reload/i }));

    expect(reload).toHaveBeenCalled();
  });

  it('reports the crash to the console for debugging', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(spy).toHaveBeenCalledWith(
      'GPA Dashboard crashed:',
      expect.any(Error),
      expect.anything()
    );
  });
});
