import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please configure NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY environment variable. Server-side Supabase operations require SUPABASE_SECRET_KEY."
    );
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClientInstance;
}
