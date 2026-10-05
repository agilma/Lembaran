import { auth } from "@/auth";
import { Role } from "@/types/user";

const ROLE_RANK: Record<Role, number> = {
  [Role.VIEWER]: 1,
  [Role.EDITOR]: 2,
  [Role.ADMIN]: 3,
};

/**
 * Sanitizes a callback URL to ensure it is a relative path starting with `/`
 * and prevents open redirects or protocol/backslash bypasses.
 *
 * @param url The input callback URL to sanitize
 * @param fallback The fallback URL if input is invalid (defaults to "/")
 */
export function sanitizeCallbackUrl(url?: string | null, fallback = "/"): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  const trimmed = url.trim();

  if (!trimmed.startsWith("/")) {
    return fallback;
  }

  // Reject protocol-relative URLs (e.g., //evil.com)
  if (trimmed.startsWith("//")) {
    return fallback;
  }

  // Reject backslash bypasses (e.g., /\evil.com or /\/evil.com)
  if (trimmed.startsWith("/\\") || trimmed.includes("\\")) {
    return fallback;
  }

  // Reject pseudo-protocols or schemes that might pass startsWith("/") in weird contexts
  // e.g., control characters or URI schemes
  if (/^[\/\\]{2,}/.test(trimmed)) {
    return fallback;
  }

  // Ensure it's a valid relative path by attempting parsing with a dummy base
  try {
    const dummyBase = "http://localhost:3000";
    const parsed = new URL(trimmed, dummyBase);

    if (parsed.origin !== dummyBase) {
      return fallback;
    }

    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

export async function getCurrentSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED: Akses ditolak. Silakan login terlebih dahulu.");
  }
  return user;
}

export async function hasRole(requiredRole: Role): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.role) {
    return false;
  }
  const userRank = ROLE_RANK[user.role as Role] || 0;
  const requiredRank = ROLE_RANK[requiredRole] || 0;
  return userRank >= requiredRank;
}

export async function requireRole(requiredRole: Role) {
  const user = await requireAuth();
  const userRank = ROLE_RANK[user.role as Role] || 0;
  const requiredRank = ROLE_RANK[requiredRole] || 0;

  if (userRank < requiredRank) {
    throw new Error(
      `UNAUTHORIZED: Akses ditolak. Peran minimal '${requiredRole}' diperlukan, Anda adalah '${user.role}'.`
    );
  }

  return user;
}
