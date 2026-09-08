"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useMemo, useRef, useState } from "react";
import { CloudRain, Moon, Navigation, Sun, Waves, Wind } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSceneState } from "@/services/scene-state";
import { direction, weatherLabel } from "@/lib/date";
import type { DailyReport, MarineSceneState } from "@/types/fishing";
import type { Quality } from "@/config/three";
import type { WeatherMode } from "@/components/three/MarineWeatherScene";
const Scene = dynamic(() => import("@/components/three/MarineWeatherScene"), {
  ssr: false,
  loading: () => <div className="scene-unavailable">Memuat visualisasi kondisi laut…</div>,
});
class SceneBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function Fallback({ state }: { state: MarineSceneState }) {
  return (
    <div
      className={`marine-fallback ${state.isDaytime ? "" : "night"}`}
      role="img"
      aria-label={`Visualisasi 2D: ${weatherLabel(state.weatherCondition)}, angin ${state.windSpeed} knot dari ${direction(state.windDirection)}, gelombang ${state.waveHeight} meter, bulan ${state.moonIllumination.toFixed(0)} persen`}
    >
      <div className="fallback-stat">
        {state.isDaytime ? <Sun size={40} /> : <Moon size={40} />}
        <strong>
          {state.isDaytime ? "Siang hari" : `${state.moonIllumination.toFixed(0)}% bulan`}
        </strong>
        <span>{weatherLabel(state.weatherCondition)}</span>
      </div>
      <div className="fallback-stat">
        <Navigation
          size={34}
          style={{ transform: `rotate(${state.windDirection + 180 - 45}deg)` }}
        />
        <strong>{state.windSpeed.toFixed(1)} kt</strong>
        <span>Dari {direction(state.windDirection)}</span>
      </div>
      <div className="fallback-stat">
        {state.precipitationIntensity > 0 ? <CloudRain size={40} /> : <Waves size={40} />}
        <strong>{state.waveHeight.toFixed(1)} m</strong>
        <span>
          {state.precipitationIntensity > 0
            ? `Hujan ${state.precipitationIntensity.toFixed(1)} mm`
            : "Tanpa presipitasi"}
        </span>
      </div>
    </div>
  );
}
export function MarineView({
  report,
  hour,
  onHour,
}: {
  report: DailyReport;
  hour: number;
  onHour: (hour: number) => void;
}) {
  const [mode, setMode] = useState<WeatherMode>("overview"),
    [quality, setQuality] = useState<Quality>("LOW"),
    [supported, setSupported] = useState(false),
    [reduce, setReduce] = useState(false),
    [visible, setVisible] = useState(true),
    [inView, setInView] = useState(true),
    [failed, setFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const state = useMemo(() => getSceneState(report, hour), [report, hour]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(media.matches);
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    const weak = navigator.hardwareConcurrency <= 4 || connection?.saveData;
    setQuality(weak ? "LOW" : innerWidth < 800 ? "MEDIUM" : "HIGH");
    if (connection?.saveData) setReduce(true);
    const canvas = document.createElement("canvas");
    try {
      const gl = canvas.getContext("webgl2");
      setSupported(Boolean(gl));
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setSupported(false);
    }
    const onMotion = () => setReduce(media.matches);
    media.addEventListener("change", onMotion);
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // Capture before the lazy Canvas initializes; context loss can precede onCreated.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    element.addEventListener("webglcontextlost", onContextLost, true);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "100px",
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.removeEventListener("webglcontextlost", onContextLost, true);
    };
  }, []);
  const fallback = state ? <Fallback state={state} /> : null;
  return (
    <section className="marine-view" ref={root} aria-label="Visualisasi kondisi laut interaktif">
      <div className="marine-canvas">
        <div className="marine-controls">
          <Tabs value={mode} onValueChange={(v) => setMode(v as WeatherMode)}>
            <TabsList aria-label="Mode visualisasi">
              {[
                ["overview", "Ringkasan"],
                ["wind", "Angin"],
                ["rain", "Hujan"],
                ["moon", "Bulan"],
                ["waves", "Gelombang"],
              ].map(([value, label]) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <select
            className="quality-select"
            aria-label="Kualitas visualisasi"
            value={quality}
            onChange={(e) => setQuality(e.target.value as Quality)}
          >
            <option value="HIGH">Kualitas tinggi</option>
            <option value="MEDIUM">Kualitas sedang</option>
            <option value="LOW">Kualitas rendah</option>
          </select>
        </div>
        {!state ? (
          <div className="scene-unavailable">
            <Waves size={40} />
            <p>
              Data laut belum lengkap.
              <br />
              Visualisasi menunggu prakiraan.
            </p>
          </div>
        ) : reduce || !supported || failed ? (
          fallback
        ) : (
          <SceneBoundary fallback={fallback}>
            <Scene
              state={state}
              quality={quality}
              mode={mode}
              active={visible && inView}
              onMode={setMode}
            />
          </SceneBoundary>
        )}
        {state && (
          <>
            <div className="marine-caption">
              <span className="eyebrow">
                {report.forecast.source === "DEMO"
                  ? "SIMULASI DATA DEMO"
                  : "VISUALISASI MODEL PRAKIRAAN"}{" "}
                · {reduce || !supported || failed ? "2D" : "3D"}
              </span>
              <h3>
                {mode === "moon"
                  ? `${state.moonIllumination.toFixed(0)}% iluminasi`
                  : mode === "wind"
                    ? `${state.windSpeed.toFixed(1)} knot`
                    : mode === "waves"
                      ? `${state.waveHeight.toFixed(1)} meter`
                      : mode === "rain"
                        ? `${state.precipitationIntensity.toFixed(1)} mm hujan`
                        : weatherLabel(state.weatherCondition)}
              </h3>
              <p>
                {mode === "moon"
                  ? "Fase dihitung astronomis · seret untuk inspeksi"
                  : `Angin dari ${direction(state.windDirection)} · gelombang ${state.waveHeight.toFixed(1)} m`}
              </p>
            </div>
            <div className="marine-compass">
              <span>U</span>
              <Navigation
                size={23}
                style={{ transform: `rotate(${state.windDirection + 180 - 45}deg)` }}
              />
              <span>{state.windSpeed.toFixed(1)} kt</span>
            </div>
          </>
        )}
      </div>
      <div className="time-scrubber">
        <label htmlFor="marine-hour">Waktu lokal</label>
        <input
          id="marine-hour"
          type="range"
          min={0}
          max={23}
          step={1}
          value={hour}
          onChange={(e) => onHour(Number(e.target.value))}
          aria-valuetext={`${String(hour).padStart(2, "0")}:00 WIB`}
        />
        <output htmlFor="marine-hour">{String(hour).padStart(2, "0")}:00 WIB</output>
        <label className="effects-toggle">
          <input type="checkbox" checked={reduce} onChange={(e) => setReduce(e.target.checked)} />
          Kurangi efek (2D)
        </label>
      </div>
    </section>
  );
}
