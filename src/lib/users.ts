import bcrypt from "bcryptjs";
import { Role, User } from "@/types/user";

// Pre-hashed passwords for test accounts ("password123")
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("password123", 10);

export const MOCK_USERS: User[] = [
  {
    id: "user-viewer-1",
    email: "viewer@lembaran.app",
    name: "Pembaca Lembaran",
    role: Role.VIEWER,
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
  {
    id: "user-editor-1",
    email: "editor@lembaran.app",
    name: "Editor Bacaan",
    role: Role.EDITOR,
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
  {
    id: "user-admin-1",
    email: "admin@lembaran.app",
    name: "Pengelola Sistem",
    role: Role.ADMIN,
    passwordHash: DEFAULT_PASSWORD_HASH,
  },
];

export function findUserByEmail(email: string): User | undefined {
  return MOCK_USERS.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

export function findUserById(id: string): User | undefined {
  return MOCK_USERS.find((user) => user.id === id);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword?: string
): Promise<boolean> {
  if (!hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}
