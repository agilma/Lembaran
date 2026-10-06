import { createClient } from "@/lib/supabase/server";
import { Role, User } from "@/types/user";

const ROLE_RANK: Record<Role, number> = {
  [Role.VIEWER]: 1,
  [Role.EDITOR]: 2,
  [Role.ADMIN]: 3,
};

export function parseRole(roleStr: unknown): Role {
  if (typeof roleStr === "string") {
    const normalized = roleStr.toUpperCase();
    if (normalized === Role.ADMIN) return Role.ADMIN;
    if (normalized === Role.EDITOR) return Role.EDITOR;
    if (normalized === Role.VIEWER) return Role.VIEWER;
  }
  return Role.VIEWER;
}

export async function getCurrentSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const role = parseRole(user.app_metadata?.role);
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "";

    return {
      id: user.id,
      email: user.email || "",
      name,
      role,
    };
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED: Akses ditolak. Silakan login terlebih dahulu.");
  }
  return user;
}

export async function hasRole(requiredRole: Role): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }
  const userRank = ROLE_RANK[user.role] || 0;
  const requiredRank = ROLE_RANK[requiredRole] || 0;
  return userRank >= requiredRank;
}

export async function requireRole(requiredRole: Role): Promise<User> {
  const user = await requireAuth();
  const userRank = ROLE_RANK[user.role] || 0;
  const requiredRank = ROLE_RANK[requiredRole] || 0;

  if (userRank < requiredRank) {
    throw new Error(
      `UNAUTHORIZED: Akses ditolak. Peran minimal '${requiredRole}' diperlukan, Anda adalah '${user.role}'.`
    );
  }

  return user;
}
