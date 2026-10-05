import assert from "node:assert/strict";
import { test, describe, beforeEach, afterEach } from "node:test";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  findUserById,
  getConfiguredUsers,
  verifyPassword,
} from "../users";
import { sanitizeCallbackUrl } from "../../app/login/login-client";
import { Role } from "../../types/user";

describe("Users & Multi-User Authentication Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("returns empty array when no user env variables are configured", () => {
    delete process.env.USERS_CONFIG;
    delete process.env.USERS_LIST;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD_HASH;

    const users = getConfiguredUsers();
    assert.strictEqual(users.length, 0);
  });

  test("supports legacy ADMIN_EMAIL fallback when USERS_CONFIG is not defined", () => {
    delete process.env.USERS_CONFIG;
    delete process.env.USERS_LIST;
    process.env.ADMIN_EMAIL = "admin@lembaran.app";
    process.env.ADMIN_PASSWORD_HASH = "$2a$10$abcdefghijklmnopqrstuu";
    process.env.ADMIN_NAME = "System Admin";

    const admin = findUserByEmail("admin@lembaran.app");
    assert.notStrictEqual(admin, undefined);
    assert.strictEqual(admin?.id, "admin-user");
    assert.strictEqual(admin?.email, "admin@lembaran.app");
    assert.strictEqual(admin?.name, "System Admin");
    assert.strictEqual(admin?.role, Role.ADMIN);

    const byId = findUserById("admin-user");
    assert.notStrictEqual(byId, undefined);
    assert.strictEqual(byId?.email, "admin@lembaran.app");
  });

  test("parses multi-user JSON configuration from USERS_CONFIG", async () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD_HASH;

    const hash1 = await bcrypt.hash("pass123", 10);
    const hash2 = await bcrypt.hash("pass456", 10);

    process.env.USERS_CONFIG = JSON.stringify([
      {
        id: "user-1",
        email: "alice@lembaran.app",
        name: "Alice",
        role: "EDITOR",
        passwordHash: hash1,
      },
      {
        id: "user-2",
        email: "bob@lembaran.app",
        name: "Bob",
        role: "VIEWER",
        passwordHash: hash2,
      },
    ]);

    const users = getConfiguredUsers();
    assert.strictEqual(users.length, 2);

    const alice = findUserByEmail("Alice@lembaran.app");
    assert.notStrictEqual(alice, undefined);
    assert.strictEqual(alice?.id, "user-1");
    assert.strictEqual(alice?.role, Role.EDITOR);

    const isAlicePassValid = await verifyPassword("pass123", alice?.passwordHash);
    assert.strictEqual(isAlicePassValid, true);

    const isAlicePassInvalid = await verifyPassword("wrongpass", alice?.passwordHash);
    assert.strictEqual(isAlicePassInvalid, false);

    const bob = findUserById("user-2");
    assert.notStrictEqual(bob, undefined);
    assert.strictEqual(bob?.email, "bob@lembaran.app");
    assert.strictEqual(bob?.role, Role.VIEWER);

    const isBobPassValid = await verifyPassword("pass456", bob?.passwordHash);
    assert.strictEqual(isBobPassValid, true);
  });

  test("returns undefined for non-existent email or id", () => {
    process.env.USERS_CONFIG = JSON.stringify([
      {
        id: "user-1",
        email: "user@lembaran.app",
        passwordHash: "hash",
      },
    ]);

    assert.strictEqual(findUserByEmail("nonexistent@lembaran.app"), undefined);
    assert.strictEqual(findUserById("nonexistent-id"), undefined);
  });

  test("sanitizeCallbackUrl prevents open redirect vulnerabilities", () => {
    assert.strictEqual(sanitizeCallbackUrl("/riwayat"), "/riwayat");
    assert.strictEqual(sanitizeCallbackUrl("/kalender"), "/kalender");
    assert.strictEqual(sanitizeCallbackUrl("/bacaan/yasin"), "/bacaan/yasin");

    assert.strictEqual(sanitizeCallbackUrl("https://evil.com"), "/");
    assert.strictEqual(sanitizeCallbackUrl("//evil.com"), "/");
    assert.strictEqual(sanitizeCallbackUrl("/\\evil.com"), "/");
    assert.strictEqual(sanitizeCallbackUrl(null), "/");
    assert.strictEqual(sanitizeCallbackUrl(""), "/");
  });
});
