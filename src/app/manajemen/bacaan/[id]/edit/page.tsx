import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";
import { Role } from "@/types/user";
import { getReadingById } from "@/app/actions/reading-management-actions";
import { ReadingForm } from "@/components/ReadingForm";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Bacaan - Lembaran",
  description: "Ubah konten bacaan, bagian-bagiannya, dan target hitungannya.",
};

export default async function EditBacaanPage({ params }: Props) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    redirect(`/login?callbackUrl=/manajemen/bacaan/${id}/edit`);
  }

  if (user.role !== Role.ADMIN && user.role !== Role.EDITOR) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Akses Ditolak</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Anda tidak memiliki izin untuk mengedit bacaan.
        </p>
      </div>
    );
  }

  const result = await getReadingById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const reading = result.data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              ID: {id.slice(0, 8)}...
            </span>
            {reading.isArchived && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                Diarsipkan
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Edit Bacaan: {reading.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Perbarui informasi bacaan, ubah urutan bagian, atau sesuaikan target hitungan per bagian.
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

      <ReadingForm mode="edit" initialData={reading} />
    </div>
  );
}
