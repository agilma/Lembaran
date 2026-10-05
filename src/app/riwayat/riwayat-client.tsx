"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CompletionRecordItem,
  ReadingSummaryItem,
  DateSummaryItem,
} from "@/app/actions/reading-actions";

interface RiwayatClientProps {
  isAuthenticated: boolean;
  isError?: boolean;
  errorMessage?: string;
  completions: CompletionRecordItem[];
  summaries: ReadingSummaryItem[];
  dateSummaries: DateSummaryItem[];
}

export default function RiwayatClient({
  isAuthenticated,
  isError,
  errorMessage,
  completions,
  summaries,
  dateSummaries,
}: RiwayatClientProps) {
  const [activeTab, setActiveTab] = useState<"reading" | "date">("reading");

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200/50 dark:border-emerald-800/50">
          📖
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Riwayat Bacaan
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Silakan masuk untuk melihat riwayat bacaan dan amalan yang tersimpan di akun Anda.
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

  const isEmpty = completions.length === 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      <header className="border-b border-slate-200/80 dark:border-slate-800 pb-6 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Riwayat Bacaan
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/kalender"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              Kalender Amalan
            </Link>
            {!isEmpty && !isError && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                Total: {completions.length} Selesai
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Catatan penyelesaian amalan dan bacaan Anda (Waktu WIB / Asia/Jakarta).
        </p>
      </header>

      {isError ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-rose-900 dark:text-rose-200">
              Gagal Memuat Riwayat
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300 max-w-sm mx-auto">
              {errorMessage || "Terjadi kesalahan database saat memuat riwayat. Silakan coba beberapa saat lagi."}
            </p>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center space-y-5">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mx-auto text-2xl">
            📜
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Belum ada riwayat bacaan.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Mulai membaca untuk melihat riwayatmu di sini.
            </p>
          </div>
          <div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-medium text-sm rounded-xl transition-colors shadow-2xs"
            >
              Mulai Membaca
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Overview Cards */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ringkasan Bacaan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summaries.map((s) => (
                <div
                  key={s.readingSlug}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {s.readingTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Sudah selesai: <span className="font-bold text-emerald-700 dark:text-emerald-400">{s.totalCompletions} kali</span>
                    </p>
                  </div>
                  <Link
                    href={`/bacaan/${s.readingSlug}`}
                    className="text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:underline bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50"
                  >
                    Baca
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Detailed Completion View with Tab Selector */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Detail Riwayat Penyelesaian
              </h2>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("reading")}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeTab === "reading"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Per Bacaan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("date")}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    activeTab === "date"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Per Tanggal
                </button>
              </div>
            </div>

            {activeTab === "reading" ? (
              /* Grouped by Reading */
              <div className="space-y-6">
                {summaries.map((summary) => {
                  const items = completions.filter(
                    (c) => c.readingSlug === summary.readingSlug
                  );
                  return (
                    <div
                      key={summary.readingSlug}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs"
                    >
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border-b border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {summary.readingTitle}
                        </h3>
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                          {summary.totalCompletions} kali
                        </span>
                      </div>
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="px-4 py-3 flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {item.fullFormatted}
                              </span>
                            </div>
                            {item.count !== null && item.target !== null && (
                              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                                ({item.count}/{item.target})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Grouped by Date (Calendar / Date View) */
              <div className="space-y-6">
                {dateSummaries.map((ds) => {
                  const items = completions.filter(
                    (c) => c.isoDateKey === ds.isoDateKey
                  );
                  return (
                    <div
                      key={ds.isoDateKey}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs"
                    >
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border-b border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            📅
                          </span>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {ds.dateString}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                          {ds.totalCompletions} completion
                        </span>
                      </div>
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="px-4 py-3 flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {item.readingTitle}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Selesai pukul {item.formattedTime} WIB
                              </p>
                            </div>
                            <Link
                              href={`/bacaan/${item.readingSlug}`}
                              className="text-xs text-slate-500 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
                            >
                              Buka →
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
