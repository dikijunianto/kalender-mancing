import test from "node:test";
import assert from "node:assert/strict";
import { areas } from "../src/config/data";
import { fishingConfig } from "../src/config/fishing";
import { DemoMarineProvider } from "../src/providers/marine/demo";
import { OpenMeteoMarineProvider } from "../src/providers/marine/open-meteo";
import { getMoon } from "../src/services/moon.service";
import { SafetyService } from "../src/services/safety.service";
import { FishingScoreService, scoreLabel } from "../src/services/fishing-score.service";
import { getWindows } from "../src/services/recommended-time.service";
import { getSceneState } from "../src/services/scene-state";
import { getTides } from "../src/services/tide.service";
import { applyForecastFreshness } from "../src/services/forecast-freshness";
import { dateSchema, logSchema } from "../src/lib/validation";
import { addDays, timeLabel } from "../src/lib/date";
import type { DailyReport } from "../src/types/fishing";
test("stale-while-revalidate responses are labeled cached and eventually expire", async () => {
  const demo = (
    await new DemoMarineProvider().getForecast(areas[0], "2026-09-08", "2026-09-08")
  )[0];
  const live = { ...demo, source: "LIVE" as const, fetchedAt: "2026-09-08T00:00:00Z" };
  assert.equal(applyForecastFreshness(live, Date.parse("2026-09-08T00:29:59Z")).source, "LIVE");
  assert.equal(applyForecastFreshness(live, Date.parse("2026-09-08T00:30:00Z")).source, "CACHED");
  const expired = applyForecastFreshness(live, Date.parse("2026-09-08T06:00:00Z"));
  assert.equal(expired.source, "UNAVAILABLE");
  assert.deepEqual(expired.hours, []);
  assert.equal(applyForecastFreshness({ ...live, fetchedAt: null }).source, "UNAVAILABLE");
  assert.equal(applyForecastFreshness(demo).source, "DEMO");
});
test("30 days are stable, area-specific, explicitly DEMO, with bounded scores", async () => {
  const provider = new DemoMarineProvider();
  const first = await provider.getForecast(areas[0], "2026-09-01", "2026-09-30");
  assert.equal(first.length, 30);
  assert.deepEqual(first, await provider.getForecast(areas[0], "2026-09-01", "2026-09-30"));
  assert.notDeepEqual(
    first[0].hours,
    (await provider.getForecast(areas[1], "2026-09-01", "2026-09-01"))[0].hours,
  );
  for (const f of first) {
    assert.equal(f.source, "DEMO");
    assert.equal(f.hours.length, 24);
    const moon = getMoon(f.date, f.area),
      score = FishingScoreService.calculate(f.hours, moon, 85);
    assert.equal(score.coverage, 100);
    assert.ok(score.total !== null && score.total >= 0 && score.total <= 100);
    assert.equal(score.total, Math.round(score.parts.reduce((n, p) => n + p.value!, 0)));
  }
});
test("safety overrides biological conditions, including hourly extremes and exact thresholds", async () => {
  const f = (await new DemoMarineProvider().getForecast(areas[0], "2026-09-08", "2026-09-08"))[0];
  const calm = f.hours.map((h) => ({
    ...h,
    windSpeed: 6,
    waveHeight: 0.4,
    weatherCode: 1,
    visibility: 20000,
  }));
  assert.equal(SafetyService.evaluate(calm).status, "SAFE");
  for (const override of [
    { windSpeed: 20 },
    { waveHeight: 1.5 },
    { weatherCode: 95 },
    { visibility: 999 },
  ]) {
    const hours = calm.map((h, i) => (i === 18 ? { ...h, ...override } : h)),
      safety = SafetyService.evaluate(hours);
    assert.equal(safety.status, "NOT_RECOMMENDED");
    assert.deepEqual(getWindows(hours, getMoon(f.date, f.area), safety), []);
  }
  assert.equal(
    SafetyService.evaluate(calm.map((h) => ({ ...h, windSpeed: 12 }))).status,
    "CAUTION",
  );
  assert.equal(
    SafetyService.evaluate(calm, { ...fishingConfig.safety, maxWind: 5 }).status,
    "NOT_RECOMMENDED",
  );
  assert.equal(SafetyService.evaluate([]).status, "CAUTION");
  assert.equal(SafetyService.evaluate(calm.slice(0, 23)).complete, false);
  assert.equal(
    SafetyService.evaluate(calm.map((h) => ({ ...h, waveHeight: null }))).complete,
    false,
  );
});
test("missing score factors stay unavailable instead of inventing values", async () => {
  const f = (await new DemoMarineProvider().getForecast(areas[0], "2026-09-08", "2026-09-08"))[0],
    moon = getMoon(f.date, f.area);
  const score = FishingScoreService.calculate(
    f.hours.map((h) => ({ ...h, currentSpeed: null })),
    moon,
    85,
  );
  assert.equal(score.total, null);
  assert.equal(score.coverage, 80);
  assert.equal(score.parts.find((p) => p.key === "current")?.value, null);
  assert.deepEqual([85, 84, 70, 69, 55, 54, 40, 39].map(scoreLabel), [
    "Sangat Bagus",
    "Bagus",
    "Bagus",
    "Lumayan",
    "Lumayan",
    "Kurang Bagus",
    "Kurang Bagus",
    "Buruk",
  ]);
});
test("Jakarta dates, leap dates, moon phases and rise/set match the civil date", () => {
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(timeLabel("2026-09-08T23:00:00Z"), "06:00");
  assert.equal(dateSchema.safeParse("2026-02-30").success, false);
  const newMoon = getMoon("2026-09-11", areas[0]),
    fullMoon = getMoon("2026-09-26", areas[0]);
  assert.ok(newMoon.illumination < 5);
  assert.ok(fullMoon.illumination > 95);
  for (let day = 1; day <= 30; day++) {
    const date = `2026-09-${String(day).padStart(2, "0")}`,
      moon = getMoon(date, areas[0]);
    for (const t of [moon.moonrise, moon.moonset])
      if (t) {
        const local = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
          new Date(t),
        );
        assert.equal(local, date);
      }
  }
});
test("scene uses selected hourly weather, astronomy and tide extrema", async () => {
  const forecast = (
    await new DemoMarineProvider().getForecast(areas[0], "2026-09-08", "2026-09-08")
  )[0];
  const moon = getMoon(forecast.date, forecast.area);
  const report: DailyReport = {
    forecast,
    moon,
    current: forecast.hours[6],
    safety: SafetyService.evaluate(forecast.hours),
    score: FishingScoreService.calculate(forecast.hours, moon, 85),
    fish: [],
    tides: getTides(forecast.hours),
    windows: [],
  };
  const noon = getSceneState(report, 12),
    night = getSceneState(report, 23);
  assert.equal(noon?.isDaytime, true);
  assert.equal(night?.isDaytime, false);
  assert.equal(noon?.windSpeed, forecast.hours[12].windSpeed);
  assert.equal(noon?.windDirection, forecast.hours[12].windDirection);
  assert.equal(noon?.waveHeight, forecast.hours[12].waveHeight);
  assert.equal(noon?.precipitationIntensity, forecast.hours[12].precipitation);
  assert.ok(report.tides.some((t) => t.type === "HIGH"));
  assert.ok(report.tides.some((t) => t.type === "LOW"));
  assert.equal(getSceneState({ ...report, forecast: { ...forecast, hours: [] } }, 12), null);
  assert.equal(
    getSceneState(
      {
        ...report,
        forecast: { ...forecast, hours: forecast.hours.map((h) => ({ ...h, cloudCover: null })) },
      },
      12,
    ),
    null,
  );
});
test("provider normalizes real response shape and preserves nulls; transport failures reject", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls++;
    const marine = String(input).includes("marine-api");
    return Response.json({
      hourly: {
        time: ["2026-09-08T06:00"],
        ...(marine
          ? {
              wave_height: [0.7],
              wave_period: [5],
              ocean_current_velocity: [1.852],
              ocean_current_direction: [180],
              sea_surface_temperature: [null],
              sea_level_height_msl: [0.4],
            }
          : {
              temperature_2m: [29],
              wind_speed_10m: [6],
              wind_direction_10m: [45],
              precipitation: [0],
              precipitation_probability: [20],
              cloud_cover: [40],
              visibility: [15000],
              weather_code: [2],
            }),
      },
    });
  };
  try {
    const [f] = await new OpenMeteoMarineProvider().getForecast(
      areas[0],
      "2026-09-08",
      "2026-09-08",
    );
    assert.equal(calls, 2);
    assert.equal(f.hours[0].currentSpeed, 1);
    assert.equal(f.hours[0].seaTemperature, null);
    assert.equal(f.hours[0].timestamp, "2026-09-08T06:00:00+07:00");
    assert.equal(f.source, "LIVE");
    globalThis.fetch = async () => new Response("Unavailable", { status: 503 });
    await assert.rejects(() =>
      new OpenMeteoMarineProvider().getForecast(areas[0], "2026-09-08", "2026-09-08"),
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("log validation blocks invalid counts, dates, identifiers and oversized notes", () => {
  const valid = {
    area_id: areas[0].id,
    species_id: "20000000-0000-4000-8000-000000000001",
    date: "2026-09-08",
    catch_count: 1,
    technique: "Casting",
    bait: "Minnow",
  };
  assert.equal(logSchema.safeParse(valid).success, true);
  for (const override of [
    { catch_count: -1 },
    { catch_count: 1.5 },
    { date: "2026-02-30" },
    { area_id: "x" },
    { notes: "a".repeat(2001) },
    { weight: -1 },
    { strike_time: "27:00" },
  ])
    assert.equal(logSchema.safeParse({ ...valid, ...override }).success, false);
});
