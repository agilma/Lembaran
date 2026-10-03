import { auth } from "@/auth";
import { Role } from "@/types/user";

const ROLE_RANK: Record<Role, number> = {
  [Role.VIEWER]: 1,
  [Role.EDITOR]: 2,
  [Role.ADMIN]: 3,
};

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
