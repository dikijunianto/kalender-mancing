import type { FishingWindow, MarineHour, Moon, Safety } from "@/types/fishing";
import { SafetyService } from "./safety.service";
import { timeLabel } from "@/lib/date";
export function getWindows(hours: MarineHour[], moon: Moon, safety: Safety): FishingWindow[] {
  if (safety.status === "NOT_RECOMMENDED" || !safety.complete) return [];
  return [
    { sun: moon.sunrise, before: 60, after: 120, label: "Pagi hari" },
    { sun: moon.sunset, before: 120, after: 30, label: "Sore hari" },
  ].flatMap((w) => {
    const start = new Date(new Date(w.sun).getTime() - w.before * 60000),
      end = new Date(new Date(w.sun).getTime() + w.after * 60000);
    const selected = hours.filter(
      (h) => new Date(h.timestamp) >= start && new Date(h.timestamp) <= end,
    );
    if (
      !selected.length ||
      SafetyService.evaluate(selected).status === "NOT_RECOMMENDED" ||
      selected.some((h) => (h.rainProbability ?? 0) > 80)
    )
      return [];
    return [
      {
        start: timeLabel(start.toISOString()),
        end: timeLabel(end.toISOString()),
        label: w.label,
        reason:
          "Dekat transisi cahaya dengan angin dan gelombang di bawah batas aplikasi. Estimasi berbasis aturan, bukan jaminan aktivitas ikan.",
      },
    ];
  });
}
