import bcrypt from "bcryptjs";
import { Role, User } from "@/types/user";

/**
 * Returns the Administrator user if configured via legacy environment variables.
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

/**
 * Returns all configured users from environment variables.
 * Parses USERS_CONFIG or USERS_LIST (JSON array) if defined,
 * and includes the legacy ADMIN user if configured via ADMIN_EMAIL.
 */
export function getConfiguredUsers(): User[] {
  const users: User[] = [];

  const usersJson =
    process.env.USERS_CONFIG?.trim() || process.env.USERS_LIST?.trim();

  if (usersJson) {
    try {
      const parsed = JSON.parse(usersJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((raw, idx) => {
          if (
            raw &&
            typeof raw === "object" &&
            typeof raw.email === "string" &&
            typeof raw.passwordHash === "string"
          ) {
            const email = raw.email.trim().toLowerCase();
            if (email) {
              const role = Object.values(Role).includes(raw.role as Role)
                ? (raw.role as Role)
                : Role.VIEWER;

              users.push({
                id: String(raw.id || `user-${idx + 1}`),
                email,
                name: String(
                  raw.name || raw.email.split("@")[0] || "Pengguna"
                ),
                role,
                passwordHash: String(raw.passwordHash),
              });
            }
          }
        });
      }
    } catch (err) {
      console.error("Failed to parse USERS_CONFIG environment variable:", err);
    }
  }

  const admin = getAdminUser();
  if (admin) {
    const exists = users.some(
      (u) => u.email === admin.email || u.id === admin.id
    );
    if (!exists) {
      users.push(admin);
    }
  }

  return users;
}

export function findUserByEmail(email: string): User | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return getConfiguredUsers().find((u) => u.email === normalized);
}

export function findUserById(id: string): User | undefined {
  if (!id) return undefined;
  return getConfiguredUsers().find((u) => u.id === id);
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
