'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PWAUpdateManager } from '@/lib/pwa-update';

export default function UpdateNotification() {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const managerRef = useRef<PWAUpdateManager | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const manager = new PWAUpdateManager({
      onUpdateAvailable: () => {
        setShowDialog(true);
      },
      onUpdateDismissed: () => {
        setShowDialog(false);
      },
    });

    managerRef.current = manager;
    manager.init();

    return () => {
      manager.cleanup();
    };
  }, []);

  const handleRefresh = () => {
    if (managerRef.current) {
      managerRef.current.refresh();
    } else {
      setShowDialog(false);
    }
  };

  const handleLater = () => {
    if (managerRef.current) {
      managerRef.current.dismiss();
    } else {
      setShowDialog(false);
    }
  };

  if (!showDialog) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-dialog-title"
      aria-describedby="update-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-5 transform transition-all">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5"
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
          </div>
          <div className="space-y-1">
            <h2
              id="update-dialog-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight"
            >
              Pembaruan tersedia
            </h2>
            <p
              id="update-dialog-description"
              className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
            >
              Versi terbaru Lembaran sudah tersedia. Perbarui aplikasi untuk menggunakan versi terbaru.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={handleLater}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400"
          >
            Nanti
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors shadow-xs cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400"
          >
            Refresh sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
