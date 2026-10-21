import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultsExport from '../../src/components/ResultsExport';
import { renderResultsImage } from '../../src/lib/resultsImage';

vi.mock('../../src/lib/resultsImage', async (importOriginal) => ({
  ...(await importOriginal()),
  renderResultsImage: vi.fn(),
}));

const profile = { id: 'a', name: 'Amara', pathway: 'it', grades: { 'INTE 11213': 'A' } };

beforeEach(() => {
  renderResultsImage.mockReset().mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() });
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete navigator.share;
  delete navigator.canShare;
});

function mockSharing(share = vi.fn().mockResolvedValue(undefined), supported = true) {
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  Object.defineProperty(navigator, 'canShare', {
    configurable: true,
    value: vi.fn(() => supported),
  });
  return share;
}

describe('results export controls', () => {
  it('disables export until the selected profile has a result', () => {
    const { rerender } = render(<ResultsExport profile={null} />);
    expect(screen.getByRole('button', { name: /export results/i })).toBeDisabled();
    rerender(<ResultsExport profile={{ ...profile, grades: {} }} />);
    expect(screen.getByText(/add a grade/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export results/i })).toBeDisabled();
  });

  it('previews the current profile, toggles privacy, and downloads a PNG', async () => {
    const { unmount } = render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    expect(await screen.findByRole('img')).toHaveAttribute('src', 'blob:preview');
    expect(screen.getByRole('link', { name: /download png/i })).toHaveAttribute(
      'download',
      'Amara-gpa-results.png'
    );
    expect(renderResultsImage).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'Amara', resultCount: 1 }),
      true
    );
    await userEvent.click(screen.getByLabelText(/include profile name/i));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /download png/i })).toHaveAttribute(
        'download',
        'gpa-results.png'
      )
    );
    expect(renderResultsImage).toHaveBeenLastCalledWith(expect.anything(), false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('disables downloading while generating and offers a useful failure message', async () => {
    let reject;
    renderResultsImage.mockReturnValue(
      new Promise((_, fail) => {
        reject = fail;
      })
    );
    render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/preparing/i);
    expect(screen.getByRole('button', { name: /download png/i })).toBeDisabled();
    reject(new Error('encoding failed'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/try again/i);
    await userEvent.click(screen.getByRole('button', { name: /close export preview/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('selects years and semesters and toggles honours in the rendered image', async () => {
    render(
      <ResultsExport profile={{ ...profile, grades: { 'INTE 11213': 'A', 'INTE 12213': 'B' } }} />
    );
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    await screen.findByRole('img');
    expect(screen.queryByRole('option', { name: /Year 2/ })).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Results to export'), 'semester-1-2');
    await waitFor(() =>
      expect(renderResultsImage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          gpa: '3.00',
          resultCount: 1,
          scope: 'semester-1-2',
          honours: expect.any(Object),
        }),
        true
      )
    );
    expect(await screen.findByRole('link', { name: /download png/i })).toHaveAttribute(
      'download',
      'Amara-gpa-results-semester-1-2.png'
    );
    await userEvent.click(screen.getByLabelText('Include honours badge'));
    await waitFor(() =>
      expect(renderResultsImage).toHaveBeenLastCalledWith(
        expect.objectContaining({ honours: null, scope: 'semester-1-2' }),
        true
      )
    );
    await userEvent.selectOptions(screen.getByLabelText('Results to export'), 'year-1');
    await waitFor(() =>
      expect(renderResultsImage).toHaveBeenLastCalledWith(
        expect.objectContaining({ gpa: '3.50', resultCount: 2, honours: null }),
        true
      )
    );
  });

  it('disables the honours option when no honours standing is available', async () => {
    render(<ResultsExport profile={{ ...profile, grades: { 'INTE 11213': 'C' } }} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    expect(screen.getByLabelText('Include honours badge')).toBeDisabled();
    expect(screen.getByText(/badge is available when/i)).toBeInTheDocument();
  });

  it('supports keyboard input with custom checkboxes and preserves privacy across period changes', async () => {
    render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    await screen.findByRole('img');
    const name = screen.getByRole('checkbox', { name: 'Include profile name' });
    name.focus();
    await userEvent.keyboard(' ');
    expect(name).not.toBeChecked();
    await userEvent.selectOptions(screen.getByLabelText('Results to export'), 'year-1');
    await waitFor(() =>
      expect(renderResultsImage).toHaveBeenLastCalledWith(
        expect.objectContaining({ scope: 'year-1' }),
        false
      )
    );
    expect(await screen.findByRole('link', { name: /download png/i })).toHaveAttribute(
      'download',
      'gpa-results-year-1.png'
    );
    expect(screen.queryByLabelText('Image layout')).not.toBeInTheDocument();
  });

  it('cancels pending renders on close and closes with Escape', async () => {
    let resolve;
    renderResultsImage.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    render(<ResultsExport profile={profile} />);
    const trigger = screen.getByRole('button', { name: /export results/i });
    await userEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    resolve(new Blob(['png']));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('shares the prepared PNG with the selected period and anonymous filename', async () => {
    const share = mockSharing();
    render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    await screen.findByRole('img');
    await userEvent.selectOptions(screen.getByLabelText('Results to export'), 'year-1');
    await userEvent.click(screen.getByLabelText('Include profile name'));
    await screen.findByRole('link', { name: /download png/i });
    await userEvent.click(screen.getByRole('button', { name: /share image/i }));
    expect(share).toHaveBeenCalledWith({ title: 'My academic results', files: [expect.any(File)] });
    const file = share.mock.calls[0][0].files[0];
    expect(file.name).toBe('gpa-results-year-1.png');
    expect(file.type).toBe('image/png');
    expect(file.size).toBe(3);
    expect(await screen.findByRole('status')).toHaveTextContent('Image shared.');
  });

  it('offers a download fallback when file sharing is unsupported', async () => {
    const share = mockSharing(vi.fn(), false);
    render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    await screen.findByRole('img');
    await userEvent.click(screen.getByRole('button', { name: /share image/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/use download png/i);
    expect(share).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /download png/i })).toBeInTheDocument();
  });

  it('handles absent share APIs and hides stale feedback when the selection changes', async () => {
    render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    await screen.findByRole('img');
    await userEvent.click(screen.getByRole('button', { name: /share image/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/not supported/i);
    await userEvent.click(screen.getByLabelText('Include profile name'));
    await screen.findByRole('img');
    expect(screen.queryByText(/not supported/i)).not.toBeInTheDocument();
  });

  it('prevents duplicate sharing, treats cancellation quietly, and reports other failures', async () => {
    let reject;
    const share = mockSharing(
      vi.fn(
        () =>
          new Promise((_, fail) => {
            reject = fail;
          })
      )
    );
    render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    await screen.findByRole('img');
    await userEvent.click(screen.getByRole('button', { name: /share image/i }));
    expect(screen.getByRole('button', { name: /sharing/i })).toBeDisabled();
    reject(new DOMException('Cancelled', 'AbortError'));
    await waitFor(() => expect(screen.getByRole('button', { name: /share image/i })).toBeEnabled());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    share.mockRejectedValue(new Error('Denied'));
    await userEvent.click(screen.getByRole('button', { name: /share image/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/could not share/i);
  });

  it('ignores a rejected render after the preview is closed', async () => {
    let reject;
    renderResultsImage.mockReturnValue(
      new Promise((_, fail) => {
        reject = fail;
      })
    );
    const { unmount } = render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    unmount();
    reject(new Error('late failure'));
    await Promise.resolve();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('does not reuse a revoked image when the name option is toggled back before rendering finishes', async () => {
    const pending = [];
    URL.createObjectURL.mockReturnValueOnce('blob:original').mockReturnValueOnce('blob:latest');
    renderResultsImage
      .mockResolvedValueOnce(new Blob(['original']))
      .mockImplementation(() => new Promise((resolve) => pending.push(resolve)));
    render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    await screen.findByRole('img');
    await userEvent.click(screen.getByLabelText('Include profile name'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:original');
    await userEvent.click(screen.getByLabelText('Include profile name'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download png/i })).toBeDisabled();
    pending[0](new Blob(['stale']));
    pending[1](new Blob(['latest']));
    expect(await screen.findByRole('img')).toHaveAttribute('src', 'blob:latest');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  });

  it('uses fresh data after switching profiles and closes when no exportable grades remain', async () => {
    const { rerender } = render(<ResultsExport profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    await screen.findByRole('img');
    await userEvent.click(screen.getByLabelText('Include profile name'));
    await screen.findByRole('img');
    rerender(
      <ResultsExport
        profile={{ id: 'b', name: 'Kasun', pathway: 'it', grades: { 'INTE 11223': 'C' } }}
      />
    );
    await waitFor(() =>
      expect(renderResultsImage).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: 'Kasun', gpa: '2.00', resultCount: 1 }),
        true
      )
    );
    expect(await screen.findByRole('link', { name: /download png/i })).toHaveAttribute(
      'download',
      'Kasun-gpa-results.png'
    );
    rerender(<ResultsExport profile={{ ...profile, grades: {} }} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export results/i })).toBeDisabled();
    expect(document.body.style.overflow).toBe('');
  });

  it('resets an unavailable semester selection when the underlying grades change', async () => {
    const { rerender } = render(
      <ResultsExport profile={{ ...profile, grades: { 'INTE 11213': 'A', 'INTE 12213': 'B' } }} />
    );
    await userEvent.click(screen.getByRole('button', { name: /export results/i }));
    await screen.findByRole('img');
    await userEvent.selectOptions(screen.getByLabelText('Results to export'), 'semester-1-2');
    await screen.findByRole('img');
    rerender(<ResultsExport profile={profile} />);
    await waitFor(() =>
      expect(renderResultsImage).toHaveBeenLastCalledWith(
        expect.objectContaining({ scope: 'all', resultCount: 1 }),
        true
      )
    );
    expect(screen.getByLabelText('Results to export')).toHaveValue('all');
  });
});
