import type { Area, Forecast } from "@/types/fishing";
export interface MarineWeatherProvider {
  getForecast(area: Area, startDate: string, endDate: string): Promise<Forecast[]>;
}
