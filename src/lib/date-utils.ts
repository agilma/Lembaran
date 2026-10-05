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

export const INDONESIAN_MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface JakartaDateComponents {
  year: number;
  month: number; // 0-indexed (0 = Jan, 11 = Dec)
  day: number;
  isoDateKey: string; // "YYYY-MM-DD"
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

export function getJakartaDateComponents(
  dateInput: Date | string = new Date()
): JakartaDateComponents {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  const yearStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(date);

  const monthStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    month: "2-digit",
  }).format(date);

  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
  }).format(date);

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const isoDateKey = `${yearStr}-${monthStr}-${dayStr}`;

  return { year, month, day, isoDateKey };
}

export function formatJakartaDateLong(isoDateKey: string): string {
  const parts = isoDateKey.split("-");
  if (parts.length !== 3) return isoDateKey;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31
  ) {
    return isoDateKey;
  }

  const monthName = INDONESIAN_MONTH_NAMES[month];
  return `${day} ${monthName} ${year}`;
}
