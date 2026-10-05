import { getCurrentUser } from "@/lib/auth-utils";
import { getReadingHistory } from "@/app/actions/reading-actions";
import KalenderClient from "./kalender-client";

export const metadata = {
  title: "Kalender Amalan - Lembaran",
  description: "Kalender aktivitas dan riwayat penyelesaian amalan dan bacaan",
};

export default async function KalenderPage() {
  const user = await getCurrentUser();
  const historyRes = await getReadingHistory();

  return (
    <KalenderClient
      isAuthenticated={!!user}
      isError={!historyRes.success}
      errorMessage={historyRes.message}
      completions={historyRes.completions || []}
    />
  );
}
