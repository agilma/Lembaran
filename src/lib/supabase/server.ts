import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Public stateless client for unauthenticated read-only operations (e.g. SSG / static page generation).
 * Does NOT access `cookies()` from `next/headers` to prevent runtime dynamic errors.
 */
let publicClientInstance: SupabaseClient | null = null;
let publicClientUrl: string | null = null;
let publicClientKey: string | null = null;

export function getSupabasePublicClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    publicClientInstance = null;
    publicClientUrl = null;
    publicClientKey = null;
    return null;
  }

  if (!publicClientInstance || publicClientUrl !== supabaseUrl || publicClientKey !== anonKey) {
    publicClientUrl = supabaseUrl;
    publicClientKey = anonKey;
    publicClientInstance = createSupabaseJsClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return publicClientInstance;
}

/**
 * Service role / secret client for server-only trusted administrative operations.
 * DO NOT expose to client or use to bypass RLS for standard user actions.
 */
let adminClientInstance: SupabaseClient | null = null;
let adminClientUrl: string | null = null;
let adminClientKey: string | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    adminClientInstance = null;
    adminClientUrl = null;
    adminClientKey = null;
    return null;
  }

  if (!adminClientInstance || adminClientUrl !== supabaseUrl || adminClientKey !== secretKey) {
    adminClientUrl = supabaseUrl;
    adminClientKey = secretKey;
    adminClientInstance = createSupabaseJsClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClientInstance;
}
