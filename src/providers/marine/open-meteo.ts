import { z } from "zod";
import type { Area, Forecast, MarineHour } from "@/types/fishing";
import type { MarineWeatherProvider } from "./provider";
const responseSchema = z.object({
  hourly: z
    .object({ time: z.array(z.string()) })
    .catchall(z.array(z.union([z.number(), z.string(), z.null()]))),
});
export class OpenMeteoMarineProvider implements MarineWeatherProvider {
  async getForecast(area: Area, startDate: string, endDate: string): Promise<Forecast[]> {
    const params = {
      latitude: String(area.latitude),
      longitude: String(area.longitude),
      timezone: area.timezone,
      start_date: startDate,
      end_date: endDate,
    };
    const apiKey = process.env.OPEN_METEO_API_KEY;
    const fetchData = async (marine: boolean) => {
      const base = marine
        ? `https://${apiKey ? "customer-" : ""}marine-api.open-meteo.com/v1/marine`
        : `https://${apiKey ? "customer-" : ""}api.open-meteo.com/v1/forecast`;
      const query = new URLSearchParams({
        ...params,
        hourly: marine
          ? "wave_height,wave_period,ocean_current_velocity,ocean_current_direction,sea_surface_temperature,sea_level_height_msl"
          : "temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,precipitation_probability,cloud_cover,visibility,weather_code",
        ...(marine ? { cell_selection: "sea" } : { wind_speed_unit: "kn" }),
        ...(apiKey ? { apikey: apiKey } : {}),
      });
      const response = await fetch(`${base}?${query}`, {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 1800 },
      });
      if (!response.ok) throw new Error(`Forecast provider: HTTP ${response.status}`);
      return responseSchema.parse(await response.json()).hourly;
    };
    const [marine, weather] = await Promise.all([fetchData(true), fetchData(false)]);
    const value = (data: typeof marine, key: string, i: number): number | null => {
      const v = data[key]?.[i];
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    };
    const weatherIndex = new Map(weather.time.map((t, i) => [t, i]));
    const byDay = new Map<string, MarineHour[]>();
    marine.time.forEach((time, i) => {
      const j = weatherIndex.get(time);
      if (j === undefined) return;
      const date = time.slice(0, 10),
        speed = value(marine, "ocean_current_velocity", i);
      const h: MarineHour = {
        timestamp: `${time}:00+07:00`,
        windSpeed: value(weather, "wind_speed_10m", j),
        windDirection: value(weather, "wind_direction_10m", j),
        waveHeight: value(marine, "wave_height", i),
        wavePeriod: value(marine, "wave_period", i),
        currentSpeed: speed === null ? null : speed / 1.852,
        currentDirection: value(marine, "ocean_current_direction", i),
        temperature: value(weather, "temperature_2m", j),
        seaTemperature: value(marine, "sea_surface_temperature", i),
        precipitation: value(weather, "precipitation", j),
        rainProbability: value(weather, "precipitation_probability", j),
        cloudCover: value(weather, "cloud_cover", j),
        visibility: value(weather, "visibility", j),
        weatherCode: value(weather, "weather_code", j),
        tideHeight: value(marine, "sea_level_height_msl", i),
      };
      byDay.set(date, [...(byDay.get(date) ?? []), h]);
    });
    if (!byDay.size) throw new Error("Forecast provider returned no hourly data");
    return [...byDay].map(([date, hours]) => ({
      area,
      date,
      hours,
      source: "LIVE",
      fetchedAt: new Date().toISOString(),
      notice: null,
    }));
  }
}
