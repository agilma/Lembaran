"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";

interface UserSessionInfo {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

interface LoginClientProps {
  initialUser: UserSessionInfo | null;
}

export default function LoginClient({ initialUser }: LoginClientProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage("Email atau kata sandi tidak valid.");
      } else {
        window.location.reload();
      }
    } catch {
      setErrorMessage("Terjadi kesalahan saat masuk. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {initialUser ? (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Profil Administrator</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Anda terautentikasi sebagai Administrator.</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Nama</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{initialUser.name || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Email</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{initialUser.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Peran</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-xs border border-emerald-200/50 dark:border-emerald-800/50">
                {initialUser.role}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-sm font-semibold rounded-xl transition-colors cursor-pointer border border-rose-200/50 dark:border-rose-800/50"
          >
            Keluar (Logout)
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Masuk Administrator</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Silakan masukkan email dan kata sandi Administrator</p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lembaran.app"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dark:focus:ring-emerald-500/20 focus:border-emerald-800 dark:focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dark:focus:ring-emerald-500/20 focus:border-emerald-800 dark:focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
