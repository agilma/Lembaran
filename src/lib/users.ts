import bcrypt from "bcryptjs";
import { Role, User } from "@/types/user";

/**
 * Returns the Administrator user if configured via environment variables.
 * Requires both ADMIN_EMAIL and ADMIN_PASSWORD_HASH to be defined and non-empty.
 */
export function getAdminUser(): User | null {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!adminEmail || !adminPasswordHash) {
    return null;
  }

  return {
    id: "admin-user",
    email: adminEmail.toLowerCase(),
    name: process.env.ADMIN_NAME?.trim() || "Administrator",
    role: Role.ADMIN,
    passwordHash: adminPasswordHash,
  };
}

export function findUserByEmail(email: string): User | undefined {
  const admin = getAdminUser();
  if (admin && admin.email === email.trim().toLowerCase()) {
    return admin;
  }
  return undefined;
}

export function findUserById(id: string): User | undefined {
  const admin = getAdminUser();
  if (admin && admin.id === id) {
    return admin;
  }
  return undefined;
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword?: string
): Promise<boolean> {
  if (!hashedPassword) return false;
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    console.error("Error verifying password hash:", err);
    return false;
  }
}
