import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildResultsReport,
  selectResultsReport,
  renderResultsImage,
  resultsImageFilename,
} from '../../src/lib/resultsImage';
import { modules } from '../../src/data/modules';
import { getActiveModules } from '../../src/lib/gpaEngine';

afterEach(() => vi.restoreAllMocks());

const profile = {
  name: 'Amara Perera',
  pathway: 'it',
  specialization: 'undecided',
  grades: {
    'INTE 11213': 'A',
    'INTE 11223': 'E',
    'GNCT 11212': 'Fail',
    'ACLT 11013': 'B',
    'INTE 12213': 'B+',
    'INTE 21343': 'A+', // MIT-only: must not leak into the IT report.
    'MGTE 11243': 'invalid',
  },
};

describe('results report', () => {
  it('exports entered grades, including failures, and excludes other pathways and invalid values', () => {
    const report = buildResultsReport(profile, new Date(2026, 9, 21));
    expect(report.date).toBe('21 Oct 2026');
    expect(report.programme).toBe('IT');
    expect(report.resultCount).toBe(5);
    expect(report.gpaCredits).toBe(9);
    expect(report.gpa).toBe('2.43');
    expect(report.semesters.map((s) => [s.label, s.gpa])).toEqual([
      ['YEAR 1 / SEMESTER 1', '2.00'],
      ['YEAR 1 / SEMESTER 2', '3.30'],
    ]);
    expect(report.semesters[0].rows.map((r) => r.grade)).toEqual(['A', 'E', 'B', 'Fail']);
  });

  it('handles empty, undecided, and non-GPA-only profiles without inventing a GPA', () => {
    expect(buildResultsReport({ name: 'Student' })).toMatchObject({
      resultCount: 0,
      gpa: '—',
      programme: 'PATHWAY UNDECIDED',
      semesters: [],
    });
    expect(buildResultsReport({ ...profile, grades: { 'GNCT 11212': 'Pass' } })).toMatchObject({
      gpa: '—',
      gpaCredits: 0,
      resultCount: 1,
      semesters: [{ gpa: '—' }],
    });
  });

  it('uses the selected MIT stream and omits Year 3 before a stream is selected', () => {
    const mit = { ...profile, pathway: 'mit', specialization: 'is', grades: { 'INTE 31413': 'A' } };
    expect(buildResultsReport(mit)).toMatchObject({ programme: 'MIT / IS', resultCount: 1 });
    expect(buildResultsReport({ ...mit, specialization: 'undecided' })).toMatchObject({
      programme: 'MIT',
      resultCount: 0,
    });
    expect(buildResultsReport({ ...mit, specialization: undefined }).programme).toBe('MIT');
  });

  it('makes portable filenames and keeps names out when hidden', () => {
    expect(resultsImageFilename(' Amara / Perera ', true)).toBe('Amara-Perera-gpa-results.png');
    expect(resultsImageFilename('අමරා', true)).toBe('අමරා-gpa-results.png');
    expect(resultsImageFilename('Private Name', false)).toBe('gpa-results.png');
    expect(resultsImageFilename('///', true)).toBe('gpa-results.png');
  });
});

describe('honours standing', () => {
  it('includes First and Second Class standings and omits them for pass or empty results', () => {
    const reportFor = (grade) =>
      buildResultsReport({ ...profile, grades: { 'INTE 11213': grade } });
    expect(reportFor('A').honours).toMatchObject({ label: 'FIRST CLASS' });
    expect(reportFor('B+').honours).toMatchObject({
      label: 'SECOND CLASS',
      division: 'UPPER DIVISION',
    });
    expect(reportFor('B').honours).toMatchObject({
      label: 'SECOND CLASS',
      division: 'LOWER DIVISION',
    });
    expect(reportFor('C').honours).toBeNull();
    expect(reportFor('').honours).toBeNull();
  });
});

