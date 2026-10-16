"use server";

import { Reading } from "@/types/reading";
import {
  ReadingActionResponse,
  getReadingsListInternal,
  getReadingBySlugInternal,
  getReadingByIdInternal,
  createReadingInternal,
  updateReadingInternal,
  deleteReadingInternal,
} from "@/lib/reading-management-service";
import { ReadingInputData } from "@/lib/reading-management-utils";

export type { ReadingInputData, ReadingActionResponse };

/* ============================================================================
 * PUBLIC SERVER ACTIONS (Clean production API contracts)
 * ============================================================================ */

export async function getReadingsList(
  includeArchived = false
): Promise<ReadingActionResponse<Reading[]>> {
  return getReadingsListInternal(includeArchived);
}

export async function getReadingBySlug(slug: string): Promise<Reading | null> {
  return getReadingBySlugInternal(slug);
}

export async function getReadingById(id: string): Promise<ReadingActionResponse<Reading>> {
  return getReadingByIdInternal(id);
}

export async function createReading(input: ReadingInputData): Promise<ReadingActionResponse<Reading>> {
  return createReadingInternal(input);
}

export async function updateReading(
  id: string,
  input: ReadingInputData
): Promise<ReadingActionResponse<Reading>> {
  return updateReadingInternal(id, input);
}

export async function deleteReading(id: string): Promise<ReadingActionResponse> {
  return deleteReadingInternal(id);
}
