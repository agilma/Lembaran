import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-[#faf9f6]/80 border-b border-slate-200/70">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-100 flex items-center justify-center font-serif text-lg font-bold shadow-xs group-hover:bg-emerald-900 transition-colors">
            L
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900">
            Lembaran
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link
            href="/"
            className="hover:text-emerald-800 transition-colors py-1"
          >
            Beranda
          </Link>
          <Link
            href="/login"
            className="hover:text-emerald-800 transition-colors py-1 flex items-center gap-1.5"
          >
            {user ? (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-xs px-2 py-0.5 rounded-full font-semibold">
                <span>{user.name || user.email}</span>
                <span className="opacity-75">({user.role})</span>
              </span>
            ) : (
              <span>Masuk</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
