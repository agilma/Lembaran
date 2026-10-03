"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { editorWriteAction, adminOperationAction } from "@/app/actions/protected-actions";

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
  const [actionOutput, setActionOutput] = useState<string | null>(null);

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

  const fillQuickAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword("password123");
    setErrorMessage("");
  };

  const handleTestEditorWrite = async () => {
    setActionOutput("Menjalankan operasi penulisan server (EDITOR)...");
    const res = await editorWriteAction("Lembaran Baru");
    if (res.success) {
      setActionOutput(`✅ BERHASIL: ${res.message}`);
    } else {
      setActionOutput(`❌ DITOLAK: ${res.message}`);
    }
  };

  const handleTestAdminOp = async () => {
    setActionOutput("Menjalankan operasi administratif server (ADMIN)...");
    const res = await adminOperationAction("Pengaturan Sistem");
    if (res.success) {
      setActionOutput(`✅ BERHASIL: ${res.message}`);
    } else {
      setActionOutput(`❌ DITOLAK: ${res.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {initialUser ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-xl font-bold text-slate-900">Profil Pengguna</h1>
            <p className="text-sm text-slate-500 mt-1">Anda saat ini terautentikasi secara aman.</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Nama</span>
              <span className="font-semibold text-slate-800">{initialUser.name || "-"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-800">{initialUser.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Peran (Role)</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200/50">
                {initialUser.role}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Uji Otorisasi Server-Side (RBAC)
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleTestEditorWrite}
                className="w-full text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors"
              >
                Uji Write (EDITOR)
              </button>
              <button
                type="button"
                onClick={handleTestAdminOp}
                className="w-full text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors"
              >
                Uji Admin (ADMIN)
              </button>
            </div>

            {actionOutput && (
              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono break-words">
                {actionOutput}
              </div>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-sm font-semibold rounded-xl transition-colors"
          >
            Keluar (Logout)
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Masuk ke Lembaran</h1>
            <p className="text-sm text-slate-500">Gunakan akun Anda untuk mengakses fitur terproteksi</p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-xs text-slate-400 font-medium">Akun Pengujian (Klik untuk mengisi):</p>
            <div className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => fillQuickAccount("viewer@lembaran.app")}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex justify-between items-center text-slate-600 border border-transparent hover:border-slate-200"
              >
                <span>viewer@lembaran.app</span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px]">VIEWER</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("editor@lembaran.app")}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex justify-between items-center text-slate-600 border border-transparent hover:border-slate-200"
              >
                <span>editor@lembaran.app</span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px]">EDITOR</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount("admin@lembaran.app")}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex justify-between items-center text-slate-600 border border-transparent hover:border-slate-200"
              >
                <span>admin@lembaran.app</span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px]">ADMIN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
