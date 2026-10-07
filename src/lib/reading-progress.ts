export interface SavedReadingProgress {
  activeIndex: number;
  counts: number[];
  updatedAt?: string;
}

/**
 * Safely parses and validates arbitrary progress data (from localStorage or Supabase).
 */
export function parseProgressData(
  data: unknown,
  sectionsCount: number
): SavedReadingProgress | null {
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  const savedIndex = obj.activeIndex;
  const savedCounts = obj.counts;
  const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined;

  let validIndex = 0;
  if (
    typeof savedIndex === 'number' &&
    Number.isInteger(savedIndex) &&
    savedIndex >= 0 &&
    savedIndex < sectionsCount
  ) {
    validIndex = savedIndex;
  }

  const validCounts = new Array(sectionsCount).fill(0);
  if (Array.isArray(savedCounts)) {
    for (let i = 0; i < sectionsCount; i++) {
      if (typeof savedCounts[i] === 'number' && !isNaN(savedCounts[i])) {
        validCounts[i] = savedCounts[i];
      }
    }
  }

  return {
    activeIndex: validIndex,
    counts: validCounts,
    updatedAt,
  };
}

/**
 * Resolves which reading progress to use during initial hydration:
 * - localStorage remains primary source for fast restore;
 * - if server progress has a strictly newer timestamp, use server progress;
 * - if localStorage is not present, use server progress if available.
 */
export function resolveReadingProgress(
  localProgress: SavedReadingProgress | null,
  serverProgress: SavedReadingProgress | null
): SavedReadingProgress | null {
  if (!localProgress && !serverProgress) {
    return null;
  }

  if (localProgress && !serverProgress) {
    return localProgress;
  }

  if (!localProgress && serverProgress) {
    return serverProgress;
  }

  // Both localProgress and serverProgress exist
  if (localProgress && serverProgress) {
    const localTime = localProgress.updatedAt
      ? new Date(localProgress.updatedAt).getTime()
      : 0;
    const serverTime = serverProgress.updatedAt
      ? new Date(serverProgress.updatedAt).getTime()
      : 0;

    if (!isNaN(serverTime) && serverTime > (isNaN(localTime) ? 0 : localTime)) {
      return serverProgress;
    }

    return localProgress;
  }

  return null;
}
