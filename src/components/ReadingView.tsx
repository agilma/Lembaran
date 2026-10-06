'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Reading } from '@/types/reading';
import {
  recordReadingCompletion,
  getReadingProgress,
  saveReadingProgress,
  deleteReadingProgress,
} from '@/app/actions/reading-actions';

interface ReadingViewProps {
  reading: Reading;
}

const TRANSLATION_CHAR_LIMIT = 180;

export function ReadingView({ reading }: ReadingViewProps) {
  const sections = reading.sections || [];
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [counts, setCounts] = useState<number[]>(() =>
    new Array(sections.length).fill(0)
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isTranslationExpanded, setIsTranslationExpanded] = useState<boolean>(false);
  const [isProgressLoaded, setIsProgressLoaded] = useState<boolean>(false);
  const readerRef = useRef<HTMLDivElement>(null);

  const scrollToReader = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Load initial saved progress from server (Supabase) or guest fallback (localStorage)
  useEffect(() => {
    let isSubscribed = true;

    async function loadProgress() {
      if (sections.length === 0) {
        setIsProgressLoaded(true);
        return;
      }

      const storageKey = `lembaran_progress_${reading.slug}`;

      try {
        // Attempt to fetch saved progress from server (authenticated user)
        const res = await getReadingProgress(reading.slug);

        if (isSubscribed && res.success && res.data) {
          const { activeIndex: savedIndex, counts: savedCounts } = res.data;
          let validIndex = 0;
          if (
            typeof savedIndex === 'number' &&
            savedIndex >= 0 &&
            savedIndex < sections.length
          ) {
            validIndex = savedIndex;
          }

          const validCounts = new Array(sections.length).fill(0);
          if (Array.isArray(savedCounts)) {
            for (let i = 0; i < sections.length; i++) {
              if (typeof savedCounts[i] === 'number') {
                validCounts[i] = savedCounts[i];
              }
            }
          }

          setActiveIndex(validIndex);
          setCounts(validCounts);
          setIsProgressLoaded(true);
          return;
        }

        // Fallback for guest or when no server progress exists
        const localDataString = localStorage.getItem(storageKey);
        if (isSubscribed && localDataString) {
          try {
            const parsed = JSON.parse(localDataString);
            if (parsed && typeof parsed === 'object') {
              const savedIndex = parsed.activeIndex;
              const savedCounts = parsed.counts;

              let validIndex = 0;
              if (
                typeof savedIndex === 'number' &&
                savedIndex >= 0 &&
                savedIndex < sections.length
              ) {
                validIndex = savedIndex;
              }

              const validCounts = new Array(sections.length).fill(0);
              if (Array.isArray(savedCounts)) {
                for (let i = 0; i < sections.length; i++) {
                  if (typeof savedCounts[i] === 'number') {
                    validCounts[i] = savedCounts[i];
                  }
                }
              }

              setActiveIndex(validIndex);
              setCounts(validCounts);
            }
          } catch (e) {
            console.error('Failed to parse local reading progress:', e);
          }
        }
      } catch (err) {
        console.error('Error loading reading progress:', err);
      } finally {
        if (isSubscribed) {
          setIsProgressLoaded(true);
        }
      }
    }

    loadProgress();

    return () => {
      isSubscribed = false;
    };
  }, [reading.slug, sections.length]);

  // Reset translation collapse state whenever section changes
  useEffect(() => {
    setIsTranslationExpanded(false);
  }, [activeIndex]);

  // Auto-save progress on activeIndex or counts update
  const persistProgress = useCallback(
    (newIndex: number, newCounts: number[]) => {
      if (!isProgressLoaded || isCompleted || sections.length === 0) return;

      const storageKey = `lembaran_progress_${reading.slug}`;

      // Save locally (for guest and fast local state)
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            activeIndex: newIndex,
            counts: newCounts,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.error('Failed to write to localStorage:', e);
      }

      // Save to Supabase (background fire-and-forget for logged-in user)
      saveReadingProgress({
        readingSlug: reading.slug,
        activeIndex: newIndex,
        counts: newCounts,
      }).catch((err) => {
        console.error('Background progress save error:', err);
      });
    },
    [isProgressLoaded, isCompleted, sections.length, reading.slug]
  );

  const currentSection = sections[activeIndex];
  const hasCounter =
    typeof currentSection?.repeatCount === 'number' &&
    currentSection.repeatCount > 0;
  const targetCount = currentSection?.repeatCount || 0;
  const currentCount = counts[activeIndex] || 0;
  const isTargetReached = hasCounter && currentCount >= targetCount;
  const progressPercent = hasCounter
    ? Math.min(100, Math.round((currentCount / targetCount) * 100))
    : 0;

  const translationText = currentSection?.translation || '';
  const isLongTranslation = translationText.length > TRANSLATION_CHAR_LIMIT;

  const handleIncrement = () => {
    const updatedCounts = [...counts];
    updatedCounts[activeIndex] = (updatedCounts[activeIndex] || 0) + 1;
    setCounts(updatedCounts);
    persistProgress(activeIndex, updatedCounts);
  };

  const handleResetSection = () => {
    const updatedCounts = [...counts];
    updatedCounts[activeIndex] = 0;
    setCounts(updatedCounts);
    persistProgress(activeIndex, updatedCounts);
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      const nextIndex = activeIndex - 1;
      setActiveIndex(nextIndex);
      persistProgress(nextIndex, counts);
      scrollToReader();
    }
  };

  const handleNext = () => {
    if (activeIndex < sections.length - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      persistProgress(nextIndex, counts);
      scrollToReader();
    } else {
      // Completed reading!
      setIsCompleted(true);
      scrollToReader();

      const totalCount = counts.reduce((sum, val) => sum + val, 0);
      const totalTarget = sections.reduce(
        (sum, sec) => sum + (sec.repeatCount || 0),
        0
      );

      // 1. Record completion history
      recordReadingCompletion({
        readingSlug: reading.slug,
        count: totalCount > 0 ? totalCount : null,
        target: totalTarget > 0 ? totalTarget : null,
      }).catch((err) => {
        console.error('Non-blocking persistence error:', err);
      });

      // 2. Clear saved active progress in Supabase and localStorage
      deleteReadingProgress(reading.slug).catch((err) => {
        console.error('Failed to delete server progress:', err);
      });
      try {
        localStorage.removeItem(`lembaran_progress_${reading.slug}`);
      } catch (e) {
        console.error('Failed to clear local progress:', e);
      }
    }
  };

  const handleResetAll = () => {
    const zeroCounts = new Array(sections.length).fill(0);
    setCounts(zeroCounts);
    setActiveIndex(0);
    setIsCompleted(false);

    try {
      localStorage.removeItem(`lembaran_progress_${reading.slug}`);
    } catch (e) {
      console.error('Failed to clear local progress on reset:', e);
    }
    deleteReadingProgress(reading.slug).catch(() => {});
  };

  return (
    <article className="space-y-6 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:pb-16 max-w-2xl mx-auto px-1 sm:px-0">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 rounded-md py-1 px-1 -ml-1"
        >
          <svg
            className="w-4 h-4 mr-1 shrink-0 transition-transform group-hover:-translate-x-0.5"
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

        <header className="border-b border-slate-200/80 dark:border-slate-800 pb-6 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {reading.category && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                {reading.category}
              </span>
            )}
            {reading.estimatedTime && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                • Estimasi: {reading.estimatedTime}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {reading.title}
          </h1>
          {reading.description && (
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {reading.description}
            </p>
          )}

          {!isCompleted && sections.length > 0 && (
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={scrollToReader}
                className="inline-flex items-center justify-center text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 px-5 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer active:scale-[0.99] touch-manipulation focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                Mulai Membaca
              </button>
            </div>
          )}
        </header>
      </div>

      {/* Completion View */}
      {isCompleted ? (
        <section
          className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs text-center space-y-6"
          aria-live="polite"
        >
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200/50 dark:border-emerald-800/50">
            ✓
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
              Selesai
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 pt-2">
              Bacaan telah selesai.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Alhamdulillah, Anda telah menyelesaikan seluruh bagian dari{' '}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {reading.title}
              </span>
              .
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetAll}
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 px-6 py-3 rounded-xl transition-colors shadow-xs cursor-pointer active:scale-[0.99] touch-manipulation focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <svg
                className="w-4 h-4 mr-2 shrink-0"
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
              className="w-full sm:w-auto inline-flex items-center justify-center text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 px-6 py-3 rounded-xl transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              Ke Halaman Utama
            </Link>
          </div>
        </section>
      ) : sections.length > 0 ? (
        /* Reading Mode & Interactive Section Reader */
        <div ref={readerRef} className="space-y-6 scroll-mt-20">
          {/* Section Progress Bar */}
          {sections.length > 1 && (
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="text-emerald-800 dark:text-emerald-400 font-semibold">
                  Bagian {activeIndex + 1} dari {sections.length}
                </span>
                <span>
                  {Math.round(((activeIndex + 1) / sections.length) * 100)}% Total
                </span>
              </div>
              {/* Step Indicators */}
              <div className="flex gap-1.5 items-center py-1">
                {sections.map((sec, idx) => {
                  const isCurrent = idx === activeIndex;
                  const isPassed = idx < activeIndex;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setActiveIndex(idx);
                        persistProgress(idx, counts);
                        scrollToReader();
                      }}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Pindah ke bagian ${idx + 1}${
                        sec.title ? `: ${sec.title}` : ''
                      }`}
                      className="py-2.5 -my-2.5 flex-1 group cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 rounded-full"
                    >
                      <span
                        className={`block h-2 rounded-full transition-all ${
                          isCurrent
                            ? 'bg-emerald-800 dark:bg-emerald-500 shadow-xs'
                            : isPassed
                            ? 'bg-emerald-400 dark:bg-emerald-700'
                            : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Section Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6">
            {/* Title & Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 flex-wrap gap-2">
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-3 py-1 rounded-lg">
                {currentSection.title
                  ? `Bagian ${activeIndex + 1}: ${currentSection.title}`
                  : `Bagian ${activeIndex + 1}`}
              </span>

              {hasCounter && isTargetReached && (
                <span className="inline-flex items-center text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                  <svg
                    className="w-3.5 h-3.5 mr-1 shrink-0"
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
              )}
            </div>

            {/* Instruction */}
            {currentSection.instruction && (
              <div className="text-xs text-slate-600 dark:text-amber-200/90 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 p-3 rounded-lg flex items-start gap-2">
                <span className="font-semibold text-amber-800 dark:text-amber-300 shrink-0">
                  Petunjuk:
                </span>
                <span>{currentSection.instruction}</span>
              </div>
            )}

            {/* Arabic Text */}
            {currentSection.arabic && (
              <div
                className="text-right py-4 sm:py-6 font-arabic text-2xl sm:text-3xl text-slate-900 dark:text-amber-100 leading-loose sm:leading-[2.3] tracking-wide break-words select-text"
                dir="rtl"
                lang="ar"
              >
                {currentSection.arabic}
              </div>
            )}

            {/* Transliteration */}
            {currentSection.transliteration && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Transliterasi
                </p>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 italic leading-relaxed bg-slate-50/70 dark:bg-slate-800/70 p-3.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  {currentSection.transliteration}
                </p>
              </div>
            )}

            {/* Translation (Collapsible for long text) */}
            {currentSection.translation && (
              <div className="space-y-1 pt-1">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Terjemahan
                </p>
                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p>
                    &ldquo;
                    {isLongTranslation && !isTranslationExpanded
                      ? `${translationText.slice(0, TRANSLATION_CHAR_LIMIT).trim()}...`
                      : translationText}
                    &rdquo;
                  </p>
                  {isLongTranslation && (
                    <button
                      type="button"
                      onClick={() =>
                        setIsTranslationExpanded(!isTranslationExpanded)
                      }
                      aria-expanded={isTranslationExpanded}
                      className="mt-1.5 inline-flex items-center text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 rounded-sm"
                    >
                      {isTranslationExpanded ? (
                        <>
                          <span>Sembunyikan</span>
                          <svg
                            className="w-3.5 h-3.5 ml-1 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>Baca selengkapnya</span>
                          <svg
                            className="w-3.5 h-3.5 ml-1 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Counter Section (OPTIONAL: rendered ONLY if repeatCount is set) */}
            {hasCounter && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Hitungan
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                        {currentCount}
                      </span>
                      <span className="text-base sm:text-lg font-medium text-slate-400 dark:text-slate-500 font-mono">
                        / {targetCount}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSection}
                    disabled={currentCount === 0}
                    className={`min-h-[36px] inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 ${
                      currentCount === 0
                        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        : 'text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer'
                    }`}
                    aria-label="Reset hitungan bagian ini"
                  >
                    Reset
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isTargetReached
                        ? 'bg-emerald-600 dark:bg-emerald-500'
                        : 'bg-emerald-800 dark:bg-emerald-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={currentCount}
                    aria-valuemin={0}
                    aria-valuemax={targetCount}
                    aria-label="Progress hitungan"
                  />
                </div>

                {/* Mobile Touch Counter Button */}
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-full min-h-[60px] py-4 px-5 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 active:bg-emerald-950 text-white rounded-xl font-bold shadow-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.98] touch-manipulation focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                  aria-label={`Tambah hitungan, saat ini ${currentCount} dari ${targetCount}`}
                >
                  <svg
                    className="w-6 h-6 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-base sm:text-lg">Tambah Hitungan</span>
                </button>
              </div>
            )}
          </div>

          {/* Section Navigation Flow */}
          <nav
            aria-label="Navigasi Bagian Bacaan"
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:static sm:z-auto sm:bg-transparent sm:border-0 sm:p-0 sm:pb-0 sm:backdrop-blur-none transition-all"
          >
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 sm:pt-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className={`flex-1 min-h-[48px] inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  activeIndex === 0
                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed border border-slate-200/50 dark:border-slate-800'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-[0.99] touch-manipulation'
                }`}
                aria-label="Ke bagian sebelumnya"
              >
                <svg
                  className="w-4 h-4 mr-1.5 shrink-0"
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
                className="flex-1 min-h-[48px] inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold bg-emerald-800 dark:bg-emerald-700 text-white hover:bg-emerald-900 dark:hover:bg-emerald-600 shadow-2xs cursor-pointer active:scale-[0.99] transition-all touch-manipulation focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                aria-label={
                  activeIndex === sections.length - 1
                    ? 'Selesaikan bacaan'
                    : 'Ke bagian selanjutnya'
                }
              >
                <span>{activeIndex === sections.length - 1 ? 'Selesai' : 'Selanjutnya'}</span>
                <svg
                  className="w-4 h-4 ml-1.5 shrink-0"
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
          </nav>
        </div>
      ) : reading.content ? (
        <div className="prose dark:prose-invert prose-slate max-w-none text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <p>{reading.content}</p>
        </div>
      ) : null}
    </article>
  );
}
