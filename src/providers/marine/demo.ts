import type { Area, Forecast, MarineHour } from "@/types/fishing";
import type { MarineWeatherProvider } from "./provider";
import { addDays } from "@/lib/date";
function seed(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
}
const round = (v: number) => Math.round(v * 100) / 100;
export class DemoMarineProvider implements MarineWeatherProvider {
  async getForecast(area: Area, startDate: string, endDate: string): Promise<Forecast[]> {
    const result: Forecast[] = [];
    for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
      const s = seed(`${area.slug}:${date}`),
        storm = s > 0.91;
      const lunarDay = (new Date(`${date}T00:00:00Z`).getTime() / 86400000) % 29.53;
      const hours: MarineHour[] = Array.from({ length: 24 }, (_, hour) => {
        const cycle = Math.sin((hour / 24) * Math.PI * 2),
          rain = storm ? 5 + 3 * Math.max(0, cycle) : s > 0.65 ? Math.max(0, cycle) * 2 : 0;
        return {
          timestamp: `${date}T${String(hour).padStart(2, "0")}:00:00+07:00`,
          windSpeed: round((storm ? 20 : 4 + s * 8) + cycle * 2),
          windDirection: Math.round(35 + s * 180 + cycle * 15),
          waveHeight: round((storm ? 1.65 : 0.25 + s * 0.7) + cycle * 0.12),
          wavePeriod: round(4 + s * 3),
          currentSpeed: round(0.45 + s * 0.65 + Math.abs(cycle) * 0.3),
          currentDirection: Math.round(70 + s * 150),
          temperature: round(28 + s * 3 + cycle),
          seaTemperature: round(28 + s * 2),
          precipitation: round(rain),
          rainProbability: Math.round(storm ? 85 : s > 0.65 ? 45 + cycle * 25 : 10 + s * 30),
          cloudCover: Math.round(storm ? 95 : 20 + s * 55),
          visibility: storm ? 3000 : 18000,
          weatherCode: storm ? 95 : rain > 0.1 ? 61 : s > 0.4 ? 2 : 1,
          tideHeight: round(
            0.5 +
              (0.35 + 0.2 * Math.abs(Math.cos((lunarDay / 29.53) * 2 * Math.PI))) *
                Math.sin((hour / 12.42) * 2 * Math.PI - (lunarDay / 29.53) * 2 * Math.PI),
          ),
        };
      });
      result.push({
        area,
        date,
        hours,
        source: "DEMO",
        fetchedAt: `${date}T00:00:00+07:00`,
        notice:
          "Data simulasi deterministik untuk eksplorasi. Bukan prakiraan aktual dan tidak boleh digunakan untuk keputusan melaut.",
      });
    }
    return result;
  }
}
