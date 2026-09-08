import { fishingConfig } from "@/config/fishing";
import type { FishingScore, MarineHour, Moon, ScorePart } from "@/types/fishing";
export const clamp = (n: number) => Math.max(0, Math.min(100, n));
export function scoreLabel(score: number | null) {
  return score === null
    ? "Data belum lengkap"
    : score >= 85
      ? "Sangat Bagus"
      : score >= 70
        ? "Bagus"
        : score >= 55
          ? "Lumayan"
          : score >= 40
            ? "Kurang Bagus"
            : "Buruk";
}
export class FishingScoreService {
  static calculate(hours: MarineHour[], moon: Moon, season: number): FishingScore {
    const mean = (key: keyof MarineHour) => {
      const vals = hours.map((h) => h[key]).filter((v): v is number => typeof v === "number");
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const wind = mean("windSpeed"),
      wave = mean("waveHeight"),
      current = mean("currentSpeed"),
      temp = mean("seaTemperature");
    const tide = hours.map((h) => h.tideHeight).filter((v): v is number => v !== null);
    const raw: [string, string, number | null, number][] = [
      ["wind", "Angin", wind === null ? null : clamp(110 - wind * 4), fishingConfig.weights.wind],
      [
        "waves",
        "Gelombang",
        wave === null ? null : clamp(110 - wave * 40),
        fishingConfig.weights.waves,
      ],
      [
        "current",
        "Arus",
        current === null ? null : clamp(100 - Math.abs(current - 0.8) * 50),
        fishingConfig.weights.current,
      ],
      [
        "tide",
        "Pasang surut",
        tide.length < 12 ? null : clamp(55 + (Math.max(...tide) - Math.min(...tide)) * 30),
        fishingConfig.weights.tide,
      ],
      [
        "moon",
        "Bulan",
        70 + 30 * Math.abs(Math.cos(moon.phase * 2 * Math.PI)),
        fishingConfig.weights.moon,
      ],
      ["season", "Musim ikan", season, fishingConfig.weights.season],
      [
        "temperature",
        "Suhu laut",
        temp === null ? null : clamp(100 - Math.abs(temp - 28.5) * 12),
        fishingConfig.weights.temperature,
      ],
    ];
    const parts: ScorePart[] = raw.map(([key, label, v, weight]) => ({
      key,
      label,
      value: v === null ? null : Math.round(((v * weight) / 100) * 10) / 10,
      weight,
    }));
    const coverage = parts.reduce((n, p) => n + (p.value === null ? 0 : p.weight), 0);
    // Missing factors are never silently replaced or reweighted into a confident score.
    const total =
      coverage === 100 ? Math.round(parts.reduce((n, p) => n + (p.value ?? 0), 0)) : null;
    return { total, label: scoreLabel(total), parts, coverage };
  }
}
