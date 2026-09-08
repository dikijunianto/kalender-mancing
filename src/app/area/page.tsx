import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { areas } from "@/config/data";
export const metadata = { title: "Area Mancing" };
export default function AreasPage() {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DUA AREA, BANYAK CERITA</div>
          <h1>
            Temukan perairanmu<span className="accent">.</span>
          </h1>
          <p className="muted">
            Prakiraan dan rekomendasi khusus untuk area mancing di utara Jakarta dan Jawa Barat.
          </p>
        </div>
      </div>
      <div className="area-grid">
        {areas.map((a) => (
          <Link className="area-card" key={a.slug} href={`/area/${a.slug}`}>
            <MapPin size={30} />
            <div className="eyebrow">{a.marine_zone_name}</div>
            <h2>{a.name}</h2>
            <p>{a.description}</p>
            <span className="text-link">
              Jelajahi area <ArrowUpRight size={17} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
