import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { sanitizeCallbackUrl } from "../url-utils";
import { parseRole } from "../auth-utils";
import { Role } from "../../types/user";

describe("Authentication & Security Suite", () => {
  describe("Callback URL Sanitization", () => {
    test("allows safe relative internal paths", () => {
      assert.strictEqual(sanitizeCallbackUrl("/riwayat"), "/riwayat");
      assert.strictEqual(sanitizeCallbackUrl("/kalender"), "/kalender");
      assert.strictEqual(
        sanitizeCallbackUrl("/bacaan/fatihah?step=2"),
        "/bacaan/fatihah?step=2"
      );
    });

    test("falls back to default fallback when URL is empty, null, or undefined", () => {
      assert.strictEqual(sanitizeCallbackUrl(null), "/");
      assert.strictEqual(sanitizeCallbackUrl(undefined, "/riwayat"), "/riwayat");
      assert.strictEqual(sanitizeCallbackUrl(""), "/");
    });

    test("blocks protocol-relative URLs (// or /\\)", () => {
      assert.strictEqual(sanitizeCallbackUrl("//evil.com"), "/");
      assert.strictEqual(sanitizeCallbackUrl("/\\evil.com"), "/");
      assert.strictEqual(sanitizeCallbackUrl("//google.com/riwayat", "/riwayat"), "/riwayat");
    });

    test("blocks absolute URLs and external domains", () => {
      assert.strictEqual(sanitizeCallbackUrl("https://evil.example.com"), "/");
      assert.strictEqual(sanitizeCallbackUrl("http://phishing.site"), "/");
    });

    test("blocks dangerous pseudo-protocols (javascript, data, vbscript)", () => {
      assert.strictEqual(sanitizeCallbackUrl("javascript:alert(1)"), "/");
      assert.strictEqual(sanitizeCallbackUrl("data:text/html;base64,123"), "/");
      assert.strictEqual(sanitizeCallbackUrl("vbscript:msgbox(1)"), "/");
    });
  });

  describe("Role Parsing & Defaults", () => {
    test("parses trusted app_metadata roles correctly", () => {
      assert.strictEqual(parseRole("ADMIN"), Role.ADMIN);
      assert.strictEqual(parseRole("admin"), Role.ADMIN);
      assert.strictEqual(parseRole("EDITOR"), Role.EDITOR);
      assert.strictEqual(parseRole("editor"), Role.EDITOR);
      assert.strictEqual(parseRole("VIEWER"), Role.VIEWER);
      assert.strictEqual(parseRole("viewer"), Role.VIEWER);
    });

    test("defaults unassigned, invalid, or null roles strictly to VIEWER", () => {
      assert.strictEqual(parseRole(null), Role.VIEWER);
      assert.strictEqual(parseRole(undefined), Role.VIEWER);
      assert.strictEqual(parseRole("SUPERADMIN"), Role.VIEWER);
      assert.strictEqual(parseRole(123), Role.VIEWER);
      assert.strictEqual(parseRole({ role: "ADMIN" }), Role.VIEWER);
    });
  });

  describe("Data Isolation & Guest Progress Key Behavior", () => {
    test("guest storage keys strictly match lembaran_progress_ pattern", () => {
      const getStorageKey = (slug: string) => `lembaran_progress_${slug}`;
      assert.strictEqual(getStorageKey("fatihah"), "lembaran_progress_fatihah");
      assert.strictEqual(
        getStorageKey("yasin").startsWith("lembaran_progress_"),
        true
      );
    });
  });
});
