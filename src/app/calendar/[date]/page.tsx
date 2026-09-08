import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AreaSelector } from "@/components/area-selector";
import { DataNotice, DaySummary, FishCards } from "@/components/forecast/report";
import { DailyExperience } from "@/components/forecast/daily-experience";
import { getDailyReport } from "@/services/forecast.service";
import { dateSchema, areaSchema } from "@/lib/validation";
import { dateLabel } from "@/lib/date";
export async function generateMetadata({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return {
    title: dateSchema.safeParse(date).success
      ? `Kondisi Laut ${dateLabel(date)}`
      : "Tanggal tidak valid",
  };
}
export default async function DailyPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ area?: string }>;
}) {
  const { date } = await params;
  if (!dateSchema.safeParse(date).success) notFound();
  const query = await searchParams,
    area = areaSchema.catch("kepulauan-seribu").parse(query.area),
    report = await getDailyReport(area, date);
  return (
    <div className="page-shell">
      <div className="breadcrumb">
        <Link href="/">Beranda</Link>
        <ChevronRight size={14} />
        <Link href={`/calendar?area=${area}&month=${date.slice(0, 7)}`}>Kalender</Link>
        <ChevronRight size={14} />
        <span>{dateLabel(date, { day: "numeric", month: "short" })}</span>
      </div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BACA LAUT SEBELUM BERANGKAT</div>
          <h1>{dateLabel(date)}</h1>
          <p className="muted">
            {report.forecast.area.name} · {dateLabel(date, { weekday: "long" })} · Waktu Indonesia
            Barat
          </p>
        </div>
        <AreaSelector value={area} />
      </div>
      <DataNotice report={report} />
      <DaySummary report={report} />
      <DailyExperience report={report} />
      <div className="section-block">
        <FishCards report={report} />
      </div>
    </div>
  );
}
