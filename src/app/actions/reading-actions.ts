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
