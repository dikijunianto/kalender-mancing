import { NextRequest, NextResponse } from "next/server";
import { areas } from "@/config/data";
import { getArea } from "@/services/area.service";
import { getDailyReport, getReports } from "@/services/forecast.service";
import { getMoon } from "@/services/moon.service";
import { areaSchema, dateSchema, monthSchema } from "@/lib/validation";
import { today } from "@/lib/date";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params;
  if (!["areas", "forecast", "calendar", "species", "tides", "moon"].includes(resource))
    return NextResponse.json({ error: "Endpoint tidak ditemukan" }, { status: 404 });
  if (resource === "areas") return NextResponse.json(areas);
  const area = areaSchema.safeParse(request.nextUrl.searchParams.get("area") ?? "kepulauan-seribu"),
    date = dateSchema.safeParse(request.nextUrl.searchParams.get("date") ?? today());
  if (!area.success || !date.success)
    return NextResponse.json({ error: "Area atau tanggal tidak valid" }, { status: 400 });
  try {
    if (resource === "moon") return NextResponse.json(getMoon(date.data, getArea(area.data)));
    if (resource === "calendar") {
      const month = monthSchema.safeParse(
        request.nextUrl.searchParams.get("month") ?? today().slice(0, 7),
      );
      if (!month.success) return NextResponse.json({ error: "Bulan tidak valid" }, { status: 400 });
      const count = new Date(
        Number(month.data.slice(0, 4)),
        Number(month.data.slice(5, 7)),
        0,
      ).getDate();
      const reports = await getReports(area.data, `${month.data}-01`, count);
      return NextResponse.json(
        reports.map((r) => ({
          date: r.forecast.date,
          score: r.score,
          safety: r.safety,
          source: r.forecast.source,
          weather: r.current?.weatherCode ?? null,
        })),
        { headers: { "Cache-Control": "public, max-age=300" } },
      );
    }
    const report = await getDailyReport(area.data, date.data);
    const data =
      resource === "species"
        ? { species: report.fish, source: "EDITORIAL" }
        : resource === "tides"
          ? {
              tides: report.tides,
              source: report.forecast.source,
              notice: "Tinggi relatif terhadap muka laut rata-rata; bukan datum navigasi.",
            }
          : report;
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Data sementara tidak tersedia" }, { status: 503 });
  }
}
