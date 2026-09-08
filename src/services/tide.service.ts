import type { MarineHour, Tide } from "@/types/fishing";
export function getTides(hours: MarineHour[]): Tide[] {
  return hours.flatMap((h, i) =>
    h.tideHeight === null
      ? []
      : [
          {
            timestamp: h.timestamp,
            height: h.tideHeight,
            type: (i > 0 &&
            i < hours.length - 1 &&
            hours[i - 1].tideHeight !== null &&
            hours[i + 1].tideHeight !== null
              ? h.tideHeight > hours[i - 1].tideHeight! && h.tideHeight >= hours[i + 1].tideHeight!
                ? "HIGH"
                : h.tideHeight < hours[i - 1].tideHeight! &&
                    h.tideHeight <= hours[i + 1].tideHeight!
                  ? "LOW"
                  : "NORMAL"
              : "NORMAL") as Tide["type"],
          },
        ],
  );
}
