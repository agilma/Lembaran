import { notFound } from 'next/navigation';
import Link from 'next/link';
import { readingsData } from '@/data/readings';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return readingsData.map((reading) => ({
    slug: reading.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reading = readingsData.find((item) => item.slug === slug);

  if (!reading) {
    return {
      title: 'Bacaan Tidak Ditemukan',
    };
  }

  return {
    title: reading.title,
    description: reading.description,
  };
}

export default async function ReadingDetailPage({ params }: Props) {
  const { slug } = await params;
  const reading = readingsData.find((item) => item.slug === slug);

  if (!reading) {
    notFound();
  }

  return (
    <article className="space-y-8 pb-12">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-emerald-800 transition-colors group"
        >
          <svg
            className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800">
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
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            {reading.description}
          </p>

          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 px-5 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 h1 0 0010 9.87v4.263a1 h1 0 001.555.832l3.197-2.132a1 h1 0 000-1.664z"
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
        </header>
      </div>

      {/* Main Content Body / Sections */}
      {reading.content && (
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
          <p>{reading.content}</p>
        </div>
      )}

      {reading.sections && reading.sections.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-500">
              Bagian Bacaan ({reading.sections.length})
            </h2>
          </div>

          <div className="space-y-6">
            {reading.sections.map((section, idx) => (
              <div
                key={section.id}
                className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200/70 shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
                    #{idx + 1} {section.title || 'Bagian'}
                  </span>
                  {section.repeatCount && (
                    <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200/60">
                      Dibaca {section.repeatCount}x
                    </span>
                  )}
                </div>

                {section.instruction && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                    Petunjuk: {section.instruction}
                  </p>
                )}

                {section.arabic && (
                  <div
                    className="text-right py-3 font-arabic text-2xl sm:text-3xl text-slate-900 leading-loose"
                    dir="rtl"
                  >
                    {section.arabic}
                  </div>
                )}

                {section.transliteration && (
                  <p className="text-sm font-medium text-emerald-900/90 italic leading-relaxed">
                    {section.transliteration}
                  </p>
                )}

                {section.translation && (
                  <p className="text-sm text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                    &ldquo;{section.translation}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
