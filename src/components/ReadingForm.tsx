"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Reading } from "@/types/reading";
import {
  createReading,
  updateReading,
  ReadingInputData,
} from "@/app/actions/reading-management-actions";

interface ReadingFormProps {
  initialData?: Reading;
  mode: "create" | "edit";
}

interface FormSectionState {
  id?: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  instruction: string;
  repeatCount: string; // Keep as string for form input, parse on submit
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ReadingForm({ initialData, mode }: ReadingFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [autoSlug, setAutoSlug] = useState(mode === "create");
  const [category, setCategory] = useState(initialData?.category || "Sholawat");
  const [estimatedTime, setEstimatedTime] = useState(initialData?.estimatedTime || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [content, setContent] = useState(initialData?.content || "");

  const [sections, setSections] = useState<FormSectionState[]>(() => {
    if (initialData?.sections && initialData.sections.length > 0) {
      return initialData.sections.map((sec) => ({
        id: sec.id,
        title: sec.title || "",
        arabic: sec.arabic || "",
        transliteration: sec.transliteration || "",
        translation: sec.translation || "",
        instruction: sec.instruction || "",
        repeatCount: sec.repeatCount !== undefined && sec.repeatCount !== null ? String(sec.repeatCount) : "",
      }));
    }
    return [
      {
        id: `sec-${Date.now()}-1`,
        title: "",
        arabic: "",
        transliteration: "",
        translation: "",
        instruction: "",
        repeatCount: "",
      },
    ];
  });

  const [deletingSectionIndex, setDeletingSectionIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug && mode === "create") {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setAutoSlug(false);
    setSlug(val.toLowerCase().replace(/\s+/g, "-"));
  };

  const handleSectionChange = (index: number, field: keyof FormSectionState, val: string) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleAddSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}-${prev.length + 1}`,
        title: "",
        arabic: "",
        transliteration: "",
        translation: "",
        instruction: "",
        repeatCount: "",
      },
    ]);
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setSections((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleConfirmDeleteSection = (index: number) => {
    if (sections.length <= 1) {
      setErrorMessage("Bacaan harus memiliki setidaknya satu bagian.");
      return;
    }
    setSections((prev) => prev.filter((_, i) => i !== index));
    setDeletingSectionIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: ReadingInputData = {
        title,
        slug,
        category,
        description,
        estimatedTime: estimatedTime || undefined,
        content: content || undefined,
        sections: sections.map((sec) => ({
          id: sec.id,
          title: sec.title,
          arabic: sec.arabic,
          transliteration: sec.transliteration,
          translation: sec.translation,
          instruction: sec.instruction,
          repeatCount: sec.repeatCount,
        })),
      };

      const result =
        mode === "create"
          ? await createReading(payload)
          : await updateReading(initialData!.id, payload);

      if (result.success) {
        setSuccessMessage(result.message);
        setTimeout(() => {
          router.push("/manajemen/bacaan");
          router.refresh();
        }, 1200);
      } else {
        setErrorMessage(result.message || "Gagal menyimpan bacaan.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan server.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Top Banner Alert */}
      {errorMessage && (
        <div className="p-4 text-sm font-medium text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 text-sm font-medium text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>{successMessage}</div>
        </div>
      )}

      {/* Metadata Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Informasi Utama Bacaan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Atur judul, identifier (slug), kategori, dan estimasi waktu membaca.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Judul */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Bacaan <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Contoh: Sholawat Wahidiyah"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label htmlFor="slug" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Slug / Identifier Unik <span className="text-rose-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              required
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="sholawat-wahidiyah"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono"
            />
            <p className="text-[11px] text-slate-400">Digunakan sebagai rute URL (/bacaan/slug).</p>
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <label htmlFor="category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              id="category"
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Sholawat, Dzikir, Doa, Al-Fatihah"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Estimasi Waktu */}
          <div className="space-y-1.5">
            <label htmlFor="estimatedTime" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Estimasi Waktu Membaca
            </label>
            <input
              id="estimatedTime"
              type="text"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="10-15 Menit"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="description" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi Singkat
            </label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Penjelasan singkat mengenai keutamaan atau latar belakang bacaan ini..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Sections List Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Bagian Bacaan ({sections.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Atur urutan, teks arab, transliterasi, terjemahan, dan target hitungan per bagian.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSection}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tambah Bagian
          </button>
        </div>

        <div className="space-y-6">
          {sections.map((sec, idx) => (
            <div
              key={sec.id || `section-${idx}`}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4 relative"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-mono text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Bagian #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveSection(idx, "up")}
                    disabled={idx === 0}
                    title="Pindahkan Ke Atas"
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveSection(idx, "down")}
                    disabled={idx === sections.length - 1}
                    title="Pindahkan Ke Bawah"
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Delete Section */}
                  <button
                    type="button"
                    onClick={() => setDeletingSectionIndex(idx)}
                    title="Hapus Bagian"
                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 cursor-pointer ml-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Section Delete Confirmation Alert */}
              {deletingSectionIndex === idx && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-rose-800 dark:text-rose-200">
                    Hapus bagian #{idx + 1}? Tindakan ini tidak dapat dibatalkan.
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeletingSectionIndex(null)}
                      className="px-2.5 py-1 font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDeleteSection(idx)}
                      className="px-2.5 py-1 font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                    >
                      Hapus Bagian
                    </button>
                  </div>
                </div>
              )}

              {/* Section Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Sub-judul Bagian */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sub-Judul Bagian (Opsional)
                  </label>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => handleSectionChange(idx, "title", e.target.value)}
                    placeholder="misal: Ilaa Hadhroti Sayyidinaa..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                {/* Target Hitungan (Configurable Counts) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Hitungan
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sec.repeatCount}
                    onChange={(e) => handleSectionChange(idx, "repeatCount", e.target.value)}
                    placeholder="misal: 7 (kosong = tanpa target)"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Kosongkan atau isi 0 jika tanpa target.</p>
                </div>

                {/* Teks Arab */}
                <div className="space-y-1 md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Teks Arab
                  </label>
                  <textarea
                    rows={2}
                    dir="rtl"
                    value={sec.arabic}
                    onChange={(e) => handleSectionChange(idx, "arabic", e.target.value)}
                    placeholder="النص العربي..."
                    className="w-full px-3 py-2 text-base font-serif rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-loose"
                  />
                </div>

                {/* Transliterasi */}
                <div className="space-y-1 md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Transliterasi (Latin)
                  </label>
                  <textarea
                    rows={2}
                    value={sec.transliteration}
                    onChange={(e) => handleSectionChange(idx, "transliteration", e.target.value)}
                    placeholder="Teks bacaan dalam huruf latin..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                {/* Terjemahan */}
                <div className="space-y-1 md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Terjemahan Bahasa Indonesia
                  </label>
                  <textarea
                    rows={2}
                    value={sec.translation}
                    onChange={(e) => handleSectionChange(idx, "translation", e.target.value)}
                    placeholder="Arti / terjemahan..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                {/* Instruksi Tambahan */}
                <div className="space-y-1 md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Instruksi / Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={sec.instruction}
                    onChange={(e) => handleSectionChange(idx, "instruction", e.target.value)}
                    placeholder="misal: Membaca Surat Al-Fatihah 7x..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Submit & Cancel */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/manajemen/bacaan"
          className="px-5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          Batal
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-xs font-bold text-amber-100 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Menyimpan...
            </>
          ) : mode === "create" ? (
            "Tambah Bacaan"
          ) : (
            "Simpan Perubahan"
          )}
        </button>
      </div>
    </form>
  );
}
