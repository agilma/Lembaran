"use client";

import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizeCallbackUrl } from "@/lib/url-utils";

interface UserSessionInfo {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

interface LoginClientProps {
  initialUser: UserSessionInfo | null;
}

type AuthMode = "login" | "register" | "forgot";

export default function LoginClient({ initialUser }: LoginClientProps) {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = sanitizeCallbackUrl(rawCallbackUrl, "/riwayat");

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [, startTransition] = useTransition();

  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam) {
      if (errorParam === "InvalidVerificationCode") {
        setErrorMessage("Sesi verifikasi atau login tidak valid atau kadaluarsa.");
      } else if (
        errorParam.includes("access_denied") ||
        errorParam.toLowerCase().includes("denied")
      ) {
        setErrorMessage("Login dengan Google dibatalkan atau tidak diizinkan.");
      } else {
        setErrorMessage(errorParam);
      }
    }
  }, [errorParam]);

  const clearGuestLocalProgress = () => {
    if (typeof window === "undefined") return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("lembaran_progress_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsGoogleLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        if (
          error.message.includes("provider is not enabled") ||
          error.message.includes("Unsupported provider")
        ) {
          setErrorMessage("Login Google belum dikonfigurasi pada server Supabase.");
        } else {
          setErrorMessage(error.message || "Gagal melakukan masuk dengan akun Google.");
        }
        setIsGoogleLoading(false);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat mencoba masuk dengan Google.");
      setIsGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      clearGuestLocalProgress();
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      setErrorMessage("Gagal melakukan keluar akun.");
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Email atau kata sandi tidak valid.");
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage("Email Anda belum diverifikasi. Silakan periksa kotak masuk email Anda.");
        } else {
          setErrorMessage(error.message || "Terjadi kesalahan saat masuk. Silakan coba lagi.");
        }
        setIsLoading(false);
        return;
      }

      startTransition(() => {
        window.location.href = callbackUrl;
      });
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat masuk.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 6) {
      setErrorMessage("Kata sandi minimal harus 6 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setErrorMessage("Email sudah terdaftar. Silakan masuk akun.");
        } else {
          setErrorMessage(error.message || "Gagal melakukan pendaftaran.");
        }
        setIsLoading(false);
        return;
      }

      if (data.session) {
        setSuccessMessage("Pendaftaran berhasil!");
        startTransition(() => {
          window.location.href = callbackUrl;
        });
      } else {
        setSuccessMessage(
          "Pendaftaran berhasil! Tautan verifikasi email telah dikirimkan ke email Anda. Silakan periksa pesan masuk email Anda untuk mengonfirmasi akun."
        );
        setEmail("");
        setPassword("");
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat pendaftaran.");
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setErrorMessage(error.message || "Gagal mengirim email reset password.");
      } else {
        setSuccessMessage(
          "Tautan untuk mengatur ulang kata sandi telah dikirim ke email Anda. Silakan periksa email Anda."
        );
        setEmail("");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem saat memproses permintaan reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {initialUser ? (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Profil Akun</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Anda terautentikasi dalam aplikasi Lembaran.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Nama</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {initialUser.name || "-"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Email</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {initialUser.email}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400">Peran</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded text-xs border border-emerald-200/50 dark:border-emerald-800/50">
                {initialUser.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-sm font-semibold rounded-xl transition-colors cursor-pointer border border-rose-200/50 dark:border-rose-800/50 disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Keluar"}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-6">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                mode === "login"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
                mode === "register"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Daftar Akun
            </button>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mode === "login"
                ? "Masuk Akun"
                : mode === "register"
                ? "Daftar Akun"
                : "Lupa Password"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Silakan masukkan email dan kata sandi Anda"
                : mode === "register"
                ? "Buat akun baru untuk menyinkronkan riwayat amalan"
                : "Masukkan email untuk menerima instruksi reset password"}
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

          {(mode === "login" || mode === "register") && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-sm border border-slate-300 dark:border-slate-700 shadow-2xs flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {isGoogleLoading
                  ? "Memproses..."
                  : mode === "login"
                  ? "Masuk dengan Google"
                  : "Daftar dengan Google"}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400 font-medium">
                    atau
                  </span>
                </div>
              </div>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dark:focus:ring-emerald-500/20 focus:border-emerald-800 dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="text-xs text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                </div>
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
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Memproses..." : "Masuk Akun"}
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dark:focus:ring-emerald-500/20 focus:border-emerald-800 dark:focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi (min. 6 karakter)
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

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Memproses..." : "Daftar Akun"}
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 dark:focus:ring-emerald-500/20 focus:border-emerald-800 dark:focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "Memproses..." : "Kirim Tautan Reset Password"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  ← Kembali ke Masuk Akun
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
