import assert from "node:assert/strict";
import { test, describe, beforeEach, afterEach } from "node:test";

// Set AUTH_SECRET before auth modules are evaluated
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-auth-secret-12345678901234567890";

import { getUsers, findUserByEmail, findUserById, getAdminUser } from "../users";
import { sanitizeCallbackUrl } from "../auth-utils";
import { clearGuestLocalProgress } from "../storage-utils";
import { Role } from "../../types/user";

describe("Task 11 Suite", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Multi-User Account Lookup", () => {
    test("parses USERS_CONFIG JSON array and finds User A and User B", () => {
      const mockUsers = [
        {
          id: "usr-a",
          email: "usera@example.com",
          name: "User Alpha",
          role: "VIEWER",
          passwordHash: "$2a$10$hasha",
        },
        {
          id: "usr-b",
          email: "userb@example.com",
          name: "User Beta",
          role: "EDITOR",
          passwordHash: "$2a$10$hashb",
        },
      ];

      process.env.USERS_CONFIG = JSON.stringify(mockUsers);
      delete process.env.ADMIN_EMAIL;
      delete process.env.ADMIN_PASSWORD_HASH;

      const users = getUsers();
      assert.strictEqual(users.length, 2);

      const userA = findUserByEmail("usera@example.com");
      assert.notStrictEqual(userA, undefined);
      assert.strictEqual(userA?.id, "usr-a");
      assert.strictEqual(userA?.name, "User Alpha");
      assert.strictEqual(userA?.role, Role.VIEWER);

      const userB = findUserByEmail("userb@example.com");
      assert.notStrictEqual(userB, undefined);
      assert.strictEqual(userB?.id, "usr-b");
      assert.strictEqual(userB?.name, "User Beta");
      assert.strictEqual(userB?.role, Role.EDITOR);
    });

    test("finds user with case-insensitive and trimmed email matching", () => {
      process.env.USERS_CONFIG = JSON.stringify([
        {
          id: "usr-c",
          email: "UserC@Example.com",
          name: "User C",
          role: "ADMIN",
          passwordHash: "$2a$10$hashc",
        },
      ]);

      const found = findUserByEmail("  userc@example.com  ");
      assert.notStrictEqual(found, undefined);
      assert.strictEqual(found?.email, "userc@example.com");

      const foundById = findUserById("usr-c");
      assert.notStrictEqual(foundById, undefined);
      assert.strictEqual(foundById?.email, "userc@example.com");
    });

    test("returns undefined for unknown email with NO fallback to default user", () => {
      process.env.USERS_CONFIG = JSON.stringify([
        {
          id: "usr-a",
          email: "usera@example.com",
          name: "User Alpha",
          role: "VIEWER",
          passwordHash: "$2a$10$hasha",
        },
      ]);

      const unknown = findUserByEmail("unknown@example.com");
      assert.strictEqual(unknown, undefined);
    });

    test("supports legacy ADMIN_EMAIL fallback when USERS_CONFIG is not set", () => {
      delete process.env.USERS_CONFIG;
      delete process.env.USERS_LIST;
      process.env.ADMIN_EMAIL = "admin@lembaran.app";
      process.env.ADMIN_PASSWORD_HASH = "$2a$10$adminhash";
      process.env.ADMIN_NAME = "Administrator";

      const admin = getAdminUser();
      assert.notStrictEqual(admin, null);
      assert.strictEqual(admin?.email, "admin@lembaran.app");
      assert.strictEqual(admin?.role, Role.ADMIN);

      const found = findUserByEmail("admin@lembaran.app");
      assert.notStrictEqual(found, undefined);
      assert.strictEqual(found?.id, "admin-user");
    });
  });

  describe("Safe callbackUrl Sanitization", () => {
    test("accepts valid internal relative paths", () => {
      assert.strictEqual(sanitizeCallbackUrl("/riwayat"), "/riwayat");
      assert.strictEqual(sanitizeCallbackUrl("/kalender"), "/kalender");
      assert.strictEqual(sanitizeCallbackUrl("/bacaan/foo"), "/bacaan/foo");
      assert.strictEqual(
        sanitizeCallbackUrl("/bacaan/surah-yasin?step=2#top"),
        "/bacaan/surah-yasin?step=2#top"
      );
    });

    test("rejects absolute, protocol-relative, scheme handler, or external URLs", () => {
      assert.strictEqual(sanitizeCallbackUrl("https://evil.example"), "/");
      assert.strictEqual(sanitizeCallbackUrl("http://evil.example"), "/");
      assert.strictEqual(sanitizeCallbackUrl("//evil.example"), "/");
      assert.strictEqual(sanitizeCallbackUrl("/\\evil.example"), "/");
      assert.strictEqual(sanitizeCallbackUrl("javascript:alert(1)"), "/");
      assert.strictEqual(sanitizeCallbackUrl("data:text/html,evil"), "/");
    });

    test("returns fallback on malformed, empty, or non-string inputs", () => {
      assert.strictEqual(sanitizeCallbackUrl(""), "/");
      assert.strictEqual(sanitizeCallbackUrl("   "), "/");
      assert.strictEqual(sanitizeCallbackUrl(null), "/");
      assert.strictEqual(sanitizeCallbackUrl(undefined), "/");
      assert.strictEqual(sanitizeCallbackUrl("not-a-path"), "/");
      assert.strictEqual(
        sanitizeCallbackUrl("https://evil.com", "/riwayat"),
        "/riwayat"
      );
    });
  });

  describe("Local Progress Cleanup", () => {
    test("cleans lembaran_progress_* keys and preserves unrelated keys", () => {
      const storageMap = new Map<string, string>();
      storageMap.set("lembaran_progress_surah-yasin", '{"step":2}');
      storageMap.set("lembaran_progress_tahlil", '{"step":5}');
      storageMap.set("theme", "dark");
      storageMap.set("unrelated_key", "value");

      const mockStorage: Storage = {
        get length() {
          return storageMap.size;
        },
        key(index: number) {
          const keys = Array.from(storageMap.keys());
          return keys[index] ?? null;
        },
        getItem(key: string) {
          return storageMap.get(key) ?? null;
        },
        setItem(key: string, value: string) {
          storageMap.set(key, value);
        },
        removeItem(key: string) {
          storageMap.delete(key);
        },
        clear() {
          storageMap.clear();
        },
      };

      clearGuestLocalProgress(mockStorage);

      assert.strictEqual(storageMap.has("lembaran_progress_surah-yasin"), false);
      assert.strictEqual(storageMap.has("lembaran_progress_tahlil"), false);
      assert.strictEqual(storageMap.get("theme"), "dark");
      assert.strictEqual(storageMap.get("unrelated_key"), "value");
    });

    test("handles null or undefined storage gracefully", () => {
      assert.doesNotThrow(() => {
        clearGuestLocalProgress(undefined);
      });
    });
  });
});
