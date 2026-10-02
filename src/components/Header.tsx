import Link from 'next/link';

export default function Header() {
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
        </nav>
      </div>
    </header>
  );
}
