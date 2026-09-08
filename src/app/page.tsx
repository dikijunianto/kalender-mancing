import Link from "next/link";
import { ArrowUpRight, ArrowRight, MapPin, Sunrise, Fish, CalendarDays } from "lucide-react";
import { AreaSelector } from "@/components/area-selector";
import {
  Conditions,
  DataNotice,
  FishCards,
  FishingWindows,
  ForecastStrip,
  SafetyBadge,
  ScoreRing,
} from "@/components/forecast/report";
import { Button } from "@/components/ui/button";
import { getDailyReport, getReports } from "@/services/forecast.service";
import { areaSchema } from "@/lib/validation";
import { dateLabel, today } from "@/lib/date";
export const dynamic = "force-dynamic";
export default async function Home({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const query = await searchParams,
    area = areaSchema.catch("kepulauan-seribu").parse(query.area),
    date = today();
  const [report, reports] = await Promise.all([
    getDailyReport(area, date),
    getReports(area, date, 7),
  ]);
  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="tiny-dot" /> RENCANAKAN TRIP BERIKUTNYA
          </div>
          <h1>
            Kalender Mancing<span className="accent">.</span>
          </h1>
          <p className="muted">
            Cari waktu terbaik untuk mancing berdasarkan kondisi laut, cuaca, arus, pasang surut,
            bulan, dan musim ikan.
          </p>
        </div>
        <AreaSelector value={area} />
      </div>
      <DataNotice report={report} />
      <section className="home-hero">
        <div
          className="hero-ocean"
          role="img"
          aria-label="Permukaan laut biru sebagai latar ilustrasi, bukan kondisi aktual"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-topline">
            <span className="hero-kicker">
              <span className="tiny-dot" /> KONDISI HARI INI
            </span>
            <span>{dateLabel(date, { weekday: "long", day: "numeric", month: "long" })}</span>
          </div>
          <div className="hero-main">
            <div className="hero-copy">
              <div className="hero-location">
                <MapPin size={17} />
                {report.forecast.area.name}
              </div>
              <h2>
                {report.safety.status === "NOT_RECOMMENDED" ? (
                  <>
                    Laut sedang kuat.
                    <br />
                    Pilih hari lain.
                  </>
                ) : (
                  <>
                    Panggilan laut,
                    <br />
                    rencana yang tepat.
                  </>
                )}
              </h2>
              <SafetyBadge safety={report.safety} demo={report.forecast.source === "DEMO"} />
              <div className="hero-facts">
                <div>
                  <Sunrise size={20} />
                  <span>
                    Jam potensial
                    <strong>
                      {report.windows[0]
                        ? `${report.windows[0].start}–${report.windows[0].end}`
                        : "Belum direkomendasikan"}
                    </strong>
                  </span>
                </div>
                <div>
                  <Fish size={20} />
                  <span>
                    Target utama
                    <strong>
                      {report.fish
                        .slice(0, 3)
                        .map((f) => f.species.name)
                        .join(" · ")}
                    </strong>
                  </span>
                </div>
              </div>
              <Button asChild>
                <Link href={`/calendar/${date}?area=${area}`}>
                  Lihat detail hari ini <ArrowUpRight size={17} />
                </Link>
              </Button>
            </div>
            <div className="hero-score">
              <span className="eyebrow">SKOR MANCING</span>
              <ScoreRing score={report.score} large />
              <span className="hero-score-label">{report.score.label}</span>
              <span className="small muted">
                {report.forecast.source === "DEMO"
                  ? "Berdasarkan data simulasi"
                  : "Estimasi berbasis kondisi laut"}
              </span>
            </div>
          </div>
          <div className="hero-bottom">
            <span>
              <span className="tiny-dot" />{" "}
              {report.forecast.source === "DEMO" ? "SIMULASI KONDISI LAUT" : "MODEL PRAKIRAAN LAUT"}
            </span>
            <span>
              {Math.abs(report.forecast.area.latitude).toFixed(2)}° S &nbsp;{" "}
              {report.forecast.area.longitude.toFixed(2)}° E{" "}
              <span className="hero-coordinates-note">· Latar ilustratif</span>
            </span>
          </div>
        </div>
      </section>
      <div className="conditions-heading">
        <span className="eyebrow">SEKILAS KONDISI LAUT</span>
        <span className="muted small">Sampel pukul 06.00 WIB</span>
      </div>
      <Conditions report={report} />
      <section className="section-block">
        <div className="section-title">
          <div>
            <span className="eyebrow">SEDIKIT RENCANA, LEBIH BANYAK PELUANG</span>
            <h2>Pilih hari terbaikmu</h2>
          </div>
          <Link className="text-link" href={`/calendar?area=${area}`}>
            Buka kalender <ArrowUpRight size={16} />
          </Link>
        </div>
        <ForecastStrip reports={reports} />
      </section>
      <div className="home-lower">
        <FishingWindows report={report} />
        <div className="calendar-promo panel">
          <CalendarDays size={29} />
          <div>
            <span className="eyebrow">SATU BULAN, BANYAK PELUANG</span>
            <h2>
              Trip bagus dimulai
              <br />
              dari tanggal yang tepat.
            </h2>
            <Link className="text-link" href={`/calendar?area=${area}`}>
              Jelajahi kalender mancing <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
      <FishCards report={report} />
    </div>
  );
}
