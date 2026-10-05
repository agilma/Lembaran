import { auth } from "@/auth";
import { Role } from "@/types/user";

const ROLE_RANK: Record<Role, number> = {
  [Role.VIEWER]: 1,
  [Role.EDITOR]: 2,
  [Role.ADMIN]: 3,
};

/**
 * Sanitizes a callback URL to ensure it is a safe relative path within the application.
 * Rejects external URLs, protocol-relative URLs (`//`, `/\\`), scheme handlers (`javascript:`), and malformed paths.
 */
export function sanitizeCallbackUrl(url?: string | null, fallback = "/"): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return fallback;
  }

  // Must start with '/' and must NOT start with '//', '/\', etc.
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("/\t") ||
    trimmed.startsWith("/\n") ||
    trimmed.startsWith("/\r")
  ) {
    return fallback;
  }

  // Reject dangerous scheme handlers or protocol markers
  if (trimmed.includes("://") || /^(javascript|data|vbscript):/i.test(trimmed)) {
    return fallback;
  }

  try {
    const dummyBase = "http://localhost:3000";
    const parsed = new URL(trimmed, dummyBase);

    // Origin must match dummy base, proving it was parsed as a relative path
    if (parsed.origin !== dummyBase) {
      return fallback;
    }

    const pathname = parsed.pathname;
    if (
      !pathname.startsWith("/") ||
      pathname.startsWith("//") ||
      pathname.startsWith("/\\")
    ) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
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
