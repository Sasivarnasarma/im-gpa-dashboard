import React, { useEffect, useMemo, useState } from 'react';
import { Check, Download, ImageDown, LoaderCircle, Share2, X } from 'lucide-react';
import useDialog from '../hooks/useDialog';
import {
  buildResultsReport,
  selectResultsReport,
  renderResultsImage,
  resultsImageFilename,
} from '../lib/resultsImage';

function ExportCheckbox({ children, checked, disabled = false, onChange }) {
  return (
    <label
      className={`inline-flex min-h-10 items-center gap-3 border border-hairline bg-canvas px-3 py-2 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-m-blue-light'} `}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center border border-hairline bg-surface-soft text-transparent transition-colors peer-checked:border-m-blue-light peer-checked:bg-m-blue-light peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-white peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </label>
  );
}

function ExportPreview({ report: fullReport, onClose }) {
  const [includeName, setIncludeName] = useState(true);
  const [includeHonours, setIncludeHonours] = useState(true);
  const [selectedScope, setSelectedScope] = useState('all');
  const [exportDate] = useState(() =>
    new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  );
  const scopes = [
    { value: 'all', label: 'All entered results' },
    ...[...new Set(fullReport.semesters.map((section) => section.year))].flatMap((year) => [
      { value: `year-${year}`, label: `Year ${year} — all semesters` },
      ...fullReport.semesters
        .filter((section) => section.year === year)
        .map((section) => ({
          value: `semester-${year}-${section.semester}`,
          label: `Year ${year} — Semester ${section.semester}`,
        })),
    ]),
  ];
  const scope = scopes.some((option) => option.value === selectedScope) ? selectedScope : 'all';
  const report = useMemo(
    () => ({ ...selectResultsReport(fullReport, scope, includeHonours), date: exportDate }),
    [fullReport, scope, includeHonours, exportDate]
  );
  const [preview, setPreview] = useState(null);
  const renderRequest = useMemo(() => ({ report, includeName }), [report, includeName]);
  const [sharing, setSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState(null);
  const { ref, props } = useDialog({ isOpen: true, onClose, labelledBy: 'export-heading' });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let url;
    renderResultsImage(report, includeName)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreview({ url, blob, request: renderRequest });
      })
      .catch(() => {
        if (!cancelled) {
          setPreview({
            request: renderRequest,
            error: 'Could not create your image. Close this preview and try again.',
          });
        }
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [report, includeName, renderRequest]);

  // Hide the previous bitmap immediately when its privacy option changes.
  const current = preview?.request === renderRequest ? preview : null;
  const ready = Boolean(current?.url);
  const error = current?.error;
  const notice = shareNotice?.preview === current ? shareNotice.message : null;

  const shareImage = async () => {
    if (!ready || sharing) return;
    try {
      const file = new File([current.blob], resultsImageFilename(report.name, includeName, scope), {
        type: 'image/png',
      });
      if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
        setShareNotice({
          preview: current,
          message:
            'Image sharing is not supported in this browser. Use Download PNG, then share the saved image.',
        });
        return;
      }
      setSharing(true);
      setShareNotice(null);
      // The PNG is ready before the click, preserving the share API's user gesture.
      await navigator.share({ files: [file], title: 'My academic results' });
      setShareNotice({ preview: current, message: 'Image shared.' });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setShareNotice({
          preview: current,
          message: 'Could not share this image. Try Download PNG instead.',
        });
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-110 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div
        ref={ref}
        {...props}
        className="bg-surface-soft border border-hairline w-full max-w-3xl max-h-[92dvh] overflow-y-auto flex flex-col text-white shadow-2xl"
      >
        <div className="h-1 shrink-0 flex" aria-hidden="true">
          <div className="flex-1 bg-m-blue-light" />
          <div className="flex-1 bg-m-blue-dark" />
          <div className="flex-1 bg-m-red" />
        </div>
        <div className="p-4 sm:p-5 border-b border-hairline flex shrink-0 justify-between items-start gap-4">
          <div>
            <h2
              id="export-heading"
              className="font-bmw-display font-bold uppercase tracking-wider text-sm"
            >
              Export your results
            </h2>
            <p className="text-xs text-body-text mt-2">
              A snapshot of your entered results. Ready to save or share.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export preview"
            className="p-2 border border-hairline hover:border-white cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-4 sm:px-5 py-3 border-b border-hairline flex shrink-0 flex-wrap items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 w-full">
            Results to export
            <select
              value={scope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="min-w-0 flex-1 bg-canvas border border-hairline px-3 py-2 text-white focus:border-m-blue-light"
            >
              {scopes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <ExportCheckbox checked={includeName} onChange={(e) => setIncludeName(e.target.checked)}>
            Include profile name
          </ExportCheckbox>
          <ExportCheckbox
            checked={Boolean(fullReport.honours) && includeHonours}
            disabled={!fullReport.honours}
            onChange={(e) => setIncludeHonours(e.target.checked)}
          >
            Include honours badge
          </ExportCheckbox>
          <p className="w-full text-body-text">
            {fullReport.honours
              ? 'Honours reflects your overall standing. GPA and results reflect the selected period.'
              : 'An honours badge is available when your overall standing is First or Second Class.'}
          </p>
          <span className="text-muted-text">PNG · 1620 px wide · Generated on your device</span>
        </div>
        <div
          className="overflow-y-auto min-h-32 flex-1 bg-canvas p-3 sm:p-5"
          aria-busy={!ready && !error}
        >
          {error ? (
            <p role="alert" className="text-sm text-m-red p-6">
              {error}
            </p>
          ) : ready ? (
            <img
              src={preview.url}
              alt="Preview of your results image, including GPA summary and entered grades grouped by semester"
              className="w-full h-auto block"
            />
          ) : (
            <p
              role="status"
              className="p-12 flex items-center justify-center gap-3 text-sm text-body-text"
            >
              <LoaderCircle
                className="w-5 h-5 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              Preparing your image…
            </p>
          )}
        </div>
        <div className="p-4 sm:p-5 border-t border-hairline flex shrink-0 flex-wrap items-center justify-between gap-3">
          {notice && (
            <p role="status" className="w-full text-xs text-body-text">
              {notice}
            </p>
          )}
          <p className="text-[11px] text-body-text">
            By{' '}
            <a
              href="https://gpa.sasivarnasarma.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-4 hover:text-m-blue-light"
            >
              Sasivarnasarma
            </a>{' '}
            · Personal results summary
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={shareImage}
              disabled={!ready || sharing || Boolean(error)}
              className="border border-hairline hover:border-m-blue-light disabled:opacity-40 disabled:cursor-not-allowed px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />{' '}
              {sharing ? 'Sharing…' : 'Share image'}
            </button>
            {ready && !error ? (
              <a
                href={preview.url}
                download={resultsImageFilename(report.name, includeName, scope)}
                className="bg-m-blue-light hover:bg-m-blue-dark text-white px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" /> Download PNG
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="bg-surface-elevated text-muted-text px-5 py-3 text-xs font-bold uppercase tracking-wider"
              >
                Download PNG
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsExport({ profile }) {
  const [open, setOpen] = useState(false);
  const report = useMemo(() => (profile ? buildResultsReport(profile) : null), [profile]);
  const hasResults = report?.resultCount > 0;
  return (
    <>
      <div className="border border-hairline bg-surface-soft px-4 py-4 sm:px-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bmw-display font-bold text-white uppercase tracking-wider">
            Your results, beautifully captured
          </p>
          <p className="text-xs text-body-text mt-1.5">
            {hasResults
              ? 'Save your entered results as a crisp, shareable image.'
              : 'Add a grade to create your results image.'}
          </p>
        </div>
        <button
          type="button"
          disabled={!hasResults}
          onClick={() => setOpen(true)}
          className="border border-hairline bg-canvas hover:border-m-blue-light text-white px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ImageDown className="w-4 h-4 text-m-blue-light" aria-hidden="true" /> Export results
        </button>
      </div>
      {open && hasResults && (
        <ExportPreview key={profile.id} report={report} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
