import bcrypt from "bcryptjs";
import { Role, User } from "@/types/user";

/**
 * Parses user accounts from the USERS_CONFIG (or USERS_LIST) environment variable,
 * falling back to legacy single-admin environment variables (ADMIN_EMAIL, ADMIN_PASSWORD_HASH).
 */
export function getUsersFromEnv(): User[] {
  const users: User[] = [];

  const usersConfigStr = process.env.USERS_CONFIG?.trim() || process.env.USERS_LIST?.trim();
  if (usersConfigStr) {
    try {
      const parsed = JSON.parse(usersConfigStr);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object" && item.email && item.id) {
            users.push({
              id: String(item.id),
              email: String(item.email).trim().toLowerCase(),
              name: item.name ? String(item.name) : String(item.email),
              role: (item.role as Role) || Role.VIEWER,
              passwordHash: item.passwordHash ? String(item.passwordHash) : undefined,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error parsing USERS_CONFIG environment variable:", err);
    }
  }

  // Backward compatibility with legacy ADMIN_EMAIL & ADMIN_PASSWORD_HASH
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (adminEmail && adminPasswordHash) {
    const adminEmailLower = adminEmail.toLowerCase();
    const alreadyExists = users.some(
      (u) => u.email === adminEmailLower || u.id === "admin-user"
    );
    if (!alreadyExists) {
      users.push({
        id: "admin-user",
        email: adminEmailLower,
        name: process.env.ADMIN_NAME?.trim() || "Administrator",
        role: Role.ADMIN,
        passwordHash: adminPasswordHash,
      });
    }
  }

  return users;
}

/**
 * Returns the Administrator user if configured via legacy environment variables or USERS_CONFIG.
 */
export function getAdminUser(): User | null {
  const users = getUsersFromEnv();
  const admin = users.find((u) => u.role === Role.ADMIN);
  if (admin) return admin;

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
  if (!email) return undefined;
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsersFromEnv();
  return users.find((u) => u.email === normalizedEmail);
}

export function findUserById(id: string): User | undefined {
  if (!id) return undefined;
  const users = getUsersFromEnv();
  return users.find((u) => u.id === id);
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
