import { ReadingSection } from "@/types/reading";
import { getJakartaDateComponents } from "@/lib/date-utils";

export interface SavedReadingProgress {
  activeIndex: number;
  activeSectionId?: string;
  counts: number[];
  sectionCounts?: Record<string, number>;
  updatedAt?: string;
  dateKey?: string;
}

/**
 * Safely parses and validates arbitrary progress data (from localStorage or Supabase).
 * Supports both section ID mapping (`sectionCounts`, `activeSectionId`) and legacy array index mapping.
 * Optionally validates that the progress belongs to `currentDateKey` (Asia/Jakarta timezone).
 */
export function parseProgressData(
  data: unknown,
  sections: ReadingSection[] | number,
  currentDateKey?: string
): SavedReadingProgress | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const sectionsList: ReadingSection[] = Array.isArray(sections) ? sections : [];
  const sectionsCount: number = Array.isArray(sections) ? sections.length : sections;

  if (sectionsCount <= 0) return null;

  const updatedAt = typeof obj.updatedAt === "string" ? obj.updatedAt : undefined;

  let progressDateKey =
    typeof obj.dateKey === "string" && obj.dateKey.trim().length > 0
      ? obj.dateKey.trim()
      : undefined;

  if (!progressDateKey && updatedAt) {
    try {
      progressDateKey = getJakartaDateComponents(updatedAt).isoDateKey;
    } catch {
      // Ignore date parsing error
    }
  }

  // If currentDateKey is specified and progress belongs to a different WIB date, discard it
  if (currentDateKey && progressDateKey && progressDateKey !== currentDateKey) {
    return null;
  }

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
    ...(progressDateKey ? { dateKey: progressDateKey } : {}),
  };
}

/**
 * Resolves which reading progress to use during initial hydration:
 * - localStorage remains primary source for fast restore;
 * - if server progress has a strictly newer timestamp, use server progress;
 * - if localStorage is not present, use server progress if available.
 * Option to filter by currentDateKey (Asia/Jakarta timezone).
 */
export function resolveReadingProgress(
  localProgress: SavedReadingProgress | null,
  serverProgress: SavedReadingProgress | null,
  currentDateKey?: string
): SavedReadingProgress | null {
  const effectiveLocal =
    localProgress && currentDateKey && localProgress.dateKey && localProgress.dateKey !== currentDateKey
      ? null
      : localProgress;

  const effectiveServer =
    serverProgress && currentDateKey && serverProgress.dateKey && serverProgress.dateKey !== currentDateKey
      ? null
      : serverProgress;

  if (!effectiveLocal && !effectiveServer) {
    return null;
  }

  if (effectiveLocal && !effectiveServer) {
    return effectiveLocal;
  }

  if (!effectiveLocal && effectiveServer) {
    return effectiveServer;
  }

  // Both localProgress and serverProgress exist
  if (effectiveLocal && effectiveServer) {
    const localTime = effectiveLocal.updatedAt ? new Date(effectiveLocal.updatedAt).getTime() : 0;
    const serverTime = effectiveServer.updatedAt ? new Date(effectiveServer.updatedAt).getTime() : 0;

    if (!isNaN(serverTime) && serverTime > (isNaN(localTime) ? 0 : localTime)) {
      return effectiveServer;
    }

    return effectiveLocal;
  }

  return null;
}
