import SunCalc from "suncalc";
import type { Area, Moon } from "@/types/fishing";
export function getMoon(date: string, area: Area): Moon {
  const noon = new Date(`${date}T12:00:00+07:00`);
  const illumination = SunCalc.getMoonIllumination(noon);
  // Query the Jakarta civil day, not the host machine's local day.
  const start = new Date(`${date}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 86400000);
  const candidates = [-1, 0, 1].flatMap((offset) => {
    const t = SunCalc.getMoonTimes(
      new Date(start.getTime() + offset * 86400000),
      area.latitude,
      area.longitude,
      true,
    );
    return [
      { kind: "rise", date: t.rise },
      { kind: "set", date: t.set },
    ];
  });
  const pick = (kind: string) =>
    candidates
      .find((c) => c.kind === kind && c.date && c.date >= start && c.date < end)
      ?.date?.toISOString() ?? null;
  const sun = SunCalc.getTimes(noon, area.latitude, area.longitude);
  const p = illumination.phase;
  const name =
    p < 0.025 || p > 0.975
      ? "Bulan baru"
      : p < 0.225
        ? "Sabit awal"
        : p < 0.275
          ? "Perbani awal"
          : p < 0.475
            ? "Cembung awal"
            : p < 0.525
              ? "Purnama"
              : p < 0.725
                ? "Cembung akhir"
                : p < 0.775
                  ? "Perbani akhir"
                  : "Sabit akhir";
  return {
    phase: p,
    illumination: Math.round(illumination.fraction * 100),
    name,
    moonrise: pick("rise"),
    moonset: pick("set"),
    sunrise: sun.sunrise.toISOString(),
    sunset: sun.sunset.toISOString(),
  };
}
