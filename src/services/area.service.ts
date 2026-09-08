import { areas } from "@/config/data";
export function getArea(slug: string) {
  const area = areas.find((a) => a.slug === slug);
  if (!area) throw new Error("Area tidak ditemukan");
  return area;
}
export function getAreas() {
  return areas;
}
