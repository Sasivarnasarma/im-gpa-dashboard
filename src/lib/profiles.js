const CONTAINER_VERSION = 1;

export const EMPTY_CONTAINER = { version: CONTAINER_VERSION, activeId: null, profiles: [] };

const now = () => Date.now();

// Short, collision-resistant enough for a handful of profiles on one device.
const newId = () => `p_${Math.random().toString(36).slice(2, 9)}`;

// A new profile, empty apart from its name and the default target.
export function createProfile(name) {
  const stamp = now();
  return {
    id: newId(),
    name: (name ?? '').trim() || 'Student',
    pathway: null,
    specialization: 'undecided',
    grades: {},
    targetGpa: '3.70',
    createdAt: stamp,
    updatedAt: stamp,
  };
}

// Recovers the container from stored JSON, discarding anything malformed.
export function parseContainer(raw) {
  if (!raw) return EMPTY_CONTAINER;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_CONTAINER;
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.profiles)) {
    return EMPTY_CONTAINER;
  }

  // Keep only entries that carry the fields the app reads.
  const profiles = parsed.profiles.filter(
    (p) => p && typeof p.id === 'string' && typeof p.name === 'string'
  );
  if (profiles.length === 0) return EMPTY_CONTAINER;

  const activeId = profiles.some((p) => p.id === parsed.activeId)
    ? parsed.activeId
    : profiles[0].id;

  return { version: CONTAINER_VERSION, activeId, profiles };
}

// The profile in use, or null before one exists.
export function getActiveProfile(container) {
  return container.profiles.find((p) => p.id === container.activeId) ?? null;
}

// Adds a profile and makes it the one in use.
export function addProfile(container, name) {
  const profile = createProfile(name);
  return {
    ...container,
    activeId: profile.id, // a new profile becomes the one being used
    profiles: [...container.profiles, profile],
  };
}

// Switches to a profile, ignoring an id that no longer exists.
export function switchProfile(container, id) {
  if (!container.profiles.some((p) => p.id === id)) return container;
  return { ...container, activeId: id };
}

// Renames a profile, refusing a blank name.
export function renameProfile(container, id, name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return container;
  return {
    ...container,
    profiles: container.profiles.map((p) =>
      p.id === id ? { ...p, name: trimmed, updatedAt: now() } : p
    ),
  };
}

// Removes a profile. The last one leaves an empty container, back to first run.
export function removeProfile(container, id) {
  const profiles = container.profiles.filter((p) => p.id !== id);
  if (profiles.length === 0) return EMPTY_CONTAINER;

  const activeId = container.activeId === id ? profiles[0].id : container.activeId;
  return { ...container, activeId, profiles };
}

// Merges a patch into the active profile — grades, pathway, target.
export function updateActive(container, patch) {
  if (!container.activeId) return container;
  return {
    ...container,
    profiles: container.profiles.map((p) =>
      p.id === container.activeId ? { ...p, ...patch, updatedAt: now() } : p
    ),
  };
}
