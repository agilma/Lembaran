/**
 * Sanitizes callback URLs to prevent open redirect vulnerabilities.
 * Only relative internal paths starting with a single '/' are allowed.
 * Protocol-relative URLs (// or /\), absolute URLs (https://), and pseudo-protocols (javascript:, data:, vbscript:) are rejected.
 */
/**
 * Determines the application origin URL for authentication redirects.
 * Prioritizes process.env.NEXT_PUBLIC_APP_URL, then request headers / window location,
 * falling back safely to 'https://lembaran.vercel.app' in production.
 */
export function getAppOrigin(request?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== "") {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, "");
  }

  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "http";

    if (host) {
      const cleanHost = host.split(":")[0];
      if (cleanHost === "localhost" || cleanHost === "127.0.0.1") {
        return `${proto}://${host}`;
      }
    }
  }

  if (typeof window !== "undefined" && window.location.origin) {
    const origin = window.location.origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return origin;
    }
  }

  return "https://lembaran.vercel.app";
}

export function sanitizeCallbackUrl(url: string | null | undefined, fallback = "/"): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  const trimmed = url.trim();

  // Must start with '/' but NOT '//' or '/\' or '/\t'
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("/\t") ||
    trimmed.startsWith("/\n") ||
    trimmed.startsWith("/\r")
  ) {
    return fallback;
  }

  // Reject anything containing colon before a slash (e.g. scheme attempts)
  const firstSlashPos = trimmed.indexOf("/", 1);
  const colonPos = trimmed.indexOf(":");
  if (colonPos !== -1 && (firstSlashPos === -1 || colonPos < firstSlashPos)) {
    return fallback;
  }

  return trimmed;
}
