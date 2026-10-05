import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// Set AUTH_SECRET before importing auth modules
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-auth-secret-for-task11-unit-tests";

import { findUserByEmail, findUserById, getUsersFromEnv } from "@/lib/users";
import { sanitizeCallbackUrl } from "@/lib/auth-utils";
import { clearGuestLocalProgress } from "@/lib/storage-utils";
import { Role } from "@/types/user";

// Mock implementation of Storage for node environment tests
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("Task 11 Suite - Multi-User, Callback URL, Local Progress", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-auth-secret-for-task11-unit-tests";
    delete process.env.USERS_CONFIG;
    delete process.env.USERS_LIST;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD_HASH;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Multi-user configuration & lookup", () => {
    it("parses USERS_CONFIG JSON array correctly and finds users by email & id", () => {
      const mockUsers = [
        {
          id: "user-1",
          email: "User1@Example.com",
          name: "User Satu",
          role: "VIEWER",
          passwordHash: "$2a$10$hash1",
        },
        {
          id: "user-2",
          email: "user2@example.com",
          name: "User Dua",
          role: "EDITOR",
          passwordHash: "$2a$10$hash2",
        },
      ];

      process.env.USERS_CONFIG = JSON.stringify(mockUsers);

      const users = getUsersFromEnv();
      assert.equal(users.length, 2);

      // Lookup User A (case insensitive)
      const user1 = findUserByEmail("USER1@EXAMPLE.COM");
      assert.ok(user1);
      assert.equal(user1?.id, "user-1");
      assert.equal(user1?.name, "User Satu");
      assert.equal(user1?.role, Role.VIEWER);

      // Lookup User B
      const user2 = findUserByEmail("user2@example.com");
      assert.ok(user2);
      assert.equal(user2?.id, "user-2");
      assert.equal(user2?.role, Role.EDITOR);

      // Lookup by ID
      const user1ById = findUserById("user-1");
      assert.ok(user1ById);
      assert.equal(user1ById?.email, "user1@example.com");

      // Unknown email / unknown id
      assert.equal(findUserByEmail("unknown@example.com"), undefined);
      assert.equal(findUserById("user-unknown"), undefined);
    });

    it("retains backward compatibility with legacy ADMIN_EMAIL & ADMIN_PASSWORD_HASH", () => {
      process.env.ADMIN_EMAIL = "admin@lembaran.app";
      process.env.ADMIN_PASSWORD_HASH = "$2a$10$adminhash";

      const admin = findUserByEmail("ADMIN@LEMBARAN.APP");
      assert.ok(admin);
      assert.equal(admin?.id, "admin-user");
      assert.equal(admin?.role, Role.ADMIN);

      const adminById = findUserById("admin-user");
      assert.ok(adminById);
      assert.equal(adminById?.email, "admin@lembaran.app");
    });
  });

  describe("Callback URL sanitization", () => {
    it("allows valid internal relative URLs", () => {
      assert.equal(sanitizeCallbackUrl("/riwayat"), "/riwayat");
      assert.equal(sanitizeCallbackUrl("/kalender"), "/kalender");
      assert.equal(sanitizeCallbackUrl("/bacaan/foo"), "/bacaan/foo");
      assert.equal(sanitizeCallbackUrl("/bacaan/foo?step=2#section-1"), "/bacaan/foo?step=2#section-1");
    });

    it("rejects open redirect attempts and invalid protocols", () => {
      assert.equal(sanitizeCallbackUrl("https://evil.com"), "/");
      assert.equal(sanitizeCallbackUrl("http://evil.com"), "/");
      assert.equal(sanitizeCallbackUrl("//evil.com"), "/");
      assert.equal(sanitizeCallbackUrl("/\\evil.com"), "/");
      assert.equal(sanitizeCallbackUrl("javascript:alert(1)"), "/");
      assert.equal(sanitizeCallbackUrl("data:text/html,evil"), "/");
      assert.equal(sanitizeCallbackUrl("vbscript:msgbox(1)"), "/");
      assert.equal(sanitizeCallbackUrl("///evil.com"), "/");
    });

    it("uses custom fallback if provided", () => {
      assert.equal(sanitizeCallbackUrl("https://evil.com", "/riwayat"), "/riwayat");
    });
  });

  describe("Local progress cleanup on logout", () => {
    it("deletes all lembaran_progress_ keys while retaining non-progress keys", () => {
      const storage = new MockStorage();
      storage.setItem("lembaran_progress_a", '{"step": 1}');
      storage.setItem("lembaran_progress_b", '{"step": 3}');
      storage.setItem("theme", "dark");
      storage.setItem("other_setting", "enabled");

      clearGuestLocalProgress(storage);

      assert.equal(storage.getItem("lembaran_progress_a"), null);
      assert.equal(storage.getItem("lembaran_progress_b"), null);
      assert.equal(storage.getItem("theme"), "dark");
      assert.equal(storage.getItem("other_setting"), "enabled");
    });
  });
});
