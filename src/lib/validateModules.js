// Validates curriculum schema in data/modules.js; returns an array of problem strings.

const VALID_PATHWAYS = ['it', 'mit', 'both'];
const VALID_SPECIALIZATIONS = ['bse', 'oscm', 'is'];
const VALID_GRADE_TYPES = ['passfail'];
const VALID_YEARS = [1, 2, 3];
const VALID_SEMESTERS = [1, 2];

export function validateModules(modules, gradeMap) {
  const problems = [];
  const seenCodes = new Set();

  if (!Array.isArray(modules)) {
    return ['modules is not an array'];
  }

  modules.forEach((m, i) => {
    const label = m?.code ? `"${m.code}"` : `module at index ${i}`;

    if (!m || typeof m !== 'object') {
      problems.push(`${label}: not an object`);
      return;
    }

    // Identity
    if (typeof m.code !== 'string' || m.code.trim() === '') {
      problems.push(`${label}: missing or empty "code"`);
    } else if (seenCodes.has(m.code)) {
      // Course codes must be unique
      problems.push(`${label}: duplicate course code`);
    } else {
      seenCodes.add(m.code);
    }

    if (typeof m.name !== 'string' || m.name.trim() === '') {
      problems.push(`${label}: missing or empty "name"`);
    }

    // Placement
    if (!VALID_YEARS.includes(m.y)) {
      problems.push(`${label}: "y" must be one of ${VALID_YEARS.join(', ')} (got ${m.y})`);
    }
    if (!VALID_SEMESTERS.includes(m.s)) {
      problems.push(`${label}: "s" must be one of ${VALID_SEMESTERS.join(', ')} (got ${m.s})`);
    }

    // Credits — drives every GPA denominator, so it must be a real number.
    if (typeof m.cr !== 'number' || !Number.isFinite(m.cr) || m.cr < 0) {
      problems.push(`${label}: "cr" must be a non-negative number (got ${m.cr})`);
    }

    // Optional flags
    if (m.pathway !== undefined && !VALID_PATHWAYS.includes(m.pathway)) {
      problems.push(
        `${label}: "pathway" must be one of ${VALID_PATHWAYS.join(', ')} (got "${m.pathway}")`
      );
    }
    if (m.gradeType !== undefined && !VALID_GRADE_TYPES.includes(m.gradeType)) {
      problems.push(
        `${label}: "gradeType" must be one of ${VALID_GRADE_TYPES.join(', ')} (got "${m.gradeType}")`
      );
    }
    if (m.nonGpa !== undefined && typeof m.nonGpa !== 'boolean') {
      problems.push(`${label}: "nonGpa" must be a boolean (got ${typeof m.nonGpa})`);
    }
    if (m.optional !== undefined && typeof m.optional !== 'boolean') {
      problems.push(`${label}: "optional" must be a boolean (got ${typeof m.optional})`);
    }

    // Specialization groups
    ['specCompulsory', 'specOptional'].forEach((key) => {
      const value = m[key];
      if (value === undefined) return;

      if (!Array.isArray(value)) {
        problems.push(`${label}: "${key}" must be an array`);
        return;
      }
      value.forEach((spec) => {
        if (!VALID_SPECIALIZATIONS.includes(spec)) {
          problems.push(
            `${label}: "${key}" has unknown specialization "${spec}" ` +
              `(expected one of ${VALID_SPECIALIZATIONS.join(', ')})`
          );
        }
      });
      const dupes = value.filter((s, idx) => value.indexOf(s) !== idx);
      if (dupes.length > 0) {
        problems.push(`${label}: "${key}" repeats ${[...new Set(dupes)].join(', ')}`);
      }
    });

    // A specialization can't have a course be both required and elective.
    if (Array.isArray(m.specCompulsory) && Array.isArray(m.specOptional)) {
      const overlap = m.specCompulsory.filter((s) => m.specOptional.includes(s));
      if (overlap.length > 0) {
        problems.push(
          `${label}: ${overlap.join(', ')} listed in both "specCompulsory" and "specOptional"`
        );
      }
    }

    // A course in neither group silently becomes optional for every spec.
    const isMitYear3 = m.y === 3 && (m.pathway === 'mit' || m.pathway === 'both');
    if (isMitYear3 && !m.specCompulsory && !m.specOptional) {
      problems.push(
        `${label}: Year 3 ${m.pathway} course has neither "specCompulsory" nor "specOptional" — ` +
          `it will be treated as optional for every MIT specialization`
      );
    }

    // Only specCompulsory drives classification, so require every
    // specialization to appear in one group or the other.
    if (isMitYear3 && (m.specCompulsory || m.specOptional)) {
      const compulsory = m.specCompulsory ?? [];
      const optional = m.specOptional ?? [];
      const unclassified = VALID_SPECIALIZATIONS.filter(
        (s) => !compulsory.includes(s) && !optional.includes(s)
      );
      if (unclassified.length > 0) {
        problems.push(
          `${label}: ${unclassified.join(', ')} appear in neither "specCompulsory" nor ` +
            `"specOptional" — the course defaults to an elective for them, which may be unintended`
        );
      }
    }
  });

  // A pass/fail course that counts toward GPA turns the CGPA into NaN,
  // since gradeMap has no price for "Pass".
  if (gradeMap) {
    modules.forEach((m) => {
      if (m?.gradeType === 'passfail' && !m.nonGpa && !('Pass' in gradeMap)) {
        problems.push(
          `"${m.code}": counts toward GPA but is graded pass/fail, and gradeMap has no ` +
            `"Pass" entry — its grade would evaluate to NaN and poison the CGPA`
        );
      }
    });
  }

  return problems;
}
