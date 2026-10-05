import bcrypt from "bcryptjs";
import { Role, User } from "@/types/user";

/**
 * Returns all configured users from USERS_CONFIG / USERS_LIST or ADMIN_EMAIL environment variables.
 */
export function getUsers(): User[] {
  const users: User[] = [];
  const seenEmails = new Set<string>();

  const configJson = (process.env.USERS_CONFIG || process.env.USERS_LIST)?.trim();
  if (configJson) {
    try {
      const parsed = JSON.parse(configJson);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            item &&
            typeof item === "object" &&
            typeof item.email === "string" &&
            item.email.trim()
          ) {
            const cleanEmail = item.email.trim().toLowerCase();
            if (!seenEmails.has(cleanEmail)) {
              seenEmails.add(cleanEmail);
              users.push({
                id:
                  typeof item.id === "string" && item.id.trim()
                    ? item.id.trim()
                    : `user-${users.length + 1}`,
                email: cleanEmail,
                name:
                  typeof item.name === "string" && item.name.trim()
                    ? item.name.trim()
                    : cleanEmail,
                role:
                  typeof item.role === "string" &&
                  Object.values(Role).includes(item.role as Role)
                    ? (item.role as Role)
                    : Role.VIEWER,
                passwordHash:
                  typeof item.passwordHash === "string"
                    ? item.passwordHash.trim()
                    : undefined,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to parse USERS_CONFIG environment variable:", err);
    }
  }

  // Fallback / legacy support for ADMIN_EMAIL and ADMIN_PASSWORD_HASH
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (adminEmail && adminPasswordHash) {
    const cleanAdminEmail = adminEmail.toLowerCase();
    if (!seenEmails.has(cleanAdminEmail)) {
      seenEmails.add(cleanAdminEmail);
      users.push({
        id: "admin-user",
        email: cleanAdminEmail,
        name: process.env.ADMIN_NAME?.trim() || "Administrator",
        role: Role.ADMIN,
        passwordHash: adminPasswordHash,
      });
    }
  }

  return users;
}

/**
 * Returns the Administrator user if configured.
 */
export function getAdminUser(): User | null {
  const users = getUsers();
  return users.find((u) => u.role === Role.ADMIN) || null;
}

export function findUserByEmail(email: string): User | undefined {
  if (!email || typeof email !== "string") return undefined;
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return undefined;
  return getUsers().find((u) => u.email === cleanEmail);
}

export function findUserById(id: string): User | undefined {
  if (!id || typeof id !== "string") return undefined;
  return getUsers().find((u) => u.id === id);
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
