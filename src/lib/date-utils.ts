/**
 * Timezone utilities for Lembaran application.
 * Formats timestamps in Indonesia WIB (Asia/Jakarta) timezone.
 */

export interface FormattedJakartaDate {
  dateString: string; // e.g., "4 Oktober 2026"
  timeString: string; // e.g., "21:15"
  fullFormatted: string; // e.g., "4 Oktober 2026 — 21:15"
  isoDateKey: string; // e.g., "2026-10-04" for grouping by date
}

export function formatInJakartaTimezone(isoString: string): FormattedJakartaDate {
  const date = new Date(isoString);

  const dateString = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const timeString = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  // Format YYYY-MM-DD key in Asia/Jakarta timezone for date-based grouping
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(date);

  const month = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    month: "2-digit",
  }).format(date);

  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
  }).format(date);

  const isoDateKey = `${year}-${month}-${day}`;

  return {
    dateString,
    timeString,
    fullFormatted: `${dateString} — ${timeString}`,
    isoDateKey,
  };
}
