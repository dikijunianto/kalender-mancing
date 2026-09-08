import { loadEnvConfig } from "@next/env";
import { areas } from "../src/config/data";
import { OpenMeteoMarineProvider } from "../src/providers/marine/open-meteo";
import { today, addDays } from "../src/lib/date";
loadEnvConfig(process.cwd());
async function main() {
  for (const area of areas) {
    const reports = await new OpenMeteoMarineProvider().getForecast(
      area,
      today(),
      addDays(today(), 6),
    );
    if (!reports.length || reports.some((r) => r.source !== "LIVE"))
      throw new Error("Expected normalized live forecasts");
    const hours = reports.flatMap((r) => r.hours);
    console.log(
      JSON.stringify({
        area: area.slug,
        days: reports.length,
        hours: hours.length,
        source: reports[0].source,
        fetchedAt: reports[0].fetchedAt,
        coverage: {
          wind: hours.filter((h) => h.windSpeed !== null).length,
          waves: hours.filter((h) => h.waveHeight !== null).length,
          current: hours.filter((h) => h.currentSpeed !== null).length,
          tides: hours.filter((h) => h.tideHeight !== null).length,
          seaTemperature: hours.filter((h) => h.seaTemperature !== null).length,
        },
      }),
    );
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
