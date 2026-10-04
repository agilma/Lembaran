import { getCurrentUser } from "@/lib/auth-utils";
import { getReadingHistory } from "@/app/actions/reading-actions";
import RiwayatClient from "./riwayat-client";

export const metadata = {
  title: "Riwayat Bacaan - Lembaran",
  description: "Catatan riwayat penyelesaian bacaan dan amalan",
};

export default async function RiwayatPage() {
  const user = await getCurrentUser();
  const historyRes = await getReadingHistory();

  return (
    <RiwayatClient
      isAuthenticated={!!user}
      completions={historyRes.completions || []}
      summaries={historyRes.summaries || []}
      dateSummaries={historyRes.dateSummaries || []}
    />
  );
}
