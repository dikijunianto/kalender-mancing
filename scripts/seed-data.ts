import { areas, species } from "../src/config/data";
import { today, addDays } from "../src/lib/date";
import { DemoMarineProvider } from "../src/providers/marine/demo";
import { getMoon } from "../src/services/moon.service";
import { getTides } from "../src/services/tide.service";
export async function seedData(start = today()) {
  const forecasts = (
    await Promise.all(
      areas.map((a) => new DemoMarineProvider().getForecast(a, start, addDays(start, 29))),
    )
  ).flat();
  return {
    areas,
    species: species.map(({ months, areas: areaSlugs, ...row }) => row),
    species_seasonality: species.flatMap((s) =>
      areas
        .filter((a) => s.areas.includes(a.slug))
        .flatMap((a) =>
          Array.from({ length: 12 }, (_, i) => ({
            species_id: s.id,
            area_id: a.id,
            month: i + 1,
            score: s.months.includes(i + 1) ? 85 : 55,
            notes: "Initial editorial guidance; not validated against local catch records.",
            source_type: "EDITORIAL",
          })),
        ),
    ),
    marine_forecasts: forecasts.flatMap((f) =>
      f.hours.map((h) => ({
        area_id: f.area.id,
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
        source: "DEMO",
        raw_data: h,
        fetched_at: f.fetchedAt,
      })),
    ),
    tide_forecasts: forecasts.flatMap((f) =>
      getTides(f.hours).map((t) => ({ area_id: f.area.id, ...t, source: "DEMO" })),
    ),
    moon_data: forecasts.map((f) => {
      const moon = getMoon(f.date, f.area);
      return {
        date: f.date,
        area_id: f.area.id,
        moon_phase: moon.phase,
        illumination: moon.illumination,
        moonrise: moon.moonrise,
        moonset: moon.moonset,
      };
    }),
  };
}
