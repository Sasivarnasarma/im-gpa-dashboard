import { modules, gradeMap, GRADE_OPTIONS, PASSFAIL_OPTIONS } from '../data/modules';
import { SPECIALIZATION_LABELS } from '../data/constants';
import { getActiveModules, computeGpaStats, getGpaTier, GPA_TIER } from './gpaEngine';
import { assessClasses, resolveAwardTier } from './degreeAudit';

// Export only the selected curriculum and actual, valid entered results.
export function buildResultsReport(profile, date = new Date()) {
  const grades = profile.grades ?? {};
  const selected = getActiveModules(
    modules,
    profile.pathway,
    profile.specialization ?? 'undecided'
  );
  const results = selected.filter((mod) =>
    (mod.gradeType === 'passfail' ? PASSFAIL_OPTIONS : GRADE_OPTIONS).includes(grades[mod.code])
  );
  const stats = computeGpaStats(results, grades, gradeMap);
  const validGrades = Object.fromEntries(results.map((mod) => [mod.code, grades[mod.code]]));
  const tier = resolveAwardTier(
    getGpaTier(stats.cgpa, stats.totalGpaCredits > 0),
    assessClasses(selected, validGrades, gradeMap, stats.cgpa)
  );
  const honours =
    {
      [GPA_TIER.FIRST]: {
        label: 'FIRST CLASS',
        division: 'HONOURS',
        color: '#e7c878',
      },
      [GPA_TIER.UPPER]: {
        label: 'SECOND CLASS',
        division: 'UPPER DIVISION',
        color: '#8ac8ff',
      },
      [GPA_TIER.LOWER]: {
        label: 'SECOND CLASS',
        division: 'LOWER DIVISION',
        color: '#e9b58c',
      },
    }[tier] ?? null;
  const semesters = [];
  for (let year = 1; year <= 3; year++) {
    for (let semester = 1; semester <= 2; semester++) {
      const rows = results
        .filter((mod) => mod.y === year && mod.s === semester)
        .map((mod) => ({ ...mod, grade: grades[mod.code] }));
      if (!rows.length) continue;
      const semesterStats = computeGpaStats(rows, grades, gradeMap);
      semesters.push({
        year,
        semester,
        label: `YEAR ${year} / SEMESTER ${semester}`,
        rows,
        gpa: semesterStats.totalGpaCredits > 0 ? semesterStats.cgpa.toFixed(2) : '—',
      });
    }
  }
  const pathway = ['it', 'mit'].includes(profile.pathway) ? profile.pathway.toUpperCase() : null;
  const specialization =
    profile.pathway === 'mit' && profile.specialization !== 'undecided'
      ? SPECIALIZATION_LABELS[profile.specialization]
      : null;
  return {
    name: profile.name,
    programme: pathway
      ? `${pathway}${specialization ? ` / ${specialization}` : ''}`
      : 'PATHWAY UNDECIDED',
    date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    gpa: stats.totalGpaCredits > 0 ? stats.cgpa.toFixed(2) : '—',
    gpaCredits: stats.totalGpaCredits,
    honours,
    resultCount: results.length,
    scope: 'all',
    scopeLabel: 'ALL ENTERED RESULTS',
    gpaLabel: 'CUMULATIVE GPA',
    semesters,
  };
}

// Period summaries use only that period's grades. Honours remains an overall standing.
export function selectResultsReport(report, scope = 'all', includeHonours = true) {
  const semesters = report.semesters.filter(
    (section) =>
      scope === 'all' ||
      scope === `year-${section.year}` ||
      scope === `semester-${section.year}-${section.semester}`
  );
  const rows = semesters.flatMap((section) => section.rows);
  const grades = Object.fromEntries(rows.map((row) => [row.code, row.grade]));
  const stats = computeGpaStats(rows, grades, gradeMap);
  const isYear = scope.startsWith('year-');
  return {
    ...report,
    scope,
    scopeLabel:
      scope === 'all'
        ? 'ALL ENTERED RESULTS'
        : isYear
          ? `YEAR ${scope.split('-')[1]}`
          : (semesters[0]?.label ?? 'NO RESULTS'),
    gpaLabel: scope === 'all' ? 'CUMULATIVE GPA' : isYear ? 'YEAR GPA' : 'SEMESTER GPA',
    gpa: stats.totalGpaCredits > 0 ? stats.cgpa.toFixed(2) : '—',
    gpaCredits: stats.totalGpaCredits,
    resultCount: rows.length,
    honours: includeHonours ? report.honours : null,
    semesters,
  };
}

