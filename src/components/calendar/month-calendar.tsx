import Link from "next/link";
import { ChevronLeft, ChevronRight, CloudRain, CloudSun, ShieldAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dateLabel, today } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { DailyReport } from "@/types/fishing";
export function MonthCalendar({
  month,
  area,
  reports,
}: {
  month: string;
  area: string;
  reports: DailyReport[];
}) {
  const [year, m] = month.split("-").map(Number),
    offset = (new Date(year, m - 1, 1).getDay() + 6) % 7;
  const neighbor = (delta: number) => {
    const d = new Date(year, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  return (
    <>
      <div className="calendar-toolbar">
        <h2>{dateLabel(`${month}-01`, { month: "long", year: "numeric" })}</h2>
        <div className="month-controls">
          <Button variant="outline" size="icon" asChild>
            <Link
              aria-label="Bulan sebelumnya"
              href={`/calendar?area=${area}&month=${neighbor(-1)}`}
            >
              <ChevronLeft size={17} />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/calendar?area=${area}&month=${today().slice(0, 7)}`}>Bulan ini</Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link
              aria-label="Bulan berikutnya"
              href={`/calendar?area=${area}&month=${neighbor(1)}`}
            >
              <ChevronRight size={17} />
            </Link>
          </Button>
        </div>
      </div>
      <div className="calendar-grid">
        {["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"].map((d) => (
          <div className="weekday" key={d}>
            {d}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div className="calendar-cell calendar-empty" key={`empty-${i}`} aria-hidden="true" />
        ))}
        {reports.map((r) => {
          const danger = r.safety.status === "NOT_RECOMMENDED";
          return (
            <Link
              className={cn("calendar-cell", r.forecast.date === today() && "calendar-today")}
              key={r.forecast.date}
              href={`/calendar/${r.forecast.date}?area=${area}`}
              aria-label={`${dateLabel(r.forecast.date)}, skor ${r.score.total ?? "belum tersedia"}, ${danger ? "tidak direkomendasikan melaut" : r.score.label}`}
            >
              <div className="calendar-cell-date">
                <span>{Number(r.forecast.date.slice(8))}</span>
                {danger ? (
                  <ShieldAlert size={15} className="danger-text" />
                ) : r.current?.weatherCode !== null && (r.current?.weatherCode ?? 0) >= 51 ? (
                  <CloudRain size={16} />
                ) : r.current ? (
                  <CloudSun size={16} />
                ) : null}
              </div>
              <div className={cn("calendar-cell-score", danger && "danger-text")}>
                <strong>{r.score.total ?? "—"}</strong>
                <span>/ 100</span>
              </div>
              <div className={cn("calendar-cell-label", danger && "danger-text")}>
                <i />
                {danger ? "Hindari melaut" : r.score.label}
              </div>
            </Link>
          );
        })}
        {Array.from({ length: (7 - ((offset + reports.length) % 7)) % 7 }, (_, i) => (
          <div className="calendar-cell calendar-empty" key={`tail-${i}`} aria-hidden="true" />
        ))}
      </div>
      <div className="calendar-legend">
        {[
          ["#d5ef9a", "85–100 Sangat bagus"],
          ["#a9c88e", "70–84 Bagus"],
          ["#d4c886", "55–69 Lumayan"],
          ["#d6a880", "40–54 Kurang"],
          ["#ffa196", "0–39 Buruk / risiko"],
        ].map(([color, label]) => (
          <span key={label}>
            <i style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
      <div className="calendar-context">
        <Info size={17} />
        <p>
          Keselamatan selalu lebih penting dari skor mancing. Pada mode aktual, tanggal di luar
          jangkauan prakiraan ditampilkan tanpa skor. Pilih tanggal untuk rincian kondisi laut dan
          waktu potensial.
        </p>
      </div>
    </>
  );
}
