import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { seedData } from "./seed-data";
loadEnvConfig(process.cwd());
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before seeding.",
    );
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }),
    data = await seedData();
  const conflicts: Record<string, string> = {
    areas: "id",
    species: "id",
    species_seasonality: "species_id,area_id,month",
    marine_forecasts: "area_id,forecast_time,source",
    tide_forecasts: "area_id,timestamp,source",
    moon_data: "date,area_id",
  };
  for (const [table, rows] of Object.entries(data)) {
    for (let i = 0; i < rows.length; i += 300) {
      const batch: Record<string, unknown>[] = rows.slice(i, i + 300);
      const { error } = await db.from(table).upsert(batch, { onConflict: conflicts[table] });
      if (error) throw new Error(`Seed ${table}: ${error.message}`);
    }
    console.log(`${table}: ${rows.length} rows seeded`);
  }
  console.log(
    "Seed complete. All generated marine/tide records are DEMO; all seasonality is EDITORIAL.",
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
