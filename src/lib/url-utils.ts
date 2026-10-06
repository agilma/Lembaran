/**
 * Sanitizes callback URLs to prevent open redirect vulnerabilities.
 * Only relative internal paths starting with a single '/' are allowed.
 * Protocol-relative URLs (// or /\), absolute URLs (https://), and pseudo-protocols (javascript:, data:, vbscript:) are rejected.
 */
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
