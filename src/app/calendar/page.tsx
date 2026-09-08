import type { Metadata } from "next";
import { AreaSelector } from "@/components/area-selector";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DataNotice } from "@/components/forecast/report";
import { getReports } from "@/services/forecast.service";
import { today } from "@/lib/date";
import { areaSchema, monthSchema } from "@/lib/validation";
export const metadata: Metadata = { title: "Kalender Mancing" };
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; month?: string }>;
}) {
  const query = await searchParams,
    area = areaSchema.catch("kepulauan-seribu").parse(query.area),
    month = monthSchema.catch(today().slice(0, 7)).parse(query.month),
    [y, m] = month.split("-").map(Number);
  const reports = await getReports(area, `${month}-01`, new Date(y, m, 0).getDate());
  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">TEMUKAN MOMEN TERBAIK</div>
          <h1>
            Kalender mancing<span className="accent">.</span>
          </h1>
          <p className="muted">
            Rencanakan perjalanan mengikuti ritme laut. Pilih tanggal untuk melihat detail.
          </p>
        </div>
        <AreaSelector value={area} />
      </div>
      <DataNotice report={reports.find((r) => r.forecast.source !== "UNAVAILABLE") ?? reports[0]} />
      <MonthCalendar month={month} area={area} reports={reports} />
    </div>
  );
}
