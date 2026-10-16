"use server";

import { requireRole, getCurrentUser } from "@/lib/auth-utils";
import { createClient, getSupabaseAdminClient } from "@/lib/supabase/server";
import { Role } from "@/types/user";
import { Reading } from "@/types/reading";
import { readingsData } from "@/data/readings";
import {
  validateAndNormalizeReadingInput,
  ReadingInputData,
} from "@/lib/reading-management-utils";

export type { ReadingInputData };

export interface ReadingActionResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  isSoftDelete?: boolean;
  isStaticFallback?: boolean;
}

/**
 * Maps database row to Reading type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToReading(row: any): Reading {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    category: row.category || "",
    estimatedTime: row.estimated_time || undefined,
    content: row.content || undefined,
    sections: Array.isArray(row.sections) ? row.sections : undefined,
    isArchived: Boolean(row.is_archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all readings (for management or public listing)
 */
export async function getReadingsList(
  includeArchived = false
): Promise<ReadingActionResponse<Reading[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Fallback to static readings if Supabase credentials are not configured in environment
      const staticReadings = readingsData.map((r) => ({ ...r, isArchived: false }));
      return {
        success: true,
        message: "Supabase belum terkonfigurasi. Memuat data bawaan.",
        data: staticReadings,
        isStaticFallback: true,
      };
    }

    const adminClient = getSupabaseAdminClient();

    // Check total row count in DB table strictly using adminClient (bypassing session RLS)
    if (adminClient) {
      const { count, error: countErr } = await adminClient
        .from("readings")
        .select("id", { count: "exact", head: true });

      if (!countErr && count === 0) {
        // DB table is confirmed completely empty (0 total rows)
        const staticReadings = readingsData.map((r) => ({ ...r, isArchived: false }));
        return {
          success: true,
          message: "Database belum memiliki data. Memuat data bawaan.",
          data: staticReadings,
          isStaticFallback: true,
        };
      }
    }

    // Query active or all readings
    const supabase = (includeArchived && adminClient) ? adminClient : await createClient();

    let query = supabase.from("readings").select("*").order("created_at", { ascending: true });

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching readings from Supabase database:", error);
      return {
        success: false,
        message: `Gagal memuat data dari database: ${error.message}`,
        data: [],
      };
    }

    const readings = (data || []).map(mapRowToReading);
    return { success: true, message: "Berhasil memuat daftar bacaan dari database.", data: readings };
  } catch (err: unknown) {
    console.error("Error in getReadingsList action:", err);
    const msg = err instanceof Error ? err.message : "Gagal memuat bacaan dari database.";
    return { success: false, message: msg, data: [] };
  }
}

/**
 * Get single reading by slug (for public reading page)
 */
export async function getReadingBySlug(slug: string): Promise<Reading | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return readingsData.find((r) => r.slug === slug) || null;
    }

    const adminClient = getSupabaseAdminClient();
    const supabase = adminClient || (await createClient());

    const { data, error } = await supabase
      .from("readings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Error fetching reading by slug:", error);
      return null;
    }

    if (data) {
      const mapped = mapRowToReading(data);
      // If found in database (whether active or archived), return mapped reading.
      // If archived, mapped.isArchived is true and caller component triggers notFound()!
      return mapped;
    }

    // If reading was not found, check if DB table is confirmed completely empty (0 rows) using adminClient.
    if (adminClient) {
      const { count, error: countErr } = await adminClient
        .from("readings")
        .select("id", { count: "exact", head: true });

      if (!countErr && count === 0) {
        // Table is confirmed completely empty: fallback to static data
        const staticReading = readingsData.find((r) => r.slug === slug);
        return staticReading || null;
      }
    }

    // Database is configured and has readings (or adminClient is unavailable): slug is truly missing, archived, or deleted.
    // Return null (DO NOT revive archived/non-existent readings via static fallback)
    return null;
  } catch (err) {
    console.error("Error in getReadingBySlug action:", err);
    return null;
  }
}

/**
 * Get single reading by ID (for edit form in management UI)
 */
export async function getReadingById(id: string): Promise<ReadingActionResponse<Reading>> {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== Role.ADMIN && user.role !== Role.EDITOR)) {
      return { success: false, message: "UNAUTHORIZED: Akses ditolak." };
    }

    const adminClient = getSupabaseAdminClient();
    const supabase = adminClient || (await createClient());

    const { data, error } = await supabase.from("readings").select("*").eq("id", id).maybeSingle();

    if (error || !data) {
      return { success: false, message: "Bacaan tidak ditemukan." };
    }

    return { success: true, message: "Berhasil memuat detail bacaan.", data: mapRowToReading(data) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memuat detail bacaan.";
    return { success: false, message: msg };
  }
}

/**
 * Create a new reading (EDITOR or ADMIN only)
 */
