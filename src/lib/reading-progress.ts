import { ReadingSection } from "@/types/reading";

export interface SavedReadingProgress {
  activeIndex: number;
  activeSectionId?: string;
  counts: number[];
  sectionCounts?: Record<string, number>;
  updatedAt?: string;
}

/**
 * Safely parses and validates arbitrary progress data (from localStorage or Supabase).
 * Supports both section ID mapping (`sectionCounts`, `activeSectionId`) and legacy array index mapping.
 */
export function parseProgressData(
  data: unknown,
  sections: ReadingSection[] | number
): SavedReadingProgress | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const sectionsList: ReadingSection[] = Array.isArray(sections) ? sections : [];
  const sectionsCount: number = Array.isArray(sections) ? sections.length : sections;

  if (sectionsCount <= 0) return null;

  const savedIndex = obj.activeIndex;
  const savedSectionId =
    typeof obj.activeSectionId === "string" && obj.activeSectionId.trim().length > 0
      ? obj.activeSectionId.trim()
      : undefined;

  const savedCounts = obj.counts;
  const savedSectionCounts =
    obj.sectionCounts && typeof obj.sectionCounts === "object"
      ? (obj.sectionCounts as Record<string, unknown>)
      : null;
  const updatedAt = typeof obj.updatedAt === "string" ? obj.updatedAt : undefined;

  // Determine activeIndex based on activeSectionId lookup or fallback to savedIndex
  let validIndex = 0;
  let resolvedSectionId: string | undefined = savedSectionId;

  if (savedSectionId && sectionsList.length > 0) {
    const foundIdx = sectionsList.findIndex((sec) => sec.id === savedSectionId);
    if (foundIdx !== -1) {
      validIndex = foundIdx;
    } else {
      // Saved section ID was removed or reordered out of scope: fallback to savedIndex if valid
      if (
        typeof savedIndex === "number" &&
        Number.isInteger(savedIndex) &&
        savedIndex >= 0 &&
        savedIndex < sectionsCount
      ) {
        validIndex = savedIndex;
        resolvedSectionId = sectionsList[savedIndex]?.id;
      } else {
        validIndex = 0;
        resolvedSectionId = sectionsList[0]?.id;
      }
    }
  } else if (
    typeof savedIndex === "number" &&
    Number.isInteger(savedIndex) &&
    savedIndex >= 0 &&
    savedIndex < sectionsCount
  ) {
    validIndex = savedIndex;
    resolvedSectionId = sectionsList[savedIndex]?.id;
  }

  const validCounts = new Array(sectionsCount).fill(0);
  const normalizedSectionCounts: Record<string, number> = {};

  if (savedSectionCounts && sectionsList.length > 0) {
    // Prefer section ID mapping for section reordering & editing safety
    sectionsList.forEach((sec, idx) => {
      const val = savedSectionCounts[sec.id];
      if (typeof val === "number" && !isNaN(val)) {
        validCounts[idx] = val;
        normalizedSectionCounts[sec.id] = val;
      } else if (Array.isArray(savedCounts) && typeof savedCounts[idx] === "number" && !isNaN(savedCounts[idx])) {
        // Fallback to array index if specific section id missing
        validCounts[idx] = savedCounts[idx];
        normalizedSectionCounts[sec.id] = savedCounts[idx];
      }
    });
  } else if (Array.isArray(savedCounts)) {
    // Fallback for legacy progress saved as counts array
    for (let i = 0; i < sectionsCount; i++) {
      if (typeof savedCounts[i] === "number" && !isNaN(savedCounts[i])) {
        validCounts[i] = savedCounts[i];
        if (sectionsList[i]?.id) {
          normalizedSectionCounts[sectionsList[i].id] = savedCounts[i];
        }
      }
    }
  }

  const hasSectionCounts = Object.keys(normalizedSectionCounts).length > 0;

  return {
    activeIndex: validIndex,
    ...(resolvedSectionId ? { activeSectionId: resolvedSectionId } : {}),
    counts: validCounts,
    ...(hasSectionCounts ? { sectionCounts: normalizedSectionCounts } : {}),
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
    const localTime = localProgress.updatedAt ? new Date(localProgress.updatedAt).getTime() : 0;
    const serverTime = serverProgress.updatedAt ? new Date(serverProgress.updatedAt).getTime() : 0;

    if (!isNaN(serverTime) && serverTime > (isNaN(localTime) ? 0 : localTime)) {
      return serverProgress;
    }

    return localProgress;
  }

  return null;
}