describe('export periods', () => {
  const report = buildResultsReport({
    ...profile,
    grades: { 'INTE 11213': 'A', 'INTE 12213': 'B', 'INTE 21213': 'C', 'GNCT 11212': 'Pass' },
  });

  it('recalculates year and semester totals and labels using just the selected results', () => {
    expect(selectResultsReport(report, 'year-1')).toMatchObject({
      resultCount: 3,
      gpaCredits: 6,
      gpa: '3.50',
      gpaLabel: 'YEAR GPA',
      scopeLabel: 'YEAR 1',
    });
    const semester = selectResultsReport(report, 'semester-1-2');
    expect(semester).toMatchObject({
      resultCount: 1,
      gpaCredits: 3,
      gpa: '3.00',
      gpaLabel: 'SEMESTER GPA',
      scopeLabel: 'YEAR 1 / SEMESTER 2',
    });
    expect(semester.semesters).toHaveLength(1);
    expect(semester.semesters[0].rows[0].code).toBe('INTE 12213');
    expect(selectResultsReport(report)).toMatchObject({ resultCount: 4, gpa: '3.00' });
    expect(resultsImageFilename('Amara', true, 'semester-1-2')).toBe(
      'Amara-gpa-results-semester-1-2.png'
    );
  });

  it('keeps honours based on overall standing and allows it to be hidden without changing data', () => {
    expect(selectResultsReport(report, 'semester-1-1').honours).toEqual(report.honours);
    expect(selectResultsReport(report, 'year-1', false)).toMatchObject({
      honours: null,
      resultCount: 3,
    });
    expect(report.honours).not.toBeNull();
    expect(selectResultsReport(report, 'year-3')).toMatchObject({ gpa: '—', resultCount: 0 });
  });
});

function mockCanvas({ noContext = false, noBlob = false } = {}) {
  const context = {
    measureText: vi.fn((value) => ({ width: value.length * 13 })),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(noContext ? null : context);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type) {
    expect(type).toBe('image/png');
    expect(this.width).toBe(1620);
    callback(noBlob ? null : new Blob(['png'], { type }));
  });
  return context;
}

describe('PNG rendering', () => {
  it('draws full results with wrapped titles, grades, notes, and a high-resolution backing bitmap', async () => {
    const context = mockCanvas();
    const active = getActiveModules(modules, 'mit', 'is');
    const grades = Object.fromEntries(
      active.map((m, i) => [
        m.code,
        m.gradeType === 'passfail' ? 'Pass' : ['A', 'B', 'C', 'D'][i % 4],
      ])
    );
    const report = buildResultsReport({ ...profile, pathway: 'mit', specialization: 'is', grades });
    report.name = 'LongName'.repeat(25);
    const blob = await renderResultsImage(report);
    expect(blob.type).toBe('image/png');
    const drawn = context.fillText.mock.calls.map(([value]) => value);
    expect(drawn).toContain('NON-GPA');
    expect(drawn).toContain('Pass');
    expect(drawn.join(' ')).toContain('Not an official academic transcript');
    expect(drawn).toContain('SEMESTER GPA  4.00');
    expect(context.scale).toHaveBeenCalledWith(1.5, 1.5);
  });

  it('omits the name from image pixels when requested', async () => {
    const context = mockCanvas();
    await renderResultsImage(buildResultsReport(profile), false);
    const drawn = context.fillText.mock.calls.map(([value]) => value);
    expect(drawn).toContain('My academic results');
    expect(drawn).not.toContain(profile.name);
    expect(drawn).toContain('Made with ♥ by Sasivarnasarma');
    expect(drawn).toContain('♥');
    expect(drawn).toContain('gpa.sasivarnasarma.me');
  });

  it('renders the honours badge as current standing', async () => {
    const context = mockCanvas();
    await renderResultsImage(buildResultsReport({ ...profile, grades: { 'INTE 11213': 'A' } }));
    const drawn = context.fillText.mock.calls.map(([value]) => value);
    expect(drawn).toContain('CURRENT STANDING');
    expect(drawn).toContain('FIRST CLASS');
    expect(drawn).not.toContain('1ST');
    expect(drawn).not.toContain('2:1');
    expect(drawn).not.toContain('2:2');
    expect(drawn).toContain('Based on entered results');
  });

  it('hides the honours badge in pixels and labels a scoped summary accurately', async () => {
    const context = mockCanvas();
    const fullReport = buildResultsReport({ ...profile, grades: { 'INTE 11213': 'A' } });
    await renderResultsImage(selectResultsReport(fullReport, 'year-1', false));
    const drawn = context.fillText.mock.calls.map(([value]) => value);
    expect(drawn).not.toContain('FIRST CLASS');
    expect(drawn).not.toContain('CURRENT STANDING');
    expect(drawn).toContain('YEAR GPA');
    expect(drawn.some((value) => value.startsWith('YEAR 1  /  '))).toBe(true);
  });

  it('reports unsupported canvas and failed PNG encoding', async () => {
    mockCanvas({ noContext: true });
    await expect(renderResultsImage(buildResultsReport(profile))).rejects.toThrow('unavailable');
    mockCanvas({ noBlob: true });
    await expect(renderResultsImage(buildResultsReport(profile))).rejects.toThrow(
      'Could not create'
    );
  });
});
