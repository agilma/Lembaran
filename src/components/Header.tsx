import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";
import { ThemeToggle } from "./ThemeToggle";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-[#faf9f6]/80 dark:bg-[#0b0f17]/80 border-b border-slate-200/70 dark:border-slate-800/80 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-800 dark:bg-emerald-700 text-amber-100 flex items-center justify-center font-serif text-lg font-bold shadow-xs group-hover:bg-emerald-900 dark:group-hover:bg-emerald-600 transition-colors">
            L
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-slate-100">
            Lembaran
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
          <ThemeToggle />
          <Link
            href="/"
            className="hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 hidden sm:inline-block"
          >
            Beranda
          </Link>
          <Link
            href="/riwayat"
            aria-label="Riwayat"
            title="Riwayat"
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400"
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Link>
          {user ? (
            <Link
              href="/login"
              aria-label={`Akun (${user.name || user.email})`}
              title={`Akun (${user.name || user.email})`}
              className="hover:opacity-90 transition-opacity py-1 flex items-center gap-1.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400 rounded-full"
            >
              <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-200/50 dark:border-emerald-800/50">
                <span>{user.name || user.email}</span>
                <span className="opacity-75">({user.role})</span>
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Masuk"
              title="Masuk"
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-emerald-400"
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
