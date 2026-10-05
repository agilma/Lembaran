"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CompletionRecordItem } from "@/app/actions/reading-actions";
import {
  INDONESIAN_MONTH_NAMES,
  getJakartaDateComponents,
  formatJakartaDateLong,
} from "@/lib/date-utils";

interface KalenderClientProps {
  isAuthenticated: boolean;
  isError?: boolean;
  errorMessage?: string;
  completions: CompletionRecordItem[];
}

const WEEKDAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function KalenderClient({
  isAuthenticated,
  isError,
  errorMessage,
  completions,
}: KalenderClientProps) {
  // Today's components in Asia/Jakarta timezone
  const todayComponents = useMemo(() => getJakartaDateComponents(), []);
  const todayKey = todayComponents.isoDateKey;

  // Calendar view state (year and 0-indexed month)
  const [currentYear, setCurrentYear] = useState<number>(todayComponents.year);
  const [currentMonth, setCurrentMonth] = useState<number>(
    todayComponents.month
  );

  // Selected date state (defaults to today)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  // Group completions by isoDateKey (Asia/Jakarta timezone)
  const completionsByDate = useMemo(() => {
    const map = new Map<string, CompletionRecordItem[]>();
    completions.forEach((item) => {
      const existing = map.get(item.isoDateKey) || [];
      existing.push(item);
      map.set(item.isoDateKey, existing);
    });
    return map;
  }, [completions]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200/50 dark:border-emerald-800/50">
          📅
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Kalender Amalan
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Silakan masuk untuk melihat kalender aktivitas dan riwayat bacaan amalan yang tersimpan di akun Anda.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-3 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs"
        >
          Masuk ke Akun
        </Link>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-rose-900 dark:text-rose-200">
              Gagal Memuat Kalender
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300 max-w-sm mx-auto">
              {errorMessage ||
                "Terjadi kesalahan database saat memuat data kalender. Silakan coba beberapa saat lagi."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(todayComponents.year);
    setCurrentMonth(todayComponents.month);
    setSelectedDateKey(todayKey);
  };

  // Calendar Grid Calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, ..., 6 = Sat

  // Generate date grid cells
  const gridCells = [];
  // Leading empty padding cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridCells.push(null);
  }
  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const isoDateKey = `${currentYear}-${monthStr}-${dayStr}`;
    gridCells.push({
      dayNumber: day,
      isoDateKey,
      isToday: isoDateKey === todayKey,
      isSelected: isoDateKey === selectedDateKey,
      hasCompletions: completionsByDate.has(isoDateKey),
      completionCount: completionsByDate.get(isoDateKey)?.length || 0,
    });
  }

  const selectedCompletions = completionsByDate.get(selectedDateKey) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Header Section */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 pb-6 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Kalender Amalan
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/riwayat"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400"
            >
              <svg
                className="w-4 h-4 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Riwayat Detail
            </Link>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tampilan kalender bulanan aktivitas penyelesaian amalan Anda (WIB / Asia/Jakarta).
        </p>
      </header>

      {/* Calendar Card */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-2xs space-y-6">
        {/* Month Navigation Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
              {INDONESIAN_MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            {currentYear === todayComponents.year &&
              currentMonth === todayComponents.month && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                  Bulan Ini
                </span>
              )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleGoToToday}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400"
              title="Kembali ke Hari Ini"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan Sebelumnya"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Bulan Berikutnya"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Day Name Headers */}
        <div className="grid grid-cols-7 text-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
          {WEEKDAY_NAMES.map((name, index) => (
            <span
              key={name}
              className={`text-xs font-semibold uppercase tracking-wider ${
                index === 0
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {name}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {gridCells.map((cell, idx) => {
            if (cell === null) {
              return <div key={`empty-${idx}`} className="h-11 sm:h-14" />;
            }

            const {
              dayNumber,
              isoDateKey,
              isToday,
              isSelected,
              hasCompletions,
              completionCount,
            } = cell;

            const dateLabel = `${formatJakartaDateLong(isoDateKey)}${
              isToday ? " (Hari ini)" : ""
            }, ${
              hasCompletions
                ? `${completionCount} bacaan selesai`
                : "tidak ada aktivitas"
            }`;

            return (
              <button
                key={isoDateKey}
                type="button"
                onClick={() => setSelectedDateKey(isoDateKey)}
                aria-label={dateLabel}
                aria-selected={isSelected}
                aria-current={isToday ? "date" : undefined}
                className={`relative h-11 sm:h-14 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer select-none text-xs sm:text-sm font-medium focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 ${
                  isSelected
                    ? "bg-emerald-800 text-white dark:bg-emerald-700 ring-2 ring-emerald-600 dark:ring-emerald-400 shadow-sm"
                    : isToday
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold border-2 border-emerald-500 dark:border-emerald-500"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200"
                }`}
              >
                <span>{dayNumber}</span>

                {/* Today Pill / Label indicator */}
                {isToday && !isSelected && (
                  <span className="text-[9px] leading-tight text-emerald-700 dark:text-emerald-400 font-bold -mt-0.5">
                    Hari Ini
                  </span>
                )}

                {/* Completion Indicator Dot / Count */}
                {hasCompletions && (
                  <div className="mt-1 flex items-center justify-center gap-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected
                          ? "bg-amber-300"
                          : "bg-emerald-600 dark:bg-emerald-400"
                      }`}
                    />
                    {completionCount > 1 && (
                      <span
                        className={`text-[9px] font-bold ${
                          isSelected
                            ? "text-emerald-100"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {completionCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Activity Detail Section for Selected Date */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Aktivitas pada {formatJakartaDateLong(selectedDateKey)}
            </h2>
            {selectedDateKey === todayKey && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                • Hari Ini (WIB)
              </p>
            )}
          </div>
          {selectedCompletions.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
              {selectedCompletions.length} Selesai
            </span>
          )}
        </div>

        {selectedCompletions.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {selectedCompletions.map((item) => (
                <li
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.readingTitle}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pl-4">
                      <span>Selesai pukul {item.formattedTime} WIB</span>
                      {item.count !== null && item.target !== null && (
                        <span>
                          • Hitungan: {item.count}/{item.target}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/bacaan/${item.readingSlug}`}
                    className="shrink-0 text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 flex items-center gap-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400"
                  >
                    <span>Buka</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
            <div className="text-2xl">🌱</div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Belum ada amalan yang diselesaikan pada tanggal ini.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Pilih tanggal lain di kalender yang memiliki indikator aktivitas.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
