import { species } from "@/config/data";
import { SpeciesCatalog } from "@/components/species/species-catalog";
import { AreaSelector } from "@/components/area-selector";
import { areaSchema } from "@/lib/validation";
export const metadata = { title: "Kenali Target Ikan" };
export default async function SpeciesPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const query = await searchParams,
    area = areaSchema.catch("kepulauan-seribu").parse(query.area);
  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <div className="eyebrow">KENALI IKAN, SIAPKAN STRATEGI</div>
          <h1>
            Setiap ikan punya cerita<span className="accent">.</span>
          </h1>
          <p className="muted">
            Habitat, teknik, umpan, dan kalender musim untuk target mancingmu.
          </p>
        </div>
        <AreaSelector value={area} />
      </div>
      <p className="data-notice">
        Panduan dan rentang preferensi awal bersifat editorial, bukan hasil survei lokal atau
        jaminan keberadaan ikan.
      </p>
      <SpeciesCatalog species={species.filter((s) => s.areas.includes(area))} area={area} />
    </div>
  );
}