export function resultsImageFilename(name, includeName, scope = 'all') {
  const slug = includeName
    ? name
        .normalize('NFKC')
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60)
    : '';
  return `${slug ? `${slug}-` : ''}gpa-results${scope === 'all' ? '' : `-${scope}`}.png`;
}

const WIDTH = 1080;
const INK = '#15202d';
const MUTED = '#607080';
const BLUE = '#0066b1';
const FONT = 'Arial, sans-serif';

function text(ctx, value, x, y, size = 20, color = INK, bold = false, align = 'left') {
  ctx.font = `${bold ? '700' : '400'} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(String(value), x, y);
}

// Splits even an unbroken long name, without truncating a student's results.
function wrap(ctx, value, maxWidth, size, bold = false) {
  ctx.font = `${bold ? '700' : '400'} ${size}px ${FONT}`;
  const lines = [];
  let line = '';
  for (const character of String(value)) {
    if (line && ctx.measureText(line + character).width > maxWidth) {
      const space = line.lastIndexOf(' ');
      if (space > 0 && character !== ' ') {
        lines.push(line.slice(0, space));
        line = line.slice(space + 1);
      } else {
        lines.push(line.trimEnd());
        line = '';
      }
    }
    line += character;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function stripe(ctx, y) {
  [BLUE, '#1c69d4', '#e22718'].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(index * (WIDTH / 3), y, WIDTH / 3, 8);
  });
}

// Canvas avoids screenshotting the dashboard, external images, and font downloads.
// A 1.5x backing bitmap keeps the PNG sharp while bounding full-curriculum size.
export async function renderResultsImage(report, includeName = true) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image export is unavailable in this browser.');

  const nameLines = wrap(ctx, includeName ? report.name : 'My academic results', 620, 30, true);
  const headerHeight = 302 + nameLines.length * 40;
  let cursor = headerHeight + 218;
  const sections = report.semesters.map((semester) => {
    const top = cursor;
    cursor += 106;
    const rows = semester.rows.map((row) => {
      const lines = wrap(ctx, row.name, 500, 21);
      const height = Math.max(78, 34 + lines.length * 28);
      const layout = { ...row, lines, top: cursor, height };
      cursor += height;
      return layout;
    });
    cursor += 34;
    return { ...semester, top, rows };
  });
  const height = cursor + 236;
  canvas.width = WIDTH * 1.5;
  canvas.height = Math.ceil(height * 1.5);
  ctx.scale(1.5, 1.5);
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#f4f6f8';
  ctx.fillRect(0, 0, WIDTH, height);
  const background = ctx.createLinearGradient(0, 0, WIDTH, headerHeight);
  background.addColorStop(0, '#0b1420');
  background.addColorStop(0.6, '#142d47');
  background.addColorStop(1, '#0b1727');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, headerHeight);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WIDTH, headerHeight);
  ctx.clip();
  ctx.translate(860, -100);
  ctx.rotate(0.45);
  ['#ffffff05', '#ffffff09', '#308ad51a'].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(index * 72, 0, 38, headerHeight + 400);
  });
  ctx.restore();
  stripe(ctx, 0);
  text(ctx, 'UNIVERSITY OF KELANIYA', 64, 42, 17, '#c4d5e7', true);
  text(ctx, 'IT / MIT  ·  GPA DASHBOARD', 1016, 44, 14, '#91b0cc', true, 'right');
  text(ctx, 'Academic', 60, 93, 62, '#ffffff', true);
  text(ctx, 'results.', 60, 153, 62, '#75beff', true);
  nameLines.forEach((line, i) => text(ctx, line, 64, 235 + i * 40, 30, '#ffffff', true));
  ctx.fillStyle = '#ffffff22';
  ctx.fillRect(64, headerHeight - 55, 952, 1);
  text(ctx, report.programme, 64, headerHeight - 33, 15, '#c4d5e7', true);
  text(
    ctx,
    `${report.scopeLabel}  /  ${report.date.toUpperCase()}`,
    1016,
    headerHeight - 33,
    14,
    '#a8bed2',
    false,
    'right'
  );
  if (report.honours) {
    const { color, label, division } = report.honours;
    ctx.fillStyle = '#07111bb3';
    ctx.fillRect(754, 108, 262, 168);
    ctx.fillStyle = color;
    ctx.fillRect(754, 108, 3, 168);
    text(
      ctx,
      report.scope === 'all' ? 'CURRENT STANDING' : 'OVERALL STANDING',
      778,
      125,
      12,
      '#a8bed2',
      true
    );
    text(ctx, label, 778, 169, 24, color, true);
    text(ctx, division, 778, 207, 16, '#d5e1ee', true);
    text(ctx, 'Based on entered results', 778, 254, 11, '#8fa7bd');
  }

  const metrics = [
    [report.gpaLabel, report.gpa, 'Based on entered GPA results'],
    ['RESULTS ADDED', report.resultCount, 'Entered modules in this selection'],
    ['GPA CREDITS GRADED', report.gpaCredits, 'Excludes non-GPA modules'],
  ];
  metrics.forEach(([label, value, caption], i) => {
    const x = 48 + i * 332;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, headerHeight + 30, 320, 150);
    ctx.fillStyle = i === 0 ? BLUE : '#dce5ed';
    ctx.fillRect(x, headerHeight + 30, 320, 3);
    text(ctx, label, x + 22, headerHeight + 49, 14, MUTED, true);
    text(ctx, value, x + 22, headerHeight + 77, 46, i === 0 ? BLUE : INK, true);
    text(ctx, caption, x + 22, headerHeight + 139, 14, MUTED);
  });

  sections.forEach((section, sectionIndex) => {
    ctx.fillStyle = BLUE;
    ctx.fillRect(48, section.top - 4, 38, 34);
    text(
      ctx,
      String(sectionIndex + 1).padStart(2, '0'),
      67,
      section.top + 4,
      16,
      '#ffffff',
      true,
      'center'
    );
    text(ctx, section.label, 100, section.top, 22, INK, true);
    text(ctx, `SEMESTER GPA  ${section.gpa}`, 1016, section.top + 3, 17, BLUE, true, 'right');
    const tableY = section.top + 50;
    ctx.fillStyle = '#e5ebf0';
    ctx.fillRect(48, tableY, 984, 44);
    text(ctx, 'MODULE', 64, tableY + 14, 14, MUTED, true);
    text(ctx, 'COURSE', 250, tableY + 14, 14, MUTED, true);
    text(ctx, 'CREDITS', 867, tableY + 14, 14, MUTED, true, 'center');
    text(ctx, 'GRADE', 972, tableY + 14, 14, MUTED, true, 'center');
    section.rows.forEach((row, index) => {
      ctx.fillStyle = index % 2 ? '#f9fafb' : '#ffffff';
      ctx.fillRect(48, row.top, 984, row.height - 1);
      text(ctx, row.code, 64, row.top + 23, 17, MUTED, true);
      row.lines.forEach((line, i) => text(ctx, line, 250, row.top + 18 + i * 28, 21));
      if (row.nonGpa) {
        text(ctx, 'NON-GPA', 250, row.top + row.height - 22, 12, MUTED, true);
      }
      text(ctx, row.cr, 867, row.top + 23, 21, MUTED, false, 'center');
      const points = gradeMap[row.grade];
      const gradeColor =
        row.grade === 'Pass' || points >= 3 ? BLUE : points >= 2 ? '#a65b00' : '#bd3025';
      ctx.fillStyle = `${gradeColor}12`;
      ctx.fillRect(934, row.top + 13, 76, 46);
      text(ctx, row.grade, 972, row.top + 23, 21, gradeColor, true, 'center');
    });
  });
  ctx.fillStyle = '#101e2c';
  ctx.fillRect(0, cursor + 8, WIDTH, height - cursor);
  text(
    ctx,
    'Personal summary · Not an official academic transcript.',
    64,
    cursor + 39,
    16,
    '#9db0c2'
  );
  text(
    ctx,
    'Only entered results for the selected pathway are included. Non-GPA results do not affect GPA.',
    64,
    cursor + 69,
    15,
    '#9db0c2'
  );
  ctx.fillStyle = '#ffffff20';
  ctx.fillRect(64, cursor + 110, 952, 1);
  const credit = 'Made with ♥ by Sasivarnasarma';
  text(ctx, credit, WIDTH / 2, cursor + 145, 17, '#dce7f1', true, 'center');
  const creditLeft = (WIDTH - ctx.measureText(credit).width) / 2;
  const heartX = creditLeft + ctx.measureText('Made with ').width;
  text(ctx, '♥', heartX, cursor + 145, 17, '#e85353', true);
  text(ctx, 'gpa.sasivarnasarma.me', WIDTH / 2, cursor + 177, 17, '#75beff', true, 'center');
  stripe(ctx, height - 8);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not create the image. Please try again.');
  return blob;
}
