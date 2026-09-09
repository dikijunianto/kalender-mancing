"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import type { Species } from "@/types/fishing";
export function SpeciesCatalog({ species, area }: { species: Species[]; area: string }) {
  const [search, setSearch] = useState("");
  const filtered = species.filter((s) =>
    `${s.name} ${s.scientific_name} ${s.techniques.join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="species-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Cari ikan atau teknik mancing…"
          aria-label="Cari ikan atau teknik mancing"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="fish-grid">
        {filtered.map((s, i) => (
          <Link
            href={`/ikan/${s.slug}?area=${area}`}
            className={`fish-card fish-color-${i % 3}`}
            key={s.slug}
          >
            <div className="fish-card-top">
              <span className="species-number">{s.scientific_name}</span>
              <span className="fish-potential">Panduan awal</span>
            </div>
            <div className="fish-art"><img src={s.image_url} alt={s.name} /></div>
            <div className="fish-info">
              <div>
                <h3>{s.name}</h3>
                <span className="muted small">{s.techniques.join(" · ")}</span>
              </div>
              <ArrowUpRight size={20} />
            </div>
            <div className="fish-card-footer">
              <span>
                {s.min_depth}–{s.max_depth} m
              </span>
              <span>
                {s.preferred_temperature_min}–{s.preferred_temperature_max}°C
              </span>
            </div>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-inline">
          <Search size={25} />
          <p>Tidak ada ikan yang cocok dengan pencarian. Coba nama atau teknik lain.</p>
        </div>
      )}
    </>
  );
}