export async function createReading(
  input: ReadingInputData
): Promise<ReadingActionResponse<Reading>> {
  try {
    // 1. Authorization check
    await requireRole(Role.EDITOR);

    // 2. Input validation
    const normalized = validateAndNormalizeReadingInput(input);

    const adminClient = getSupabaseAdminClient();
    const supabase = adminClient || (await createClient());

    // 3. Check slug uniqueness
    const { data: existing } = await supabase
      .from("readings")
      .select("id")
      .eq("slug", normalized.slug)
      .maybeSingle();

    if (existing) {
      return { success: false, message: `Slug '${normalized.slug}' sudah digunakan oleh bacaan lain.` };
    }

    // 4. Insert into database
    const { data, error } = await supabase
      .from("readings")
      .insert({
        slug: normalized.slug,
        title: normalized.title,
        description: normalized.description,
        category: normalized.category,
        estimated_time: normalized.estimatedTime || null,
        content: normalized.content || null,
        sections: normalized.sections || [],
        is_archived: false,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Failed to insert reading:", error);
      return { success: false, message: `Gagal menyimpan bacaan: ${error.message}` };
    }

    return {
      success: true,
      message: "Bacaan baru berhasil ditambahkan.",
      data: mapRowToReading(data),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menambah bacaan.";
    return { success: false, message: msg };
  }
}

/**
 * Update an existing reading (EDITOR or ADMIN only)
 */
export async function updateReading(
  id: string,
  input: ReadingInputData
): Promise<ReadingActionResponse<Reading>> {
  try {
    // 1. Authorization check
    await requireRole(Role.EDITOR);

    // 2. Input validation
    const normalized = validateAndNormalizeReadingInput(input);

    const adminClient = getSupabaseAdminClient();
    const supabase = adminClient || (await createClient());

    // 3. Check existing reading
    const { data: currentReading, error: fetchErr } = await supabase
      .from("readings")
      .select("id, slug")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !currentReading) {
      return { success: false, message: "Bacaan yang akan diubah tidak ditemukan." };
    }

    // 4. If slug changed, check uniqueness
    if (currentReading.slug !== normalized.slug) {
      const { data: slugCheck } = await supabase
        .from("readings")
        .select("id")
        .eq("slug", normalized.slug)
        .neq("id", id)
        .maybeSingle();

      if (slugCheck) {
        return { success: false, message: `Slug '${normalized.slug}' sudah digunakan oleh bacaan lain.` };
      }
    }

    // 5. Update database record
    const { data, error } = await supabase
      .from("readings")
      .update({
        slug: normalized.slug,
        title: normalized.title,
        description: normalized.description,
        category: normalized.category,
        estimated_time: normalized.estimatedTime || null,
        content: normalized.content || null,
        sections: normalized.sections || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update reading:", error);
      return { success: false, message: `Gagal memperbarui bacaan: ${error.message}` };
    }

    return {
      success: true,
      message: "Bacaan berhasil diperbarui.",
      data: mapRowToReading(data),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengedit bacaan.";
    return { success: false, message: msg };
  }
}

/**
 * Safe delete reading:
 * Strictly requires service-role admin client to check reading_completions and reading_progress across ALL users.
 * Aborts delete if admin client is unavailable or history check queries encounter errors.
 * Performs soft delete (is_archived = true) if reading has usage history.
 * Performs hard delete if and only if reading is confirmed to have no usage history across all users.
 */
export async function deleteReading(id: string): Promise<ReadingActionResponse> {
  try {
    // 1. Authorization check
    await requireRole(Role.EDITOR);

    const adminClient = getSupabaseAdminClient();
    if (!adminClient) {
      return {
        success: false,
        message: "Akses administratif database (SUPABASE_SECRET_KEY) tidak tersedia untuk memverifikasi riwayat seluruh pengguna. Penghapusan dibatalkan demi keamanan data.",
      };
    }

    // 2. Get reading details
    const { data: reading, error: fetchErr } = await adminClient
      .from("readings")
      .select("id, slug, title")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !reading) {
      return { success: false, message: "Bacaan tidak ditemukan." };
    }

    // 3. Query completion records across ALL users using admin client
    const { count: completionsCount, error: completionsErr } = await adminClient
      .from("reading_completions")
      .select("id", { count: "exact", head: true })
      .eq("reading_slug", reading.slug);

    if (completionsErr) {
      console.error("Error checking reading completions history during deletion:", completionsErr);
      return {
        success: false,
        message: "Gagal memverifikasi riwayat penyelesaian pengguna. Penghapusan dibatalkan demi keamanan data.",
      };
    }

    // 4. Query progress records across ALL users using admin client
    const { count: progressCount, error: progressErr } = await adminClient
      .from("reading_progress")
      .select("id", { count: "exact", head: true })
      .eq("reading_slug", reading.slug);

    if (progressErr) {
      console.error("Error checking reading progress history during deletion:", progressErr);
      return {
        success: false,
        message: "Gagal memverifikasi progress pengguna. Penghapusan dibatalkan demi keamanan data.",
      };
    }

    const hasUsageHistory = (completionsCount ?? 0) > 0 || (progressCount ?? 0) > 0;

    if (hasUsageHistory) {
      // Soft delete: Archive the reading to preserve user history and FK compatibility
      const { error: archiveError } = await adminClient
        .from("readings")
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (archiveError) {
        console.error("Failed to archive reading:", archiveError);
        return { success: false, message: `Gagal mengarsipkan bacaan: ${archiveError.message}` };
      }

      return {
        success: true,
        message: `Bacaan '${reading.title}' diarsipkan karena memiliki riwayat/progress pengguna.`,
        isSoftDelete: true,
      };
    } else {
      // Hard delete: Safe to remove from DB completely
      const { error: deleteError } = await adminClient.from("readings").delete().eq("id", id);

      if (deleteError) {
        console.error("Failed to delete reading:", deleteError);
        return { success: false, message: `Gagal menghapus bacaan: ${deleteError.message}` };
      }

      return {
        success: true,
        message: `Bacaan '${reading.title}' berhasil dihapus secara permanen.`,
        isSoftDelete: false,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus bacaan.";
    return { success: false, message: msg };
  }
}
