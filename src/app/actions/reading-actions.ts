"use server";

import { getCurrentUser } from "@/lib/auth-utils";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
