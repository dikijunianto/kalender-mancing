import SunCalc from "suncalc";
import type { DailyReport, MarineSceneState } from "@/types/fishing";
export function getSceneState(report: DailyReport, hour: number): MarineSceneState | null {
  const h = report.forecast.hours[hour];
  if (
    !h ||
    h.windSpeed === null ||
    h.windDirection === null ||
    h.waveHeight === null ||
    h.precipitation === null ||
    h.wavePeriod === null ||
    h.rainProbability === null ||
    h.cloudCover === null ||
    h.weatherCode === null
  )
    return null;
  const position = SunCalc.getPosition(
    new Date(h.timestamp),
    report.forecast.area.latitude,
    report.forecast.area.longitude,
  );
  const moon = SunCalc.getMoonIllumination(new Date(h.timestamp));
  return {
    timestamp: h.timestamp,
    isDaytime: position.altitude > 0,
    sunAltitude: position.altitude,
    moonPhase: moon.phase,
    moonIllumination: moon.fraction * 100,
    windSpeed: h.windSpeed,
    windDirection: h.windDirection,
    waveHeight: h.waveHeight,
    wavePeriod: h.wavePeriod,
    precipitationIntensity: h.precipitation,
    precipitationProbability: h.rainProbability,
    cloudCover: h.cloudCover,
    weatherCondition: h.weatherCode,
  };
}
