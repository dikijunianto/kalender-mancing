import Link from "next/link";
import { notFound } from "next/navigation";
import { Fish } from "lucide-react";
import { areas, species } from "@/config/data";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fish = species.find((s) => s.slug === slug);
  return { title: fish ? `${fish.name} — Teknik, Habitat & Musim` : "Ikan tidak ditemukan" };
}
export default async function FishDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    s = species.find((f) => f.slug === slug);
  if (!s) notFound();
  return (
    <div className="page-shell">
      <div className="breadcrumb">
        <Link href="/ikan">Ensiklopedia ikan</Link>
        <span>/</span>
        <span>{s.name}</span>
      </div>
      <div className="species-detail-header">
        <Fish size={120} strokeWidth={0.9} />
        <div>
          <div className="eyebrow">PANDUAN EDITORIAL</div>
          <h1>{s.name}</h1>
          <i className="muted small">{s.scientific_name}</i>
          <p className="muted">{s.description}</p>
        </div>
      </div>
      <div className="info-grid">
        <div className="panel">
          <h3>Habitat</h3>
          <strong>{s.habitat}</strong>
        </div>
        <div className="panel">
          <h3>Kedalaman editorial</h3>
          <strong>
            {s.min_depth}–{s.max_depth} meter
          </strong>
        </div>
        <div className="panel">
          <h3>Preferensi suhu editorial</h3>
          <strong>
            {s.preferred_temperature_min}–{s.preferred_temperature_max}°C
          </strong>
        </div>
      </div>
      <div className="home-lower">
        <section className="panel">
          <div className="section-title">
            <h2>Teknik mancing</h2>
          </div>
          <div className="tags">
            {s.techniques.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="section-title">
            <h2>Umpan & lure</h2>
          </div>
          <div className="tags">
            {s.bait.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="section-title">
          <h2>Kalender musim</h2>
          <span className="eyebrow">SUMBER: EDITORIAL</span>
        </div>
        <p className="muted small">
          Skor kesesuaian awal per bulan. Belum divalidasi dengan data tangkapan lokal.
        </p>
        <div className="season-grid">
          {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"].map(
            (m, i) => (
              <div key={m} className={`season-month ${s.months.includes(i + 1) ? "good" : ""}`}>
                {m}
                <strong>{s.months.includes(i + 1) ? 85 : 55}</strong>
              </div>
            ),
          )}
        </div>
      </section>
      <section className="section-block">
        <div className="section-title">
          <h2>Area yang sesuai</h2>
        </div>
        <div className="tags">
          {areas
            .filter((a) => s.areas.includes(a.slug))
            .map((a) => (
              <Link className="tag" href={`/area/${a.slug}`} key={a.slug}>
                {a.name} ↗
              </Link>
            ))}
        </div>
        <p className="small muted" style={{ marginTop: 17 }}>
          Pilihan area dan musim merupakan panduan editorial. Perhatikan peraturan setempat, ukuran
          tangkapan, dan praktik tangkap-lepas yang bertanggung jawab.
        </p>
      </section>
    </div>
  );
}
