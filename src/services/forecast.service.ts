import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getArea } from "./area.service";
import { getMoon } from "./moon.service";
import { SafetyService } from "./safety.service";
import { FishingScoreService } from "./fishing-score.service";
import { recommendSpecies } from "./species.service";
import { getWindows } from "./recommended-time.service";
import { getTides } from "./tide.service";
import { DemoMarineProvider } from "@/providers/marine/demo";
import { OpenMeteoMarineProvider } from "@/providers/marine/open-meteo";
import { adminSupabase } from "@/lib/supabase/server";
import { postgres } from "@/lib/postgres";
import { addDays, today } from "@/lib/date";
import { fishingConfig } from "@/config/fishing";
import { applyForecastFreshness } from "./forecast-freshness";
import type { DailyReport, Forecast } from "@/types/fishing";
export const demoMode = () => process.env.DEMO_MODE !== "false";
const cachedLive = unstable_cache(
  async (slug: string, start: string, end: string) =>
    new OpenMeteoMarineProvider().getForecast(getArea(slug), start, end),
  ["open-meteo-v1"],
  { revalidate: fishingConfig.cacheSeconds },
);
const pendingForecasts = new Map<string, Promise<Forecast[]>>();
function loadLive(slug: string, start: string, end: string) {
  const key = `${slug}:${start}:${end}`;
  let pending = pendingForecasts.get(key);
  if (!pending) {
    pending = cachedLive(slug, start, end).finally(() => pendingForecasts.delete(key));
    pendingForecasts.set(key, pending);
  }
  return pending;
}
export const getForecast = cache(async (slug: string, date: string): Promise<Forecast> => {
  const area = getArea(slug);
  if (demoMode()) return (await new DemoMarineProvider().getForecast(area, date, date))[0];
  const unavailable: Forecast = {
    area,
    date,
    hours: [],
    source: "UNAVAILABLE",
    fetchedAt: null,
    notice:
      "Prakiraan belum tersedia untuk tanggal ini. Periksa prakiraan maritim resmi BMKG sebelum melaut.",
  };
  if (date < today() || date > addDays(today(), fishingConfig.forecastDays - 1)) return unavailable;
  const pg = postgres(), db = pg ? null : adminSupabase();
  let saved: Forecast | null = null;
  try {
    if (pg) {
      const { rows } = await pg.query<{ payload: Forecast }>(
        "select payload from forecast_cache where area_id = $1 and date = $2",
        [area.id, date],
      );
      saved = rows[0]?.payload ?? null;
    } else if (db) {
      const { data } = await db
        .from("forecast_cache")
        .select("payload")
        .eq("area_id", area.id)
        .eq("date", date)
        .maybeSingle();
      saved = (data?.payload as Forecast | undefined) ?? null;
    }
    if (
      saved?.fetchedAt &&
      Date.now() - new Date(saved.fetchedAt).getTime() < fishingConfig.cacheSeconds * 1000
    )
      return saved;
    const reports = await loadLive(slug, today(), addDays(today(), fishingConfig.forecastDays - 1));
    const report = reports.find((r) => r.date === date) ?? unavailable;
    if (pg)
      await pg.query(
        "insert into forecast_cache (area_id, date, payload, fetched_at) values ($1, $2, $3, $4) on conflict (area_id, date) do update set payload = excluded.payload, fetched_at = excluded.fetched_at",
        [area.id, date, JSON.stringify(report), report.fetchedAt],
      );
    else if (db)
      await db.from("forecast_cache").upsert(
        reports.map((r) => ({
          area_id: area.id,
          date: r.date,
          payload: r,
          fetched_at: r.fetchedAt,
        })),
        { onConflict: "area_id,date" },
      );
    // Next's stale-while-revalidate cache can return old successful responses.
    return applyForecastFreshness(report);
  } catch {
    if (
      saved?.fetchedAt &&
      Date.now() - new Date(saved.fetchedAt).getTime() < fishingConfig.staleCacheHours * 3600000
    )
      return {
        ...saved,
        source: "CACHED",
        notice:
          "Penyedia tidak tersedia. Menampilkan cache; kondisi dapat berubah. Periksa pembaruan resmi.",
      };
    return unavailable;
  }
});
export const getDailyReport = cache(async (slug: string, date: string): Promise<DailyReport> => {
  const forecast = await getForecast(slug, date),
    moon = getMoon(date, forecast.area);
  const current = forecast.hours[6] ?? forecast.hours[0] ?? null;
  const fish = recommendSpecies(slug, date, current?.seaTemperature ?? null);
  const safety = SafetyService.evaluate(forecast.hours);
  if (forecast.source === "CACHED" && safety.status === "SAFE") {
    safety.status = "CAUTION";
    safety.reasons = ["Data cache belum diperbarui. Periksa kondisi terkini sebelum melaut."];
  }
  return {
    forecast,
    current,
    moon,
    fish,
    safety,
    score: FishingScoreService.calculate(forecast.hours, moon, fish[0]?.score ?? 50),
    tides: getTides(forecast.hours),
    windows: getWindows(forecast.hours, moon, safety),
  };
});
export async function getReports(slug: string, start: string, count: number) {
  return Promise.all(
    Array.from({ length: count }, (_, i) => getDailyReport(slug, addDays(start, i))),
  );
}
