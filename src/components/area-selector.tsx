"use client";
import { MapPin, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { areas } from "@/config/data";
export function AreaSelector({ value }: { value: string }) {
  const router = useRouter(),
    path = usePathname(),
    search = useSearchParams();
  return (
    <div className="area-select">
      <MapPin size={17} />
      <select
        aria-label="Pilih area mancing"
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(search);
          next.set("area", e.target.value);
          router.push(`${path.startsWith("/area/") ? `/area/${e.target.value}` : path}?${next}`);
        }}
      >
        {areas.map((a) => (
          <option value={a.slug} key={a.slug}>
            {a.name}
          </option>
        ))}
      </select>
      <ChevronDown size={15} />
    </div>
  );
}
