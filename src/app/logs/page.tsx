import { FishingLog } from "@/components/logs/fishing-log";
import { isSupabaseConfigured } from "@/lib/supabase/server";
export const metadata = { title: "Log Mancing Pribadi" };
export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SETIAP TRIP PUNYA CERITA</div>
          <h1>
            Log mancing<span className="accent">.</span>
          </h1>
          <p className="muted">
            Simpan spot, tangkapan, dan pelajaran dari setiap perjalanan. Hanya kamu yang bisa
            melihatnya.
          </p>
        </div>
      </div>
      <FishingLog configured={isSupabaseConfigured()} callbackError={query.error === "auth"} />
    </div>
  );
}
