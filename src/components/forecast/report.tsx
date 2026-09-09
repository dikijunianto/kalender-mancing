import Link from "next/link";
import {
  ArrowUpRight,
  Wind,
  Waves,
  Navigation,
  CloudRain,
  Thermometer,
  Moon,
  ShieldCheck,
  ShieldAlert,
  Sunrise,
  Sunset,
  Clock,
  Fish,
  ArrowRight,
  CloudSun,
  Info,
  CircleHelp,
} from "lucide-react";
import type { DailyReport, FishingScore, Safety } from "@/types/fishing";
import { dateLabel, direction, timeLabel, today } from "@/lib/date";
import { cn } from "@/lib/utils";
export function ScoreRing({ score, large = false }: { score: FishingScore; large?: boolean }) {
  return (
    <div
      className={cn("score-ring", large && "score-ring-large")}
      style={{ "--score": score.total ?? 0 } as React.CSSProperties}
    >
      <div>
        <strong>{score.total ?? "—"}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}
export function SafetyBadge({ safety, demo = false }: { safety: Safety; demo?: boolean }) {
  const bad = safety.status === "NOT_RECOMMENDED",
    caution = safety.status === "CAUTION";
  const Icon = bad || caution ? ShieldAlert : ShieldCheck;
  return (
    <span
      className={cn(
        "status-badge",
        bad ? "status-danger" : caution ? "status-caution" : "status-safe",
      )}
    >
      <Icon size={14} />
      {demo ? "Simulasi · " : ""}
      {bad ? "Tidak Direkomendasikan Melaut" : caution ? "Perlu Waspada" : "Dalam Batas Aplikasi"}
    </span>
  );
}
export function DataNotice({ report }: { report: DailyReport }) {
  const { forecast } = report;
  return (
    <div className={cn("data-notice", forecast.source === "UNAVAILABLE" && "notice-unavailable")}>
      <Info size={15} />
      <span>
        {forecast.source === "DEMO" ? (
          <>
            <strong>Mode demo.</strong> Data simulasi, bukan prakiraan aktual. Jangan gunakan untuk
            keputusan melaut.
          </>
        ) : (
          (forecast.notice ?? "Sumber: Open-Meteo · Model prakiraan, bukan pengamatan langsung.")
        )}
      </span>
      {forecast.source !== "DEMO" && forecast.fetchedAt && (
        <span className="notice-time">Diperbarui {timeLabel(forecast.fetchedAt)} WIB</span>
      )}
    </div>
  );
}
export function Conditions({ report }: { report: DailyReport }) {
  const h = report.current;
  const rows = [
    {
      icon: Wind,
      label: "Kecepatan angin",
      value: h?.windSpeed,
      unit: "kt",
      sub: direction(h?.windDirection ?? null),
    },
    {
      icon: Waves,
      label: "Tinggi gelombang",
      value: h?.waveHeight,
      unit: "m",
      sub: h?.wavePeriod ? `Periode ${h.wavePeriod.toFixed(1)} detik` : "Periode belum tersedia",
    },
    {
      icon: Navigation,
      label: "Kecepatan arus",
      value: h?.currentSpeed,
      unit: "kt",
      sub: direction(h?.currentDirection ?? null),
    },
    {
      icon: CloudRain,
      label: "Peluang hujan",
      value: h?.rainProbability,
      unit: "%",
      sub:
        h?.precipitation !== null && h?.precipitation !== undefined
          ? `${h.precipitation.toFixed(1)} mm presipitasi`
          : "Belum tersedia",
    },
    {
      icon: Moon,
      label: "Fase bulan",
      value: report.moon.illumination,
      unit: "%",
      sub: report.moon.name,
    },
    {
      icon: Thermometer,
      label: "Suhu laut",
      value: h?.seaTemperature,
      unit: "°C",
      sub: "Suhu permukaan laut",
    },
  ];
  return (
    <div className="conditions-grid">
      {rows.map((r) => (
        <div className="condition-card" key={r.label}>
          <div className="condition-label">
            <r.icon size={17} />
            <span>{r.label}</span>
          </div>
          <div className="condition-value">
            {r.value === null || r.value === undefined ? "—" : Number(r.value.toFixed(1))}
            <span>{r.unit}</span>
          </div>
          <div className="muted small">{r.sub}</div>
        </div>
      ))}
    </div>
  );
}
export function ScoreBreakdown({ score }: { score: FishingScore }) {
  return (
    <div className="panel breakdown">
      <div className="section-title">
        <h2>Di balik skor mancing</h2>
        <span className="eyebrow">BERBASIS ATURAN</span>
      </div>
      <p className="muted small">Estimasi kondisi, bukan probabilitas tangkapan.</p>
      {score.parts.map((p) => (
        <div className="score-part" key={p.key}>
          <div>
            <span>{p.label}</span>
            <span>
              {p.value ?? "—"}
              <span className="muted"> / {p.weight}</span>
            </span>
          </div>
          <div className="progress-track">
            <i style={{ width: `${p.value === null ? 0 : (p.value / p.weight) * 100}%` }} />
          </div>
        </div>
      ))}
      {score.coverage < 100 && (
        <p className="small muted">
          Cakupan data {score.coverage}%. Skor total menunggu seluruh faktor.
        </p>
      )}
    </div>
  );
}
export function FishingWindows({ report }: { report: DailyReport }) {
  return (
    <section className="panel windows-panel">
      <div className="section-title">
        <h2>Jam potensial</h2>
        <Clock size={17} />
      </div>
      {report.windows.length ? (
        report.windows.map((w, i) => (
          <div className="fishing-window" key={w.start}>
            {i === 0 ? <Sunrise size={28} /> : <Sunset size={28} />}
            <div>
              <span className="muted small">{w.label}</span>
              <strong>
                {w.start} – {w.end}
                <small> WIB</small>
              </strong>
            </div>
            <span className="window-pill">Potensial</span>
          </div>
        ))
      ) : (
        <div className="empty-inline">
          <ShieldAlert size={25} />
          <p>
            {report.safety.status === "NOT_RECOMMENDED"
              ? "Tidak ada rekomendasi melaut karena risiko keselamatan."
              : "Data belum cukup untuk merekomendasikan waktu."}
          </p>
        </div>
      )}
      <p className="muted small window-note">
        Berdasarkan transisi cahaya dan kondisi per jam. Hasil aktual dapat berbeda.
      </p>
    </section>
  );
}
export function FishCards({ report, limit = 3 }: { report: DailyReport; limit?: number }) {
  return (
    <section>
      <div className="section-title">
        <div>
          <span className="eyebrow">KENALI TARGETMU</span>
          <h2>Target ikan hari ini</h2>
        </div>
        <Link className="text-link" href={`/ikan?area=${report.forecast.area.slug}`}>
          Semua ikan <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="fish-grid">
        {report.fish.slice(0, limit).map((f, i) => (
          <Link
            href={`/ikan/${f.species.slug}?area=${report.forecast.area.slug}`}
            key={f.species.slug}
            className={`fish-card fish-color-${i % 3}`}
          >
            <div className="fish-card-top">
              <span className="species-number">0{i + 1} /</span>
              <span className="fish-potential">
                {f.score}/100 · {f.score >= 75 ? "Potensi tinggi" : "Potensi sedang"}
                <i />
              </span>
            </div>
            <div className="fish-art"><img src={f.species.image_url} alt={f.species.name} /></div>
            <div className="fish-info">
              <div>
                <h3>{f.species.name}</h3>
                <span className="muted small">{f.species.techniques.join(" · ")}</span>
              </div>
              <ArrowUpRight size={20} />
            </div>
            <div className="fish-card-footer">
              <span>
                {f.species.min_depth}–{f.species.max_depth} m
              </span>
              <span>Musim editorial</span>
            </div>
            <div className="fish-reason">
              <span>{f.species.habitat}</span>
              <p>{f.reason}</p>
            </div>
          </Link>
        ))}
      </div>
      <p className="muted small editorial-note">
        Rekomendasi awal bersifat editorial. Bukan data keberadaan ikan secara langsung.
      </p>
    </section>
  );
}
export function ForecastStrip({ reports }: { reports: DailyReport[] }) {
  const best = reports
    .filter((r) => r.safety.status !== "NOT_RECOMMENDED" && r.score.total !== null)
    .sort((a, b) => (b.score.total ?? 0) - (a.score.total ?? 0))[0];
  return (
    <div className="forecast-strip">
      {reports.map((r, i) => (
        <Link
          key={r.forecast.date}
          href={`/calendar/${r.forecast.date}?area=${r.forecast.area.slug}`}
          className={cn("forecast-day", best?.forecast.date === r.forecast.date && "forecast-best")}
        >
          <div className="forecast-day-top">
            <span>
              {r.forecast.date === today()
                ? "Hari ini"
                : i === 1
                  ? "Besok"
                  : dateLabel(r.forecast.date, { weekday: "short" })}
            </span>
            <span className="muted">
              {dateLabel(r.forecast.date, { day: "numeric", month: "short" })}
            </span>
          </div>
          <div className="forecast-day-score">
            {r.current?.weatherCode === null || !r.current ? (
              <CircleHelp size={25} aria-label="Cuaca belum tersedia" />
            ) : (r.current.weatherCode ?? 0) >= 51 ? (
              <CloudRain size={25} />
            ) : (
              <CloudSun size={25} />
            )}
            <strong>{r.score.total ?? "—"}</strong>
            <span>/100</span>
          </div>
          <span
            className={r.safety.status === "NOT_RECOMMENDED" ? "danger-text" : "forecast-category"}
          >
            {r.safety.status === "NOT_RECOMMENDED" ? "Hindari melaut" : r.score.label}
          </span>
          {best?.forecast.date === r.forecast.date && (
            <span className="best-label">PILIHAN TERBAIK</span>
          )}
        </Link>
      ))}
    </div>
  );
}
export function DaySummary({ report }: { report: DailyReport }) {
  return (
    <div className="daily-summary panel">
      <div>
        <span className="eyebrow">SKOR MANCING</span>
        <ScoreRing score={report.score} large />
      </div>
      <div className="daily-summary-copy">
        <SafetyBadge safety={report.safety} demo={report.forecast.source === "DEMO"} />
        <h2>
          {report.safety.status === "NOT_RECOMMENDED"
            ? "Utamakan keselamatan."
            : report.score.total !== null && report.score.total >= 70
              ? "Hari yang menjanjikan."
              : report.score.label}
        </h2>
        <p className="muted">{report.safety.reasons.join(" ")}</p>
        <p className="muted small">
          Penilaian keselamatan mencakup kondisi terburuk sepanjang hari.
        </p>
      </div>
    </div>
  );
}
