import { fishingConfig } from "@/config/fishing";
import type { Forecast } from "@/types/fishing";

export function applyForecastFreshness(forecast: Forecast, now = Date.now()): Forecast {
  if (forecast.source === "DEMO" || forecast.source === "UNAVAILABLE") return forecast;
  const age = forecast.fetchedAt ? now - new Date(forecast.fetchedAt).getTime() : Infinity;
  if (!Number.isFinite(age) || age >= fishingConfig.staleCacheHours * 3600000) {
    return {
      ...forecast,
      source: "UNAVAILABLE",
      hours: [],
      notice: "Prakiraan tersimpan sudah kedaluwarsa. Periksa pembaruan resmi sebelum melaut.",
    };
  }
  if (age >= fishingConfig.cacheSeconds * 1000 || forecast.source === "CACHED") {
    return {
      ...forecast,
      source: "CACHED",
      notice:
        "Menampilkan data cache yang belum diperbarui. Kondisi dapat berubah; periksa pembaruan resmi.",
    };
  }
  return forecast;
}
