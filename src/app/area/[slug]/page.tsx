import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { areas } from "@/config/data";
import { getReports } from "@/services/forecast.service";
import {
  Conditions,
  DataNotice,
  DaySummary,
  FishCards,
  ForecastStrip,
} from "@/components/forecast/report";
import { AreaSelector } from "@/components/area-selector";
import { dateLabel, today } from "@/lib/date";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: areas.find((a) => a.slug === slug)?.name ?? "Area tidak ditemukan" };
}
export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    area = areas.find((a) => a.slug === slug);
  if (!area) notFound();
  const reports = await getReports(slug, today(), 7),
    report = reports[0],
    best = [...reports]
      .filter((r) => r.safety.status !== "NOT_RECOMMENDED" && r.score.total !== null)
      .sort((a, b) => (b.score.total ?? 0) - (a.score.total ?? 0))
      .slice(0, 3);
  return (
    <div className="page-shell">
      <div className="breadcrumb">
        <Link href="/area">Area mancing</Link>
        <span>/</span>
        <span>{area.name}</span>
      </div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">{area.marine_zone_name}</div>
          <h1>
            {area.name}
            <span className="accent">.</span>
          </h1>
          <p className="muted">{area.description}</p>
        </div>
        <AreaSelector value={slug} />
      </div>
      <DataNotice report={report} />
      <DaySummary report={report} />
      <Conditions report={report} />
      <section className="section-block">
        <div className="section-title">
          <h2>Tujuh hari ke depan</h2>
          <Link className="text-link" href={`/calendar?area=${slug}`}>
            Buka kalender <ArrowUpRight size={15} />
          </Link>
        </div>
        <ForecastStrip reports={reports} />
      </section>
      <section className="section-block">
        <div className="section-title">
          <h2>Tiga pilihan minggu ini</h2>
          <span className="eyebrow">RISIKO KESELAMATAN DISARING</span>
        </div>
        {best.length ? (
          <div className="info-grid">
            {best.map((r, i) => (
              <Link
                className="panel"
                href={`/calendar/${r.forecast.date}?area=${slug}`}
                key={r.forecast.date}
              >
                <span className="eyebrow">PILIHAN 0{i + 1}</span>
                <h3 style={{ marginTop: 10 }}>
                  {dateLabel(r.forecast.date, { weekday: "long", day: "numeric", month: "short" })}
                </h3>
                <strong className="accent">{r.score.total} / 100</strong>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">Belum ada tanggal dengan data lengkap di bawah batas risiko.</p>
        )}
      </section>
      <FishCards report={report} />
    </div>
  );
}
