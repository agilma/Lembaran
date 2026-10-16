"use client";

import { useState } from "react";
import { deleteReading } from "@/app/actions/reading-management-actions";

interface DeleteReadingModalProps {
  reading: {
    id: string;
    title: string;
    slug: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteReadingModal({
  reading,
  onClose,
  onSuccess,
}: DeleteReadingModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const result = await deleteReading(reading.id);
      if (result.success) {
        onSuccess();
      } else {
        setErrorMessage(result.message || "Gagal menghapus bacaan.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
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
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h3 id="delete-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              Konfirmasi Penghapusan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Apakah Anda yakin ingin menghapus atau mengarsipkan bacaan{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                &ldquo;{reading.title}&rdquo;
              </span>
              ?
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 p-3 rounded-lg leading-relaxed">
          <strong>Aturan Keamanan:</strong> Jika bacaan ini pernah dibaca dan memiliki riwayat/progress pengguna, sistem akan mengarsipkannya secara otomatis untuk menjaga keutuhan riwayat. Jika belum pernah digunakan, data akan dihapus permanen.
        </p>

        {errorMessage && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Memproses...
              </>
            ) : (
              "Ya, Hapus / Arsipkan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
