"use server";

import { getCurrentUser } from "@/lib/auth-utils";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { readingsData } from "@/data/readings";
import { formatInJakartaTimezone } from "@/lib/date-utils";

export interface RecordCompletionParams {
  readingSlug: string;
  count?: number | null;
  target?: number | null;
}

export interface RecordCompletionResult {
  success: boolean;
  message: string;
  savedLocallyOrUnauthenticated?: boolean;
}

export interface ReadingProgressData {
  activeIndex: number;
  counts: number[];
  updatedAt?: string;
}

export interface GetProgressResult {
  success: boolean;
  data: ReadingProgressData | null;
  message?: string;
}

export interface SaveProgressParams {
  readingSlug: string;
  activeIndex: number;
  counts: number[];
}

export interface SaveProgressResult {
  success: boolean;
  message: string;
  savedLocallyOrUnauthenticated?: boolean;
}

export interface CompletionRecordItem {
  id: string;
  readingSlug: string;
  readingTitle: string;
  count: number | null;
  target: number | null;
  completedAt: string;
  formattedDate: string;
  formattedTime: string;
  fullFormatted: string;
  isoDateKey: string;
}

export interface ReadingSummaryItem {
  readingSlug: string;
  readingTitle: string;
  totalCompletions: number;
}

export interface DateSummaryItem {
  isoDateKey: string;
  dateString: string;
  totalCompletions: number;
}

export interface GetReadingHistoryResult {
  success: boolean;
  completions: CompletionRecordItem[];
  summaries: ReadingSummaryItem[];
  dateSummaries: DateSummaryItem[];
  message?: string;
}

export async function recordReadingCompletion(
  params: RecordCompletionParams
): Promise<RecordCompletionResult> {
  try {
    const user = await getCurrentUser();

    // If user is guest/unauthenticated, do not persist to Supabase but return graceful response
    if (!user) {
      return {
        success: true,
        message: "Reading completed as guest (unauthenticated).",
        savedLocallyOrUnauthenticated: true,
      };
    }

    const supabase = getSupabaseServerClient();

    // If Supabase credentials are not configured, log gracefully without throwing
    if (!supabase) {
      console.warn("Supabase credentials not configured. Skipping server persistence.");
      return {
        success: true,
        message: "Supabase persistence not configured.",
        savedLocallyOrUnauthenticated: true,
      };
    }

    const completedAt = new Date().toISOString();

    const { error } = await supabase.from("reading_completions").insert({
      user_id: user.id, // Strictly taken from NextAuth session on server
      reading_slug: params.readingSlug,
      count: params.count ?? null,
      target: params.target ?? null,
      completed_at: completedAt,
    });

    if (error) {
      console.error("Failed to insert reading completion to Supabase:", error);
      return {
        success: false,
        message: "Gagal menyimpan riwayat ke database.",
      };
    }

    return {
      success: true,
      message: "Berhasil menyimpan riwayat penyelesaian bacaan.",
    };
  } catch (err: unknown) {
    console.error("Error in recordReadingCompletion server action:", err);
    return {
      success: false,
      message: "Terjadi kesalahan saat menyimpan riwayat bacaan.",
    };
  }
}

export async function getReadingProgress(
  readingSlug: string
): Promise<GetProgressResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: true, data: null, message: "Unauthenticated user" };
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return { success: true, data: null, message: "Supabase persistence not configured" };
    }

    const { data, error } = await supabase
      .from("reading_progress")
      .select("active_index, counts, updated_at")
      .eq("user_id", user.id)
      .eq("reading_slug", readingSlug)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch reading progress from Supabase:", error);
      return { success: false, data: null, message: "Error loading reading progress" };
    }

    if (!data) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        activeIndex: data.active_index,
        counts: Array.isArray(data.counts) ? data.counts : [],
        updatedAt: data.updated_at,
      },
    };
  } catch (err: unknown) {
    console.error("Error in getReadingProgress server action:", err);
    return { success: false, data: null, message: "Unexpected server error" };
  }
}

