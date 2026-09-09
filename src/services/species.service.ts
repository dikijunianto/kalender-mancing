import { species } from "@/config/data";
import type { FishRecommendation } from "@/types/fishing";
export function recommendSpecies(
  area: string,
  date: string,
  temperature: number | null,
): FishRecommendation[] {
  const month = Number(date.slice(5, 7));
  return species
    .filter((s) => s.areas.includes(area))
    .map((s) => {
      const season = s.months.includes(month) ? 85 : 55;
      const suitable =
        temperature !== null &&
        temperature >= s.preferred_temperature_min &&
        temperature <= s.preferred_temperature_max;
      return {
        species: s,
        score: Math.round(season * 0.75 + (temperature === null ? 50 : suitable ? 95 : 40) * 0.25),
        reason: `${s.months.includes(month) ? "Musim cukup sesuai" : "Di luar periode unggulan"}${temperature === null ? "; suhu laut belum tersedia" : suitable ? " dan suhu laut mendukung rentang ikan ini" : "; suhu di luar rentang ikan ini"}. Bukan jaminan tangkapan.`,
      };
    })
    .sort((a, b) => b.score - a.score);
}
