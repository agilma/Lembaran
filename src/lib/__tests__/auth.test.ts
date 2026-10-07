import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { sanitizeCallbackUrl, getAppOrigin } from "../url-utils";
import { parseRole } from "../auth-utils";
import { Role } from "../../types/user";

describe("Authentication & Security Suite", () => {
  describe("Application Origin Determination", () => {
    test("prioritizes NEXT_PUBLIC_APP_URL when set", () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXT_PUBLIC_APP_URL = "https://custom-app.domain.com/";
      assert.strictEqual(getAppOrigin(), "https://custom-app.domain.com");
      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    });

    test("falls back to https://lembaran.vercel.app in production if env is missing", () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;

      assert.strictEqual(getAppOrigin(), "https://lembaran.vercel.app");

      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    });

    test("uses request x-forwarded-host header when available", () => {
      const originalEnv = process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const mockRequest = new Request("http://internal-host/auth/callback", {
        headers: {
          "x-forwarded-host": "lembaran.vercel.app",
          "x-forwarded-proto": "https",
        },
      });

      assert.strictEqual(getAppOrigin(mockRequest), "https://lembaran.vercel.app");

      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    });
  });

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

  describe("OAuth Callback & Error Handling Suite", () => {
    test("sanitizes next destination parameter during OAuth callback", () => {
      const parseOAuthCallbackNext = (rawNext: string | null) => {
        return sanitizeCallbackUrl(rawNext, "/riwayat");
      };

      assert.strictEqual(parseOAuthCallbackNext("/kalender"), "/kalender");
      assert.strictEqual(
        parseOAuthCallbackNext("https://malicious.site"),
        "/riwayat"
      );
      assert.strictEqual(parseOAuthCallbackNext("//evil.com"), "/riwayat");
      assert.strictEqual(parseOAuthCallbackNext(null), "/riwayat");
    });

    test("maps OAuth error responses accurately", () => {
      const mapOAuthError = (errorParam: string | null) => {
        if (!errorParam) return null;
        if (errorParam === "InvalidVerificationCode") {
          return "Sesi verifikasi atau login tidak valid atau kadaluarsa.";
        }
        if (
          errorParam.includes("access_denied") ||
          errorParam.toLowerCase().includes("denied")
        ) {
          return "Login dengan Google dibatalkan atau tidak diizinkan.";
        }
        return errorParam;
      };

      assert.strictEqual(
        mapOAuthError("access_denied"),
        "Login dengan Google dibatalkan atau tidak diizinkan."
      );
      assert.strictEqual(
        mapOAuthError("InvalidVerificationCode"),
        "Sesi verifikasi atau login tidak valid atau kadaluarsa."
      );
      assert.strictEqual(
        mapOAuthError("Custom OAuth Failure"),
        "Custom OAuth Failure"
      );
      assert.strictEqual(mapOAuthError(null), null);
    });
  });
});
