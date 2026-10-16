import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";
import { Role } from "@/types/user";
import { ReadingForm } from "@/components/ReadingForm";

export const metadata = {
  title: "Tambah Bacaan Baru - Lembaran",
  description: "Buat konten bacaan baru beserta bagian-bagian dan target hitungannya.",
};

export default async function TambahBacaanPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/manajemen/bacaan/tambah");
  }

  if (user.role !== Role.ADMIN && user.role !== Role.EDITOR) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Akses Ditolak</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Anda tidak memiliki izin untuk menambah bacaan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Tambah Bacaan Baru
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Isi informasi bacaan, tambahkan bagian-bagiannya, dan tentukan target hitungan per bagian.
          </p>
        </div>

        <Link
          href="/manajemen/bacaan"
          className="inline-flex items-center text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Batal & Kembali
        </Link>
      </div>

      <ReadingForm mode="create" />
    </div>
  );
}
