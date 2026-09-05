import { describe, it, expect } from 'vitest';
import {
  EMPTY_CONTAINER,
  addProfile,
  createProfile,
  duplicateProfile,
  getActiveProfile,
  parseContainer,
  removeProfile,
  renameProfile,
  switchProfile,
  updateActive,
} from '../../src/lib/profiles';

const withTwo = () => {
  let c = addProfile(EMPTY_CONTAINER, 'Amara');
  const first = c.activeId;
  c = updateActive(c, { grades: { 'MGTE 11243': 'A+' }, pathway: 'it' });
  c = addProfile(c, 'Kasun');
  const second = c.activeId;
  c = updateActive(c, { grades: { 'MGTE 11243': 'C' }, pathway: 'mit' });
  return { c, first, second };
};

describe('profile store', () => {
  it('starts empty so a first-time user is asked for a name', () => {
    expect(EMPTY_CONTAINER.profiles).toHaveLength(0);
    expect(getActiveProfile(EMPTY_CONTAINER)).toBeNull();
  });

  it('makes a newly added profile the active one', () => {
    const c = addProfile(EMPTY_CONTAINER, 'Amara');
    expect(getActiveProfile(c).name).toBe('Amara');
    expect(c.profiles).toHaveLength(1);
  });

  it('falls back to a placeholder when the name is blank', () => {
    expect(createProfile('   ').name).toBe('Student');
    expect(createProfile().name).toBe('Student');
  });

  it('keeps each profile’s grades separate across a switch', () => {
    // The failure the single-container design exists to prevent: switching
    // must not carry one profile's grades into another.
    const { c, first, second } = withTwo();

    expect(getActiveProfile(c).grades).toEqual({ 'MGTE 11243': 'C' });
    const back = switchProfile(c, first);
    expect(getActiveProfile(back).grades).toEqual({ 'MGTE 11243': 'A+' });
    expect(getActiveProfile(switchProfile(back, second)).grades).toEqual({ 'MGTE 11243': 'C' });
  });

  it('writes only to the active profile', () => {
    const { c, first } = withTwo();
    const edited = updateActive(c, { grades: { 'INTE 11213': 'B' } });

    expect(edited.profiles.find((p) => p.id === first).grades).toEqual({ 'MGTE 11243': 'A+' });
  });

  it('ignores a switch to an unknown profile rather than blanking the active one', () => {
    const { c } = withTwo();
    expect(switchProfile(c, 'p_nope')).toBe(c);
  });

  it('gives a duplicate its own grades object, not a shared reference', () => {
    // A shallow copy would alias `grades`, so editing the duplicate would
    // silently rewrite the profile it came from.
    const { c, first } = withTwo();
    const dup = duplicateProfile(c, first, 'Amara scenario');
    const edited = updateActive(dup, { grades: { ...getActiveProfile(dup).grades, X: 'E' } });

    expect(getActiveProfile(edited).grades).toEqual({ 'MGTE 11243': 'A+', X: 'E' });
    expect(edited.profiles.find((p) => p.id === first).grades).toEqual({ 'MGTE 11243': 'A+' });
  });

  it('carries pathway and target across a duplicate', () => {
    const { c, first } = withTwo();
    const dup = getActiveProfile(duplicateProfile(c, first));
    expect(dup.pathway).toBe('it');
    expect(dup.targetGpa).toBe('3.70');
  });

  it('hands the active slot to a neighbour when the active profile is removed', () => {
    const { c, first, second } = withTwo();
    const removed = removeProfile(c, second);

    expect(removed.activeId).toBe(first);
    expect(removed.profiles).toHaveLength(1);
  });

  it('empties the container when the last profile goes, returning to first-run', () => {
    const c = addProfile(EMPTY_CONTAINER, 'Solo');
    expect(removeProfile(c, c.activeId).profiles).toHaveLength(0);
  });

  it('renames without touching grades, and refuses a blank name', () => {
    const { c, first } = withTwo();
    const renamed = renameProfile(c, first, '  Amara P.  ');

    expect(renamed.profiles.find((p) => p.id === first).name).toBe('Amara P.');
    expect(renamed.profiles.find((p) => p.id === first).grades).toEqual({ 'MGTE 11243': 'A+' });
    expect(renameProfile(c, first, '   ')).toBe(c);
  });
});

describe('parseContainer', () => {
  it('round-trips a stored container', () => {
    const { c } = withTwo();
    const parsed = parseContainer(JSON.stringify(c));

    expect(parsed.profiles).toHaveLength(2);
    expect(parsed.activeId).toBe(c.activeId);
  });

  it('recovers from absent or corrupted storage instead of throwing', () => {
    expect(parseContainer(null)).toEqual(EMPTY_CONTAINER);
    expect(parseContainer('{ not json')).toEqual(EMPTY_CONTAINER);
    expect(parseContainer('{"profiles":"nope"}')).toEqual(EMPTY_CONTAINER);
  });

  it('repairs an activeId that points at nothing', () => {
    const { c } = withTwo();
    const parsed = parseContainer(JSON.stringify({ ...c, activeId: 'p_gone' }));

    expect(parsed.activeId).toBe(parsed.profiles[0].id);
  });

  it('drops malformed profile entries', () => {
    const parsed = parseContainer(
      JSON.stringify({ activeId: 'a', profiles: [{ id: 'a', name: 'Real' }, null, { id: 5 }] })
    );

    expect(parsed.profiles).toHaveLength(1);
    expect(parsed.profiles[0].name).toBe('Real');
  });
});
