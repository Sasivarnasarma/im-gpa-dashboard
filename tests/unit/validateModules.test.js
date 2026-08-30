import { describe, it, expect } from 'vitest';
import { validateModules } from '../../src/lib/validateModules';
import { modules, gradeMap } from '../../src/data/modules';

// The headline assertion: the curriculum that actually ships must be valid.
// This is the test that will fail the day someone hand-edits modules.js and
// fat-fingers a specialization key or duplicates a course code.
describe('the real curriculum data', () => {
  it('passes schema validation', () => {
    expect(validateModules(modules, gradeMap)).toEqual([]);
  });

  it('prices every grade a student can select', () => {
    // Guards the NaN-poisoning path: an option in the UI with no gradeMap
    // entry makes gradeMap[grade] undefined, and one undefined turns the
    // entire weighted-points sum — and therefore the CGPA — into NaN.
    const gradedCodes = Object.keys(gradeMap).filter((g) => g !== '');
    gradedCodes.forEach((g) => {
      expect(typeof gradeMap[g], `gradeMap["${g}"]`).toBe('number');
      expect(Number.isFinite(gradeMap[g]), `gradeMap["${g}"]`).toBe(true);
    });
  });
});

const valid = () => ({
  code: 'TEST 1234',
  name: 'A Course',
  y: 1,
  s: 1,
  cr: 3,
});

describe('validateModules', () => {
  it('accepts a minimal well-formed module', () => {
    expect(validateModules([valid()])).toEqual([]);
  });

  it('flags a duplicated course code', () => {
    const problems = validateModules([valid(), valid()]);
    expect(problems.join('\n')).toMatch(/duplicate course code/i);
  });

  it('flags a missing or non-numeric credit value', () => {
    const problems = validateModules([{ ...valid(), cr: undefined }]);
    expect(problems.join('\n')).toMatch(/"cr" must be a non-negative number/i);
  });

  it('flags an out-of-range year or semester', () => {
    const problems = validateModules([{ ...valid(), y: 4, s: 3 }]);
    expect(problems.join('\n')).toMatch(/"y" must be one of/i);
    expect(problems.join('\n')).toMatch(/"s" must be one of/i);
  });

  it('flags an unknown pathway', () => {
    const problems = validateModules([{ ...valid(), pathway: 'msc' }]);
    expect(problems.join('\n')).toMatch(/"pathway" must be one of/i);
  });

  it('flags a misspelled specialization key — the silent mis-classification case', () => {
    const problems = validateModules([
      { ...valid(), y: 3, pathway: 'mit', specCompulsory: ['bse', 'oscmm'] },
    ]);
    expect(problems.join('\n')).toMatch(/unknown specialization "oscmm"/i);
  });

  it('flags a specialization listed as both compulsory and optional', () => {
    const problems = validateModules([
      { ...valid(), y: 3, pathway: 'mit', specCompulsory: ['bse'], specOptional: ['bse'] },
    ]);
    expect(problems.join('\n')).toMatch(/listed in both/i);
  });

  it('flags a Year 3 MIT course with no specialization grouping at all', () => {
    const problems = validateModules([{ ...valid(), y: 3, pathway: 'mit' }]);
    expect(problems.join('\n')).toMatch(/neither "specCompulsory" nor "specOptional"/i);
  });

  it('does not require specialization grouping on Year 3 IT courses', () => {
    expect(validateModules([{ ...valid(), y: 3, pathway: 'it' }])).toEqual([]);
  });

  it('flags a specialization left out of both groups on a Year 3 MIT course', () => {
    // Only specCompulsory drives runtime classification, so an omitted spec
    // silently becomes an elective — indistinguishable from a deliberate one.
    const problems = validateModules([
      { ...valid(), y: 3, pathway: 'mit', specCompulsory: ['bse'], specOptional: ['oscm'] },
    ]);
    expect(problems.join('\n')).toMatch(/is appear in neither|is.*neither "specCompulsory"/i);
  });

  it('accepts a Year 3 MIT course that classifies every specialization', () => {
    const problems = validateModules([
      { ...valid(), y: 3, pathway: 'mit', specCompulsory: ['bse'], specOptional: ['oscm', 'is'] },
    ]);
    expect(problems).toEqual([]);
  });

  it('flags a non-boolean nonGpa/optional flag', () => {
    const problems = validateModules([{ ...valid(), nonGpa: 'yes', optional: 1 }]);
    expect(problems.join('\n')).toMatch(/"nonGpa" must be a boolean/i);
    expect(problems.join('\n')).toMatch(/"optional" must be a boolean/i);
  });

  it('flags a GPA-counting pass/fail course the grade map cannot price', () => {
    // This is the NaN trap: pass/fail offers "Pass", gradeMap has no such
    // key, and without nonGpa the GPA loop multiplies undefined by credits.
    const problems = validateModules([{ ...valid(), gradeType: 'passfail' }], { 'A+': 4.0 });
    expect(problems.join('\n')).toMatch(/poison the CGPA/i);
  });

  it('allows an unpriced pass/fail course when it is excluded from GPA', () => {
    // How the real curriculum's GNCT courses are set up — the GPA loop skips
    // them entirely, so the missing "Pass" price is never consulted.
    const problems = validateModules([{ ...valid(), gradeType: 'passfail', nonGpa: true }], {
      'A+': 4.0,
    });
    expect(problems).toEqual([]);
  });
});