export async function saveReadingProgress(
  params: SaveProgressParams
): Promise<SaveProgressResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: true,
        message: "User is guest/unauthenticated",
        savedLocallyOrUnauthenticated: true,
      };
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return {
        success: true,
        message: "Supabase not configured",
        savedLocallyOrUnauthenticated: true,
      };
    }

    const updatedAt = new Date().toISOString();

    const { error } = await supabase.from("reading_progress").upsert(
      {
        user_id: user.id,
        reading_slug: params.readingSlug,
        active_index: params.activeIndex,
        counts: params.counts,
        updated_at: updatedAt,
      },
      { onConflict: "user_id,reading_slug" }
    );

    if (error) {
      console.error("Failed to save reading progress to Supabase:", error);
      return {
        success: false,
        message: "Gagal menyimpan progress ke database.",
      };
    }

    return {
      success: true,
      message: "Progress berhasil disimpan.",
    };
  } catch (err: unknown) {
    console.error("Error in saveReadingProgress server action:", err);
    return {
      success: false,
      message: "Terjadi kesalahan saat menyimpan progress.",
    };
  }
}

export async function deleteReadingProgress(
  readingSlug: string
): Promise<SaveProgressResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: true,
        message: "User is guest/unauthenticated",
        savedLocallyOrUnauthenticated: true,
      };
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return {
        success: true,
        message: "Supabase not configured",
        savedLocallyOrUnauthenticated: true,
      };
    }

    const { error } = await supabase
      .from("reading_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("reading_slug", readingSlug);

    if (error) {
      console.error("Failed to delete reading progress from Supabase:", error);
      return {
        success: false,
        message: "Gagal menghapus progress.",
      };
    }

    return {
      success: true,
      message: "Progress berhasil dihapus.",
    };
  } catch (err: unknown) {
    console.error("Error in deleteReadingProgress server action:", err);
    return {
      success: false,
      message: "Terjadi kesalahan saat menghapus progress.",
    };
  }
}

export async function getReadingHistory(): Promise<GetReadingHistoryResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: true,
        completions: [],
        summaries: [],
        dateSummaries: [],
        message: "Pengguna belum terautentikasi.",
      };
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return {
        success: true,
        completions: [],
        summaries: [],
        dateSummaries: [],
        message: "Supabase belum terkonfigurasi.",
      };
    }

    const { data, error } = await supabase
      .from("reading_completions")
      .select("id, reading_slug, count, target, completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch reading history from Supabase:", error);
      return {
        success: false,
        completions: [],
        summaries: [],
        dateSummaries: [],
        message: "Gagal memuat riwayat bacaan dari database.",
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        completions: [],
        summaries: [],
        dateSummaries: [],
      };
    }

    // Title map helper
    const titleMap = new Map<string, string>();
    readingsData.forEach((r) => titleMap.set(r.slug, r.title));

    const completions: CompletionRecordItem[] = data.map((item) => {
      const readingTitle = titleMap.get(item.reading_slug) || item.reading_slug;
      const formatted = formatInJakartaTimezone(item.completed_at);

      return {
        id: item.id,
        readingSlug: item.reading_slug,
        readingTitle,
        count: item.count,
        target: item.target,
        completedAt: item.completed_at,
        formattedDate: formatted.dateString,
        formattedTime: formatted.timeString,
        fullFormatted: formatted.fullFormatted,
        isoDateKey: formatted.isoDateKey,
      };
    });

    // Compute summary per reading
    const readingSummaryMap = new Map<string, { readingTitle: string; count: number }>();
    completions.forEach((c) => {
      const existing = readingSummaryMap.get(c.readingSlug);
      if (existing) {
        existing.count += 1;
      } else {
        readingSummaryMap.set(c.readingSlug, {
          readingTitle: c.readingTitle,
          count: 1,
        });
      }
    });

    const summaries: ReadingSummaryItem[] = Array.from(readingSummaryMap.entries()).map(
      ([slug, val]) => ({
        readingSlug: slug,
        readingTitle: val.readingTitle,
        totalCompletions: val.count,
      })
    );

    // Compute date summary (for Calendar / Date View readiness)
    const dateSummaryMap = new Map<string, { dateString: string; count: number }>();
    completions.forEach((c) => {
      const existing = dateSummaryMap.get(c.isoDateKey);
      if (existing) {
        existing.count += 1;
      } else {
        dateSummaryMap.set(c.isoDateKey, {
          dateString: c.formattedDate,
          count: 1,
        });
      }
    });

    const dateSummaries: DateSummaryItem[] = Array.from(dateSummaryMap.entries()).map(
      ([isoKey, val]) => ({
        isoDateKey: isoKey,
        dateString: val.dateString,
        totalCompletions: val.count,
      })
    );

    return {
      success: true,
      completions,
      summaries,
      dateSummaries,
    };
  } catch (err: unknown) {
    console.error("Error in getReadingHistory server action:", err);
    return {
      success: false,
      completions: [],
      summaries: [],
      dateSummaries: [],
      message: "Terjadi kesalahan server saat memuat riwayat.",
    };
  }
}
