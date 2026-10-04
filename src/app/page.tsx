import Link from 'next/link';
import { readingsData } from '@/data/readings';

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero / Intro Section */}
      <section className="text-center py-6 sm:py-8 border-b border-slate-200/60 dark:border-slate-800">
        <span className="inline-block px-3 py-1 text-xs font-medium bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50 rounded-full mb-3">
          Ruang Membaca & Amalan
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 max-w-xl mx-auto leading-snug">
          Lembaran membantu membaca, menghitung, dan mencatat bacaan atau amalan dalam satu tempat.
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Nikmati pengalaman membaca yang tenang, bersih, dan nyaman di mana saja.
        </p>
      </section>

      {/* Reading List Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Daftar Bacaan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih bacaan atau amalan yang ingin Anda baca
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200/50 dark:border-slate-700/50">
            {readingsData.length} Bacaan
          </span>
        </div>

        <div className="divide-y divide-slate-200/80 dark:divide-slate-800 border-t border-b border-slate-200/80 dark:border-slate-800">
          {readingsData.map((reading) => (
            <div
              key={reading.id}
              className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors -mx-4 px-4 rounded-lg"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                    {reading.category}
                  </span>
                  {reading.estimatedTime && (
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      • {reading.estimatedTime}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  <Link
                    href={`/bacaan/${reading.slug}`}
                    className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
                  >
                    {reading.title}
                  </Link>
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {reading.description}
                </p>
              </div>

              <div className="shrink-0 self-start sm:self-center">
                <Link
                  href={`/bacaan/${reading.slug}`}
                  className="inline-flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white px-3.5 py-2 rounded-md transition-colors shadow-2xs"
                >
                  Buka Bacaan
                  <svg
                    className="w-3.5 h-3.5 ml-1.5 text-slate-500 dark:text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
