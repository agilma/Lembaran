"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message || "Gagal memperbarui kata sandi.");
      } else {
        setSuccessMessage("Kata sandi Anda telah berhasil diperbarui. Mengalihkan ke halaman masuk...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat memperbarui kata sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Atur Ulang Kata Sandi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Masukkan kata sandi baru untuk akun Anda
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kata Sandi Baru (min. 6 karakter)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dark:focus:ring-emerald-500/20 focus:border-emerald-800 dark:focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dark:focus:ring-emerald-500/20 focus:border-emerald-800 dark:focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Memproses..." : "Simpan Kata Sandi Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}
