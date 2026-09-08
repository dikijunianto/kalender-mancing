import { z } from "zod";
export const dateSchema = z.iso.date();
export const areaSchema = z.enum(["kepulauan-seribu", "bekasi-karawang"]);
export const forecastQuery = z.object({
  area: areaSchema.default("kepulauan-seribu"),
  date: dateSchema,
});
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .refine(
    (v) => Number(v.slice(0, 4)) >= 2000 && Number(v.slice(0, 4)) <= 2100,
    "Tahun harus 2000–2100",
  );
export const logSchema = z.object({
  area_id: z.uuid(),
  species_id: z.uuid(),
  date: dateSchema,
  spot_name: z.string().trim().max(120).optional(),
  catch_count: z.number().int().min(0).max(10000),
  weight: z.number().min(0).max(10000).nullable().optional(),
  strike_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  technique: z.string().trim().min(1).max(100),
  bait: z.string().trim().max(100),
  depth: z.number().min(0).max(2000).nullable().optional(),
  notes: z.string().trim().max(2000).optional(),
});
