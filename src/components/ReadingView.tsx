'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Reading } from '@/types/reading';

interface ReadingViewProps {
  reading: Reading;
}

export function ReadingView({ reading }: ReadingViewProps) {
  const sections = reading.sections || [];
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [counts, setCounts] = useState<number[]>(() =>
    new Array(sections.length).fill(0)
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const readerRef = useRef<HTMLDivElement>(null);

  const currentSection = sections[activeIndex];
  const targetCount = currentSection?.repeatCount || 1;
  const currentCount = counts[activeIndex] || 0;
  const isTargetReached = currentCount >= targetCount;
  const progressPercent = Math.min(
    100,
    Math.round((currentCount / targetCount) * 100)
  );

  const handleIncrement = () => {
    setCounts((prev) => {
      const updated = [...prev];
      updated[activeIndex] = (updated[activeIndex] || 0) + 1;
      return updated;
    });
  };

  const handleResetSection = () => {
    setCounts((prev) => {
      const updated = [...prev];
      updated[activeIndex] = 0;
      return updated;
    });
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (activeIndex < sections.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleResetAll = () => {
    setCounts(new Array(sections.length).fill(0));
    setActiveIndex(0);
    setIsCompleted(false);
  };

  const scrollToReader = () => {
    if (readerRef.current) {
      readerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <article className="space-y-8 pb-16 max-w-3xl mx-auto px-1 sm:px-0">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-emerald-800 transition-colors group"
        >
          <svg
            className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Kembali ke Daftar Bacaan
        </Link>

        <header className="border-b border-slate-200/80 pb-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800">
              {reading.category}
            </span>
            {reading.estimatedTime && (
              <span className="text-xs text-slate-500">
                • Estimasi: {reading.estimatedTime}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {reading.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {reading.description}
          </p>

          {!isCompleted && sections.length > 0 && (
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={scrollToReader}
                className="inline-flex items-center justify-center text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 px-5 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Mulai Membaca
              </button>
            </div>
          )}
        </header>
      </div>

      {/* Completion View */}
      {isCompleted ? (
        <section
          className="p-8 sm:p-10 rounded-2xl bg-white border border-emerald-200 shadow-sm text-center space-y-6"
          aria-live="polite"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Selesai
            </span>
            <h2 className="text-2xl font-bold text-slate-900 pt-2">
              Bacaan telah selesai.
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Alhamdulillah, Anda telah menyelesaikan seluruh bagian dari{' '}
              <span className="font-medium text-slate-800">
                {reading.title}
              </span>
              .
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetAll}
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 px-6 py-3 rounded-xl transition-colors shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Baca Lagi
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-6 py-3 rounded-xl transition-colors"
            >
              Ke Halaman Utama
            </Link>
          </div>
        </section>
      ) : sections.length > 0 ? (
        /* Reading Mode & Interactive Section Reader */
        <div ref={readerRef} className="space-y-6 scroll-mt-6">
          {/* Section Progress Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span className="text-emerald-800 font-semibold">
                Bagian {activeIndex + 1} dari {sections.length}
              </span>
              <span>
                {Math.round(((activeIndex + 1) / sections.length) * 100)}% Total
              </span>
            </div>
            {/* Step Indicators */}
            <div className="flex gap-1.5">
              {sections.map((sec, idx) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Pindah ke bagian ${idx + 1}`}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    idx === activeIndex
                      ? 'bg-emerald-800'
                      : counts[idx] >= (sec.repeatCount || 1)
                      ? 'bg-emerald-300'
                      : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Active Section Main Content */}
          <div
            className={`p-6 sm:p-8 rounded-2xl bg-white border transition-all duration-200 shadow-xs space-y-6 ${
              isTargetReached
                ? 'border-emerald-300 ring-1 ring-emerald-300/50'
                : 'border-slate-200/90'
            }`}
          >
            {/* Title & Target Status */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
              <span className="text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-lg">
                Bagian {activeIndex + 1}: {currentSection.title || 'Bacaan'}
              </span>

              {isTargetReached ? (
                <span className="inline-flex items-center text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                  <svg
                    className="w-3.5 h-3.5 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Target Selesai
                </span>
              ) : targetCount > 1 ? (
                <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  Target: {targetCount}x
                </span>
              ) : null}
            </div>

            {/* Instruction */}
            {currentSection.instruction && (
              <div className="text-xs text-slate-600 bg-amber-50/70 border border-amber-200/60 p-3 rounded-lg flex items-start gap-2">
                <span className="font-semibold text-amber-800 shrink-0">
                  Petunjuk:
                </span>
                <span>{currentSection.instruction}</span>
              </div>
            )}

            {/* Arabic Text */}
            {currentSection.arabic && (
              <div
                className="text-right py-4 font-arabic text-2xl sm:text-3xl text-slate-900 leading-loose sm:leading-loose tracking-wide break-words"
                dir="rtl"
                lang="ar"
              >
                {currentSection.arabic}
              </div>
            )}

            {/* Transliteration */}
            {currentSection.transliteration && (
              <p className="text-sm sm:text-base font-medium text-emerald-950/90 italic leading-relaxed bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-100/50">
                {currentSection.transliteration}
              </p>
            )}

            {/* Translation */}
            {currentSection.translation && (
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-2">
                &ldquo;{currentSection.translation}&rdquo;
              </p>
            )}

            {/* Counter Section */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Hitungan Section
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                      {currentCount}
                    </span>
                    <span className="text-base sm:text-lg font-medium text-slate-400 font-mono">
                      / {targetCount}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetSection}
                  disabled={currentCount === 0}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                    currentCount === 0
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-500 hover:text-red-700 hover:bg-red-50 cursor-pointer'
                  }`}
                  aria-label="Reset hitungan bagian ini"
                >
                  Reset
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isTargetReached ? 'bg-emerald-600' : 'bg-emerald-800'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={currentCount}
                  aria-valuemin={0}
                  aria-valuemax={targetCount}
                  aria-label="Progress hitungan"
                />
              </div>

              {/* One-handed Tap Counter Button */}
              <button
                type="button"
                onClick={handleIncrement}
                className="w-full min-h-[64px] py-4 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded-xl font-bold shadow-xs transition-all duration-150 flex items-center justify-center cursor-pointer select-none active:scale-[0.98] touch-manipulation focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                aria-label={`Tambah hitungan, saat ini ${currentCount} dari ${targetCount}`}
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className={`flex-1 inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeIndex === 0
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200/50'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-2xs cursor-pointer active:scale-[0.99]'
              }`}
              aria-label="Ke bagian sebelumnya"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Sebelumnya
            </button>

            <button
              type="button"
              onClick={handleNext}
              className={`flex-1 inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-2xs cursor-pointer active:scale-[0.99] ${
                isTargetReached
                  ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                  : 'bg-white text-emerald-800 border border-emerald-800/30 hover:bg-emerald-50'
              }`}
              aria-label={
                activeIndex === sections.length - 1
                  ? 'Selesaikan bacaan'
                  : 'Ke bagian selanjutnya'
              }
            >
              {activeIndex === sections.length - 1
                ? 'Selesai'
                : 'Selanjutnya'}
              <svg
                className="w-4 h-4 ml-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : reading.content ? (
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed bg-white p-6 rounded-xl border border-slate-200/80">
          <p>{reading.content}</p>
        </div>
      ) : null}
    </article>
  );
}
