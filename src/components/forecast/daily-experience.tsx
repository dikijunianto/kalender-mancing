"use client";
import { useState } from "react";
import { MarineView } from "@/components/marine/marine-view";
import { TideChart } from "@/components/marine/tide-chart";
import { Conditions, FishingWindows, ScoreBreakdown } from "./report";
import type { DailyReport } from "@/types/fishing";
import { timeLabel } from "@/lib/date";
export function DailyExperience({ report }: { report: DailyReport }) {
  const [hour, setHour] = useState(6);
  return (
    <>
      <MarineView report={report} hour={hour} onHour={setHour} />
      <div className="conditions-heading">
        <span className="eyebrow">KONDISI LAUT PER JAM</span>
        <span className="muted small">{String(hour).padStart(2, "0")}:00 WIB</span>
      </div>
      <Conditions report={{ ...report, current: report.forecast.hours[hour] ?? null }} />
      <div className="detail-columns">
        <div className="detail-stack">
          <TideChart report={report} hour={hour} />
          <section className="panel">
            <div className="section-title">
              <h2>Fase bulan</h2>
              <span className="eyebrow">PERHITUNGAN ASTRONOMIS</span>
            </div>
            <h3>
              {report.moon.name} <span className="accent">· {report.moon.illumination}%</span>
            </h3>
            <div className="moon-details">
              <div className="muted">
                Bulan terbit<strong>{timeLabel(report.moon.moonrise)}</strong>
              </div>
              <div className="muted">
                Bulan terbenam<strong>{timeLabel(report.moon.moonset)}</strong>
              </div>
              <div className="muted">
                Matahari terbit<strong>{timeLabel(report.moon.sunrise)}</strong>
              </div>
              <div className="muted">
                Matahari terbenam<strong>{timeLabel(report.moon.sunset)}</strong>
              </div>
            </div>
            <p className="muted small">
              Aktivitas ikan dapat dipengaruhi oleh pencahayaan malam dan perubahan pasang, tetapi
              kondisi aktual dapat berbeda. Iluminasi ringkasan dihitung pukul 12.00 WIB; bulan 3D
              mengikuti jam pilihan.
            </p>
          </section>
        </div>
        <div className="detail-stack">
          <FishingWindows report={report} />
          <ScoreBreakdown score={report.score} />
        </div>
      </div>
    </>
  );
}
