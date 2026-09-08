import { fishingConfig } from "@/config/fishing";
import type { MarineHour, Safety } from "@/types/fishing";
export class SafetyService {
  static evaluate(hours: MarineHour[], thresholds = fishingConfig.safety): Safety {
    const reasons: string[] = [];
    const complete =
      hours.length === 24 &&
      hours.every((h) => h.windSpeed !== null && h.waveHeight !== null && h.weatherCode !== null);
    let dangerous = false;
    if (hours.some((h) => (h.windSpeed ?? 0) >= thresholds.maxWind)) {
      dangerous = true;
      reasons.push(`Angin mencapai batas ${thresholds.maxWind} knot.`);
    }
    if (hours.some((h) => (h.waveHeight ?? 0) >= thresholds.maxWave)) {
      dangerous = true;
      reasons.push(`Gelombang mencapai batas ${thresholds.maxWave} meter.`);
    }
    if (hours.some((h) => thresholds.thunderstorms.includes(h.weatherCode ?? -1))) {
      dangerous = true;
      reasons.push("Potensi badai petir terdeteksi.");
    }
    if (hours.some((h) => h.visibility !== null && h.visibility < thresholds.minVisibility)) {
      dangerous = true;
      reasons.push("Jarak pandang sangat terbatas.");
    }
    if (dangerous) return { status: "NOT_RECOMMENDED", reasons, complete };
    if (!complete)
      reasons.push("Data keselamatan belum lengkap; kondisi aman belum dapat dipastikan.");
    if (hours.some((h) => (h.windSpeed ?? 0) >= thresholds.cautionWind))
      reasons.push("Angin dapat menguat. Perhatikan kemampuan perahu.");
    if (hours.some((h) => (h.waveHeight ?? 0) >= thresholds.cautionWave))
      reasons.push("Gelombang memerlukan kewaspadaan tambahan.");
    if (hours.some((h) => h.visibility !== null && h.visibility < thresholds.cautionVisibility))
      reasons.push("Jarak pandang berkurang.");
    return {
      status: reasons.length ? "CAUTION" : "SAFE",
      reasons: reasons.length
        ? reasons
        : ["Angin dan gelombang berada dalam batas rekomendasi aplikasi."],
      complete,
    };
  }
}
