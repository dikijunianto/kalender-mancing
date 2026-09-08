import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase/server";
import { areas } from "@/config/data";
import { OpenMeteoMarineProvider } from "@/providers/marine/open-meteo";
import { today, addDays } from "@/lib/date";
import { getTides } from "@/services/tide.service";
import { getMoon } from "@/services/moon.service";
export async function POST(request: NextRequest) {
  const secret = process.env.SYNC_SECRET;
  if (!secret)
    return NextResponse.json({ error: "Sinkronisasi belum dikonfigurasi" }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`),
    provided = Buffer.from(request.headers.get("authorization") ?? "");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided))
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  const db = adminSupabase();
  if (!db) return NextResponse.json({ error: "Database belum dikonfigurasi" }, { status: 503 });
  try {
    let days = 0;
    for (const area of areas) {
      const reports = await new OpenMeteoMarineProvider().getForecast(
        area,
        today(),
        addDays(today(), 6),
      );
      const writes = [
        await db.from("forecast_cache").upsert(
          reports.map((r) => ({
            area_id: area.id,
            date: r.date,
            payload: r,
            fetched_at: r.fetchedAt,
          })),
          { onConflict: "area_id,date" },
        ),
        await db.from("marine_forecasts").upsert(
          reports.flatMap((r) =>
            r.hours.map((h) => ({
              area_id: area.id,
              forecast_time: h.timestamp,
              weather_condition: h.weatherCode,
              temperature: h.temperature,
              sea_surface_temperature: h.seaTemperature,
              wind_speed: h.windSpeed,
              wind_direction: h.windDirection,
              wave_height: h.waveHeight,
              wave_period: h.wavePeriod,
              current_speed: h.currentSpeed,
              current_direction: h.currentDirection,
              precipitation: h.precipitation,
              precipitation_probability: h.rainProbability,
              cloud_cover: h.cloudCover,
              visibility: h.visibility,
              source: "OPEN_METEO",
              raw_data: h,
              fetched_at: r.fetchedAt,
            })),
          ),
          { onConflict: "area_id,forecast_time,source" },
        ),
        await db.from("tide_forecasts").upsert(
          reports.flatMap((r) =>
            getTides(r.hours).map((t) => ({ area_id: area.id, ...t, source: "OPEN_METEO" })),
          ),
          { onConflict: "area_id,timestamp,source" },
        ),
        await db.from("moon_data").upsert(
          reports.map((r) => {
            const moon = getMoon(r.date, area);
            return {
              area_id: area.id,
              date: r.date,
              moon_phase: moon.phase,
              illumination: moon.illumination,
              moonrise: moon.moonrise,
              moonset: moon.moonset,
            };
          }),
          { onConflict: "date,area_id" },
        ),
      ];
      if (writes.some((w) => w.error)) throw new Error("Database synchronization failed");
      days += reports.length;
    }
    return NextResponse.json({ syncedDays: days, fetchedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { error: "Sinkronisasi gagal. Cache sebelumnya tetap tersedia." },
      { status: 503 },
    );
  }
}
