import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";
import { Role } from "@/types/user";
import { getReadingsList } from "@/app/actions/reading-management-actions";
import { ReadingManagementTable } from "@/components/ReadingManagementTable";

export const metadata = {
  title: "Manajemen Bacaan - Lembaran",
  description: "Kelola konten bacaan, bagian-bagiannya, dan target hitungan.",
};

export default async function ReadingManagementListPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/manajemen/bacaan");
  }

  if (user.role !== Role.ADMIN && user.role !== Role.EDITOR) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Akses Ditolak</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Anda tidak memiliki izin untuk mengelola bacaan. Fitur ini hanya dapat diakses oleh peran <strong className="text-slate-800 dark:text-slate-200">ADMIN</strong> dan <strong className="text-slate-800 dark:text-slate-200">EDITOR</strong>. Peran Anda saat ini adalah <strong className="text-slate-800 dark:text-slate-200">{user.role}</strong>.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const response = await getReadingsList(true); // Include archived readings for management
  const readings = response.data || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              {user.role}
            </span>
            <span className="text-xs text-slate-400">• Desktop-First Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Manajemen Konten Bacaan
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Tambah, edit, atau arsir bacaan serta kelola bagian-bagiannya dan target hitungan secara mandiri.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors self-start md:self-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Beranda
        </Link>
      </div>

      {/* Main Table Content */}
      <ReadingManagementTable initialReadings={readings} />
    </div>
  );
}
