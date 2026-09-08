"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyReport } from "@/types/fishing";
import { timeLabel } from "@/lib/date";
export function TideChart({ report, hour }: { report: DailyReport; hour: number }) {
  const data = report.tides.map((t) => ({
    hour: Number(timeLabel(t.timestamp).slice(0, 2)),
    height: t.height,
  }));
  return (
    <section className="panel">
      <div className="section-title">
        <h2>Pasang surut</h2>
        <span className="eyebrow">24 JAM · WIB</span>
      </div>
      <p className="small muted">
        {report.forecast.source === "DEMO"
          ? "Kurva simulasi pasang surut."
          : "Tinggi muka laut model, relatif terhadap muka laut rata-rata."}
      </p>
      {data.length ? (
        <>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="tide-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c7e9a0" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#c7e9a0" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#293b3c" vertical={false} strokeDasharray="3 6" />
                <XAxis
                  dataKey="hour"
                  type="number"
                  domain={[0, 23]}
                  ticks={[0, 6, 12, 18, 23]}
                  tickFormatter={(v) => `${String(v).padStart(2, "0")}:00`}
                  tick={{ fill: "#8fa9a7", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8fa9a7", fontSize: 10 }}
                  tickFormatter={(v) => `${v}m`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#13292e",
                    border: "1px solid #40544e",
                    borderRadius: 7,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => `${String(v).padStart(2, "0")}:00 WIB`}
                  formatter={(v) => [`${v} m`, "Muka laut"]}
                />
                {report.windows.map((w) => (
                  <ReferenceArea
                    key={w.start}
                    x1={Number(w.start.slice(0, 2)) + Number(w.start.slice(3)) / 60}
                    x2={Number(w.end.slice(0, 2)) + Number(w.end.slice(3)) / 60}
                    fill="#d5ef9a"
                    fillOpacity={0.04}
                  />
                ))}
                <ReferenceLine x={hour} stroke="#d5ef9a" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="height"
                  stroke="#c7e9a0"
                  strokeWidth={2}
                  fill="url(#tide-fill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="tide-extrema">
            {report.tides
              .filter((t) => t.type !== "NORMAL")
              .map((t) => (
                <span key={t.timestamp}>
                  {t.type === "HIGH" ? "↑ Pasang" : "↓ Surut"}
                  <strong>{timeLabel(t.timestamp)}</strong> · {t.height.toFixed(2)} m
                </span>
              ))}
          </div>
        </>
      ) : (
        <div className="empty-inline">
          Data pasang surut belum tersedia. Tidak ada kurva buatan untuk prakiraan aktual.
        </div>
      )}
      <p className="small muted" style={{ marginTop: 15, fontSize: 11 }}>
        Waktu ekstrem beresolusi satu jam. Bukan datum navigasi; tidak untuk menghitung kedalaman
        aman. Area arsiran menunjukkan jam potensial berbasis cahaya dan cuaca.
      </p>
    </section>
  );
}
